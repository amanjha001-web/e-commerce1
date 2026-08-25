import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",

  initialState,

  reducers: {
    fetchWishlistStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchWishlistSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload || [];
      state.error = null;
    },

    fetchWishlistFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    addToWishlist: (state, action) => {
      const product = action.payload;

      const exists = state.items.some(
        (item) =>
          (item.productId || item._id) === (product.productId || product._id),
      );

      if (!exists) {
        state.items.push(product);
      }
    },

    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(
        (item) => (item.productId || item._id) !== action.payload,
      );
    },

    toggleWishlist: (state, action) => {
      const product = action.payload;

      const productId = product.productId || product._id;

      const exists = state.items.some(
        (item) => (item.productId || item._id) === productId,
      );

      if (exists) {
        state.items = state.items.filter(
          (item) => (item.productId || item._id) !== productId,
        );
      } else {
        state.items.push(product);
      }
    },

    setWishlist: (state, action) => {
      state.items = action.payload || [];
    },

    clearWishlist: (state) => {
      state.items = [];
    },

    clearWishlistError: (state) => {
      state.error = null;
    },

    setWishlistLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  fetchWishlistStart,
  fetchWishlistSuccess,
  fetchWishlistFailure,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  setWishlist,
  clearWishlist,
  clearWishlistError,
  setWishlistLoading,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
