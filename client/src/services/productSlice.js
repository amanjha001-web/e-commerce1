import { createSlice } from "@reduxjs/toolkit";
import { fetchProducts } from "./productThunk";

const initialState = {
  products: [],
  loading: false,
  error: null,

  totalProducts: 0,
  currentPage: 1,
  totalPages: 1,

  filters: {
    category: "",
    brand: "",
    search: "",
    minPrice: 0,
    maxPrice: 100000,
    rating: 0,
    sort: "latest",
  },
};

const productSlice = createSlice({
  name: "products",

  initialState,

  reducers: {
    setFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    clearFilters(state) {
      state.filters = initialState.filters;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;

        state.products = action.payload.products;

        state.totalProducts = action.payload.totalProducts;

        state.currentPage = action.payload.currentPage;

        state.totalPages = action.payload.totalPages;
      })

      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;

export default productSlice.reducer;
