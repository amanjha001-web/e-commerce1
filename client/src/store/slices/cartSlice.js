import { createSlice } from "@reduxjs/toolkit";

// =========================
// Helpers
// =========================

const getProductId = (item) => {
  const product = item?.product || item;

  return product?._id || product?.id || item?.productId || item?._id || null;
};

const normalizeCartItem = (item) => {
  const product = item?.product || item;

  const productId = getProductId(item);

  const price = Number(
    item?.priceAtPurchase ??
      item?.price ??
      product?.finalPrice ??
      product?.discountPrice ??
      product?.price ??
      0,
  );

  return {
    ...item,
    product,
    productId,
    price,
    quantity: Math.max(1, Number(item?.quantity) || 1),
  };
};

const normalizeCart = (payload) => {
  const data = payload?.data ?? payload ?? {};

  const items = Array.isArray(data?.items)
    ? data.items.map(normalizeCartItem)
    : [];

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const discount = Number(data?.discount) || 0;
  const shipping = Number(data?.shipping) || 0;
  const tax = Number(data?.tax) || 0;

  return {
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total:
      data?.totalPrice != null
        ? Number(data.totalPrice)
        : data?.total != null
          ? Number(data.total)
          : Math.max(0, subtotal - discount + shipping + tax),
    coupon: data?.coupon ?? data?.couponCode ?? null,
  };
};

const calculateTotals = (state) => {
  state.subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  state.total = Math.max(
    0,
    state.subtotal - state.discount + state.shipping + state.tax,
  );
};

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

const cartSlice = createSlice({
  name: "cart",
  initialState,

  reducers: {
    // Fetch cart
    fetchCartStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchCartSuccess: (state, action) => {
      state.loading = false;

      const cart = normalizeCart(action.payload);

      state.items = cart.items;
      state.subtotal = cart.subtotal;
      state.discount = cart.discount;
      state.shipping = cart.shipping;
      state.tax = cart.tax;
      state.total = cart.total;
      state.coupon = cart.coupon;
      state.error = null;
    },

    fetchCartFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Local add/update reducer
    addToCart: (state, action) => {
      const product = action.payload?.product || action.payload;

      const productId = getProductId(action.payload);

      if (!productId) return;

      const quantity = Math.max(1, Number(action.payload?.quantity) || 1);

      const existingItem = state.items.find(
        (item) => String(item.productId) === String(productId),
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push(
          normalizeCartItem({
            ...action.payload,
            product,
            productId,
            quantity,
          }),
        );
      }

      calculateTotals(state);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => String(item.productId) !== String(action.payload),
      );

      calculateTotals(state);
    },

    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;

      const item = state.items.find(
        (item) => String(item.productId) === String(productId),
      );

      if (item) {
        item.quantity = Math.max(1, Number(quantity) || 1);
      }

      calculateTotals(state);
    },

    increaseQuantity: (state, action) => {
      const item = state.items.find(
        (item) => String(item.productId) === String(action.payload),
      );

      if (item) {
        item.quantity += 1;
      }

      calculateTotals(state);
    },

    decreaseQuantity: (state, action) => {
      const item = state.items.find(
        (item) => String(item.productId) === String(action.payload),
      );

      if (item) {
        item.quantity = Math.max(1, item.quantity - 1);
      }

      calculateTotals(state);
    },

    // Coupon
    applyCoupon: (state, action) => {
      state.coupon = action.payload.coupon;
      state.discount = Number(action.payload.discount) || 0;

      calculateTotals(state);
    },

    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;

      calculateTotals(state);
    },

    // Clear cart
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.discount = 0;
      state.shipping = 0;
      state.tax = 0;
      state.total = 0;
      state.coupon = null;
      state.error = null;
    },

    // Replace cart from API
    setCart: (state, action) => {
      const cart = normalizeCart(action.payload);

      state.items = cart.items;
      state.subtotal = cart.subtotal;
      state.discount = cart.discount;
      state.shipping = cart.shipping;
      state.tax = cart.tax;
      state.total = cart.total;
      state.coupon = cart.coupon;
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
