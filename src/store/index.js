import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import filtersReducer from './slices/filtersSlice'; // Импортируем новый слайс
import promocodesReducer from './slices/promocodesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    categories: categoriesReducer,
    filters: filtersReducer, // Добавляем фильтры
    promocodes: promocodesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/checkAuthState/fulfilled', 'auth/setUser'],
        ignoredPaths: ['auth.user'],
        // serializableCheck: false,
      },
    }),
});

export default store;
