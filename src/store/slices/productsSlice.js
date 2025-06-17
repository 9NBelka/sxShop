import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
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

export const addProduct = createAsyncThunk('products/addProduct', async (productData) => {
  const newDocRef = doc(collection(db, 'products'));
  const productWithId = {
    ...productData,
    id: newDocRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newDocRef, productWithId);
  return productWithId;
});

export const updateProduct = createAsyncThunk('products/updateProduct', async (productData) => {
  const productRef = doc(db, 'products', productData.id);
  await updateDoc(productRef, productData);
  return productData;
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
      })
      .addCase(addProduct.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateProduct.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { openPopup, closePopup } = productsSlice.actions;
export default productsSlice.reducer;
