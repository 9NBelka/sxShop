import { useState, useCallback, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auth, db } from '../firebase';
import { setLoading, setError, setUser, clearUser } from '../store/slices/authSlice';
import { doc, getDoc } from 'firebase/firestore';
import { debounce } from 'lodash';
import { PATHS, ROLES } from '../constants';

export const useSignIn = () => {
  const [email, setEmailState] = useState('');
  const [password, setPasswordState] = useState('');
  const dispatch = useDispatch();
  const { error, loading, isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Debounce для обработки ввода
  const setEmail = useCallback(
    debounce((value) => setEmailState(value), 10),
    [],
  );
  const setPassword = useCallback(
    debounce((value) => setPasswordState(value), 10),
    [],
  );

  // Перенаправление аутентифицированного пользователя
  useEffect(() => {
    if (loading) return; // Ждем завершения проверки аутентификации
    if (isAuthenticated && user) {
      const role = user.role || ROLES.CLIENT;
      if (role === ROLES.CLIENT) {
        navigate(PATHS.ACCOUNT, { replace: true });
      } else if ([ROLES.ADMIN, ROLES.MODERATOR].includes(role)) {
        navigate(PATHS.DASHBOARD, { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        dispatch(clearUser());
        dispatch(setError('Пожалуйста, подтвердите ваш email перед входом.'));
        return;
      }

      const idTokenResult = await user.getIdTokenResult();
      const claimsRole = idTokenResult.claims?.role || null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        dispatch(clearUser());
        dispatch(setError('Данные пользователя не найдены. Обратитесь к администратору.'));
        return;
      }

      const userData = userDoc.data();
      const firestoreRole = userData.role || ROLES.CLIENT;
      const name = userData.name || '';

      const role = claimsRole || firestoreRole;
      if (role === ROLES.CLIENT) {
        navigate(PATHS.ACCOUNT);
      } else if ([ROLES.ADMIN, ROLES.MODERATOR].includes(role)) {
        navigate(PATHS.DASHBOARD);
      } else {
        await signOut(auth);
        dispatch(clearUser());
        dispatch(setError('Недостаточно прав для входа. Обратитесь к администратору.'));
        return;
      }

      dispatch(
        setUser({
          uid: user.uid,
          email: user.email,
          name,
          role,
        }),
      );
    } catch (error) {
      console.error('Ошибка входа:', error.code, error.message);
      let errorMessage = 'Не удалось войти. Проверьте email и пароль.';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Недействительный email.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Пользователь не найден.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Неверный пароль.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Неверные учетные данные.';
          break;
        default:
          errorMessage = `Ошибка: ${error.message}`;
      }

      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      dispatch(setError('Пожалуйста, введите email для сброса пароля.'));
      return;
    }
    dispatch(setLoading(true));
    try {
      await sendPasswordResetEmail(auth, email);
      dispatch(setError(null));
      alert('Письмо для сброса пароля отправлено.');
    } catch (error) {
      console.error('Ошибка сброса пароля:', error.code, error.message);
      let errorMessage = 'Ошибка при сбросе пароля.';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Недействительный email.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Пользователь не найден.';
          break;
        default:
          errorMessage = `Ошибка: ${error.message}`;
      }

      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSignIn,
    handleResetPassword,
  };
};
