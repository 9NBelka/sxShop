import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Timestamp } from 'firebase/firestore';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const querySnapshot = await getDocs(collection(db, 'products'));
  return querySnapshot.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      ...data,
      createdAt:
        (data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt) || new Date().toISOString(),
    };
  });
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    isPopupOpen: false,
    editingProduct: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    openPopup: (state, action) => {
      state.isPopupOpen = true;
      state.editingProduct = action.payload || null;
    },
    closePopup: (state) => {
      state.isPopupOpen = false;
      state.editingProduct = null;
    },
    addProduct: (state, action) => {
      state.items.push(action.payload);
    },
    updateProduct: (state, action) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    deleteProduct: (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { openPopup, closePopup, addProduct, updateProduct, deleteProduct } =
  productsSlice.actions;
export default productsSlice.reducer;
