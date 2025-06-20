import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';

export const fetchPromocodes = createAsyncThunk('promocodes/fetchPromocodes', async () => {
  const querySnapshot = await getDocs(collection(db, 'promocodes'));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export const addPromocode = createAsyncThunk('promocodes/addPromocode', async (promocode) => {
  const dataToAdd = { ...promocode };
  delete dataToAdd.id; // 🔥 Удаляем id перед отправкой

  const docRef = await addDoc(collection(db, 'promocodes'), dataToAdd);
  return { id: docRef.id, ...dataToAdd };
});

export const updatePromocode = createAsyncThunk('promocodes/updatePromocode', async (promocode) => {
  await updateDoc(doc(db, 'promocodes', promocode.id), promocode);
  return promocode;
});

export const togglePromocodeStatus = createAsyncThunk(
  'promocodes/togglePromocodeStatus',
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) throw new Error('ID промокода не указан');

      const promocode = getState().promocodes.items.find((item) => item.id === id);
      if (!promocode) throw new Error('Промокод не найден в state');

      const newStatus = !promocode.isActive;
      const promocodeRef = doc(db, 'promocodes', id);

      console.log('Обновляем isActive на:', newStatus);

      await updateDoc(promocodeRef, { isActive: newStatus });

      return { id, isActive: newStatus };
    } catch (error) {
      console.error('Ошибка при переключении статуса:', error.message);
      return rejectWithValue(error.message);
    }
  },
);

const promocodesSlice = createSlice({
  name: 'promocodes',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromocodes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPromocodes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPromocodes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addPromocode.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updatePromocode.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(togglePromocodeStatus.fulfilled, (state, action) => {
        const { id, isActive } = action.payload;
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], isActive };
        }
      })
      .addCase(togglePromocodeStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default promocodesSlice.reducer;
