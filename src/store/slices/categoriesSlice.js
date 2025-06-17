import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async () => {
  const querySnapshot = await getDocs(collection(db, 'productCategories'));
  return querySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      if (!data.name) {
        console.warn(`Категория с ID ${doc.id} не имеет имени`);
        return null;
      }
      return { id: doc.id, name: data.name };
    })
    .filter(Boolean);
});

export const addCategory = createAsyncThunk('categories/addCategory', async (name) => {
  const docRef = await addDoc(collection(db, 'productCategories'), { name });
  return { id: docRef.id, name };
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export default categoriesSlice.reducer;
