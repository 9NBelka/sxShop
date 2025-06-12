import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ROLES } from '../../constants';

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { dispatch, getState }) => {
    const { auth: currentState } = getState();
    return new Promise((resolve, reject) => {
      dispatch(setLoading(true)); // Устанавливаем loading в true в начале
      const unsubscribe = auth.onAuthStateChanged(
        async (user) => {
          try {
            if (user) {
              // Проверка кэша
              if (currentState.user && currentState.user.uid === user.uid) {
                resolve(currentState.user);
                return;
              }

              if (!user.emailVerified) {
                dispatch(clearUser());
                resolve(null);
                return;
              }

              const idTokenResult = await user.getIdTokenResult();
              const claimsRole = idTokenResult.claims?.role || null;

              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (!userDoc.exists()) {
                dispatch(clearUser());
                resolve(null);
                return;
              }

              const userData = userDoc.data();
              const firestoreRole = userData.role || ROLES.CLIENT;
              const name = userData.name || '';
              const role = claimsRole || firestoreRole;

              const userPayload = { uid: user.uid, email: user.email, name, role };
              dispatch(setUser(userPayload));
              resolve(userPayload);
            } else {
              dispatch(clearUser());
              resolve(null);
            }
          } catch (error) {
            dispatch(setError(error.message || 'Authentication check failed.'));
            reject(error);
          } finally {
            dispatch(setLoading(false)); // Сбрасываем loading в конце
            unsubscribe();
          }
        },
        (error) => {
          dispatch(setError(error.message || 'Authentication state error.'));
          dispatch(setLoading(false));
          reject(error);
        },
      );
    });
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true, // Изначально true, чтобы ждать проверки аутентификации
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.error = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Authentication check failed.';
      });
  },
});

export const { setUser, setLoading, setError, clearUser } = authSlice.actions;
export default authSlice.reducer;
