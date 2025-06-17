import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Timestamp } from 'firebase/firestore';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const convertTimestamp = (data) => {
    return {
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt || new Date().toISOString(),
    };
  };

  const querySnapshot = await getDocs(collection(db, 'products'));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamp(doc.data() || {}),
  }));
});

export const deleteProduct = createAsyncThunk('products/deleteProduct', async (id) => {
  await deleteDoc(doc(db, 'products', id));
  return id;
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
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const { openPopup, closePopup, addProduct, updateProduct } = productsSlice.actions;
export default productsSlice.reducer;
