import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  coupon: null,
  loading: false,
  error: null,
};

const calculateTotals = (state) => {
  state.subtotal = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  state.total = Math.max(
    0,
    state.subtotal - state.discount + state.shipping + state.tax,
  );
};

const cartSlice = createSlice({
  name: "cart",

  initialState,

  reducers: {
    fetchCartStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchCartSuccess: (state, action) => {
      state.loading = false;

      state.items = action.payload.items || [];
      state.subtotal = action.payload.subtotal || 0;
      state.discount = action.payload.discount || 0;
      state.shipping = action.payload.shipping || 0;
      state.tax = action.payload.tax || 0;
      state.total = action.payload.total || 0;
      state.coupon = action.payload.coupon || null;

      state.error = null;
    },

    fetchCartFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    addToCart: (state, action) => {
      const product = action.payload;

      const existingItem = state.items.find(
        (item) => item.productId === product.productId,
      );

      if (existingItem) {
        existingItem.quantity += product.quantity || 1;
      } else {
        state.items.push({
          ...product,
          quantity: product.quantity || 1,
        });
      }

      calculateTotals(state);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload,
      );

      calculateTotals(state);
    },

    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;

      const item = state.items.find((item) => item.productId === productId);

      if (item) {
        item.quantity = Math.max(1, quantity);
      }

      calculateTotals(state);
    },

    increaseQuantity: (state, action) => {
      const item = state.items.find(
        (item) => item.productId === action.payload,
      );

      if (item) {
        item.quantity += 1;
      }

      calculateTotals(state);
    },

    decreaseQuantity: (state, action) => {
      const item = state.items.find(
        (item) => item.productId === action.payload,
      );

      if (item) {
        item.quantity = Math.max(1, item.quantity - 1);
      }

      calculateTotals(state);
    },

    applyCoupon: (state, action) => {
      state.coupon = action.payload.coupon;
      state.discount = action.payload.discount || 0;

      calculateTotals(state);
    },

    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;

      calculateTotals(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.discount = 0;
      state.shipping = 0;
      state.tax = 0;
      state.total = 0;
      state.coupon = null;
    },

    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.subtotal = action.payload.subtotal || 0;
      state.discount = action.payload.discount || 0;
      state.shipping = action.payload.shipping || 0;
      state.tax = action.payload.tax || 0;
      state.total = action.payload.total || 0;
      state.coupon = action.payload.coupon || null;
    },

    setCartLoading: (state, action) => {
      state.loading = action.payload;
    },

    clearCartError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchCartStart,
  fetchCartSuccess,
  fetchCartFailure,
  addToCart,
  removeFromCart,
  updateQuantity,
  increaseQuantity,
  decreaseQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
  setCart,
  setCartLoading,
  clearCartError,
} = cartSlice.actions;

export default cartSlice.reducer;
