
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const getProductId = (item) => {
  if (!item) return null;

  // Wishlist item format
  if (item.product) {
    return item.product?._id || item.product?.id;
  }

  // Direct product format
  return item._id || item.id || item.productId || null;
};

const wishlistSlice = createSlice({
  name: "wishlist",

  initialState,

  reducers: {
    // =========================
    // Fetch Wishlist
    // =========================

    fetchWishlistStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchWishlistSuccess: (state, action) => {
      state.loading = false;

      // API:
      // data.products
      state.items = action.payload?.products || [];

      state.error = null;
    },

    fetchWishlistFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // =========================
    // Add Wishlist
    // =========================

    addToWishlistStart: (state) => {
      state.actionLoading = true;
      state.error = null;
    },

    addToWishlistSuccess: (state, action) => {
      state.actionLoading = false;

      const product = action.payload;

      if (!product) return;

      const productId = getProductId(product);

      if (!productId) return;

      const exists = state.items.some(
        (item) => getProductId(item) === productId,
      );

      if (!exists) {
        state.items.push(product);
      }

      state.error = null;
    },

    addToWishlistFailure: (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    },

    // =========================
    // Remove Wishlist
    // =========================

    removeFromWishlistStart: (state) => {
      state.actionLoading = true;
      state.error = null;
    },

    removeFromWishlistSuccess: (state, action) => {
      state.actionLoading = false;

      const productId = action.payload;

      state.items = state.items.filter(
        (item) => getProductId(item) !== productId,
      );

      state.error = null;
    },

    removeFromWishlistFailure: (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    },

    // =========================
    // Toggle Wishlist
    // =========================

    toggleWishlist: (state, action) => {
      const product = action.payload;

      if (!product) return;

      const productId = getProductId(product);

      if (!productId) return;

      const exists = state.items.some(
        (item) => getProductId(item) === productId,
      );

      if (exists) {
        state.items = state.items.filter(
          (item) => getProductId(item) !== productId,
        );
      } else {
        state.items.push(product);
      }
    },

    // =========================
    // Set Wishlist
    // =========================

    setWishlist: (state, action) => {
      state.items = action.payload || [];
    },

    // =========================
    // Clear Wishlist
    // =========================

    clearWishlistStart: (state) => {
      state.actionLoading = true;
      state.error = null;
    },

    clearWishlistSuccess: (state) => {
      state.actionLoading = false;
      state.items = [];
      state.error = null;
    },

    clearWishlistFailure: (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    },

    clearWishlist: (state) => {
      state.items = [];
    },

    // =========================
    // Error
    // =========================

    clearWishlistError: (state) => {
      state.error = null;
    },

    // =========================
    // Loading
    // =========================

    setWishlistLoading: (state, action) => {
      state.loading = action.payload;
    },

    setWishlistActionLoading: (state, action) => {
      state.actionLoading = action.payload;
    },
  },
});

export const {
  fetchWishlistStart,
  fetchWishlistSuccess,
  fetchWishlistFailure,

  addToWishlistStart,
  addToWishlistSuccess,
  addToWishlistFailure,

  removeFromWishlistStart,
  removeFromWishlistSuccess,
  removeFromWishlistFailure,

  toggleWishlist,

  setWishlist,

  clearWishlistStart,
  clearWishlistSuccess,
  clearWishlistFailure,
  clearWishlist,

  clearWishlistError,

  setWishlistLoading,
  setWishlistActionLoading,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
