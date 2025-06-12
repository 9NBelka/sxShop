import { useState, useCallback, useEffect } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setError, clearUser } from '../store/slices/authSlice';
import { debounce } from 'lodash';
import { PATHS, ROLES } from '../constants';

export const useSignUp = () => {
  const [email, setEmailState] = useState('');
  const [password, setPasswordState] = useState('');
  const [name, setNameState] = useState('');
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
  const setName = useCallback(
    debounce((value) => setNameState(value), 10),
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setError(null));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      dispatch(setError('Пожалуйста, введите действительный email.'));
      dispatch(setLoading(false));
      return;
    }

    const passwordRegex = /^.{6,}$/;
    if (!passwordRegex.test(password)) {
      dispatch(setError('Пароль должен содержать минимум 6 символов.'));
      dispatch(setLoading(false));
      return;
    }

    try {
      console.log('Попытка регистрации:', { email, password });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name,
        role: ROLES.CLIENT,
        createdAt: new Date().toISOString(),
      });

      // Выход из аккаунта после регистрации, чтобы пользователь не был автоматически авторизирован
      await signOut(auth);
      dispatch(clearUser());

      alert('Регистрация успешна! Пожалуйста, подтвердите email.');
      navigate(PATHS.SIGNIN);
    } catch (error) {
      console.error('Ошибка регистрации:', error.code, error.message);
      let errorMessage = 'Не удалось зарегистрироваться. Попробуйте снова.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Этот email уже зарегистрирован. Войдите или используйте другой email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Недействительный email. Проверьте и попробуйте снова.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Пароль слишком слабый. Используйте минимум 6 символов.';
          break;
        case 'permission-denied':
          errorMessage = 'Ошибка записи данных. Проверьте права доступа Firestore.';
          break;
        default:
          errorMessage = `Ошибка: ${error.message}`;
      }
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { email, setEmail, password, setPassword, name, setName, error, loading, handleSignUp };
};
