import { createSlice } from '@reduxjs/toolkit';

const filtersSlice = createSlice({
  name: 'filters',
  initialState: {
    stockFilter: 'все',
    categoryFilter: 'все',
    searchTerm: '',
  },
  reducers: {
    setStockFilter: (state, action) => {
      state.stockFilter = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.categoryFilter = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    resetFilters: (state) => {
      state.stockFilter = 'все';
      state.categoryFilter = 'все';
      state.searchTerm = '';
    },
  },
});

export const { setStockFilter, setCategoryFilter, setSearchTerm, resetFilters } =
  filtersSlice.actions;
export default filtersSlice.reducer;
