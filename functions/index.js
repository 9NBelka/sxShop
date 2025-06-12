import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import cors from 'cors';

// Handle Node.js warnings
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});

// Initialize Firebase Admin
initializeApp();
const adminAuth = getAuth();

// Configure CORS
const corsHandler = cors({ origin: 'http://localhost:5173' });

// Function to set custom claims for user roles
export const setCustomClaims = onRequest({ region: 'europe-west1' }, (req, res) => {
  corsHandler(req, res, async () => {
    // Restrict to POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Verify authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      // Verify the caller's token and check admin role
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const userDoc = await adminAuth.getUser(userId);
      if (!userDoc.customClaims || userDoc.customClaims.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can set custom claims' });
      }

      // Validate request body
      const { uid, role } = req.body;
      if (!uid || !['client', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({ message: 'Missing or invalid UID or role' });
      }

      // Set custom claims
      await adminAuth.setCustomUserClaims(uid, { role });
      return res
        .status(200)
        .json({ message: `Custom claims set for user ${uid} with role ${role}` });
    } catch (error) {
      console.error('Error setting custom claims:', error);
      return res.status(500).json({ message: `Error setting custom claims: ${error.message}` });
    }
  });
});
