import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  wishlistItems: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addWishlist: (state, action) => {
      const exists = state.wishlistItems.find(
        (item) => item.id === action.payload.id,
      );

      if (!exists) {
        state.wishlistItems.push(action.payload);
      }
    },

    removeWishlist: (state, action) => {
      state.wishlistItems = state.wishlistItems.filter(
        (item) => item.id !== action.payload,
      );
    },
  },
});

export const { addWishlist, removeWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;
