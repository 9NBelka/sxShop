import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthState, clearUser } from './store/slices/authSlice';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { PATHS, ROLES } from './constants';
import Home from './components/DashBoardComponents/Home/Home';
import Orders from './components/DashBoardComponents/Orders/Orders';
import Clients from './components/DashBoardComponents/Clients/Clients';
import Products from './components/DashBoardComponents/Products/Products';
import Promocodes from './components/DashBoardComponents/Promocodes/Promocodes';

// Ленивая загрузка компонентов
const SignIn = lazy(() => import('./pages/SignIn/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp/SignUp'));
const Account = lazy(() => import('./pages/Account/Account'));
const DashBoard = lazy(() => import('./pages/DashBoard/DashBoard'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // Пока проверка аутентификации не завершена, не рендерить ничего
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='spinner' aria-label='Проверка аутентификации...'>
          Загрузка...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.SIGNIN} replace />;
  }

  const firestoreRole = user?.role || ROLES.CLIENT;

  if (!allowedRoles.includes(firestoreRole)) {
    return <Navigate to={PATHS.FORBIDDEN} replace />;
  }

  return children;
};

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
      navigate(PATHS.SIGNIN);
    } catch (error) {
      console.error('Ошибка при выходе:', error.message);
    }
  };

  // Показываем индикатор загрузки, пока проверяется аутентификация
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='spinner' aria-label='Инициализация приложения...'>
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={<div className='min-h-screen flex items-center justify-center'>Загрузка...</div>}>
      <Routes>
        <Route path={PATHS.SIGNIN} element={<SignIn />} />
        <Route path={PATHS.SIGNUP} element={<SignUp />} />
        <Route
          path={PATHS.ACCOUNT}
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <Account handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MODERATOR]}>
              <DashBoard handleLogout={handleLogout} />
            </ProtectedRoute>
          }>
          <Route index element={<Navigate to={`${PATHS.DASHBOARD}/home`} replace />} />
          <Route path='home' element={<Home />} />
          <Route path='orders' element={<Orders />} />
          <Route path='products' element={<Products />} />
          <Route path='promocodes' element={<Promocodes />} />
          <Route path='clients' element={<Clients />} />
        </Route>
        <Route
          path={PATHS.FORBIDDEN}
          element={
            <div className='min-h-screen flex items-center justify-center bg-gray-100'>
              <div className='text-2xl font-semibold text-red-600'>Доступ запрещен</div>
            </div>
          }
        />
        <Route
          path={PATHS.HOME}
          element={<Navigate to={isAuthenticated ? PATHS.ACCOUNT : PATHS.SIGNIN} replace />}
        />
      </Routes>
    </Suspense>
  );
}
