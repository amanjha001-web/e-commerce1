import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  product: null,

  filters: {
    search: "",
    category: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    rating: "",
    sort: "latest",
  },

  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },

  loading: false,
  productLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: "product",

  initialState,

  reducers: {
    fetchProductsStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchProductsSuccess: (state, action) => {
      state.loading = false;

      state.products = action.payload.products || [];

      state.pagination = {
        page: action.payload.page || 1,
        limit: action.payload.limit || 12,
        total: action.payload.total || 0,
        totalPages: action.payload.totalPages || 0,
      };

      state.error = null;
    },

    fetchProductsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    fetchProductStart: (state) => {
      state.productLoading = true;
      state.error = null;
    },

    fetchProductSuccess: (state, action) => {
      state.productLoading = false;
      state.product = action.payload;
      state.error = null;
    },

    fetchProductFailure: (state, action) => {
      state.productLoading = false;
      state.error = action.payload;
    },

    setProducts: (state, action) => {
      state.products = action.payload;
    },

    setProduct: (state, action) => {
      state.product = action.payload;
    },

    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    setFilter: (state, action) => {
      const { name, value } = action.payload;

      state.filters[name] = value;
    },

    clearFilters: (state) => {
      state.filters = {
        search: "",
        category: "",
        brand: "",
        minPrice: "",
        maxPrice: "",
        rating: "",
        sort: "latest",
      };

      state.pagination.page = 1;
    },

    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },

    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },

    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },

    clearProduct: (state) => {
      state.product = null;
    },

    clearProductError: (state) => {
      state.error = null;
    },

    resetProducts: (state) => {
      state.products = [];
      state.product = null;

      state.pagination = {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      };

      state.error = null;
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  fetchProductStart,
  fetchProductSuccess,
  fetchProductFailure,
  setProducts,
  setProduct,
  setFilters,
  setFilter,
  clearFilters,
  setPage,
  setLimit,
  setPagination,
  clearProduct,
  clearProductError,
  resetProducts,
} = productSlice.actions;

export default productSlice.reducer;
