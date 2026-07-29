import { configureStore } from "@reduxjs/toolkit";

import cartReducer from "./features/cartSlice";
import wishlistReducer from "./features/wishlistSlice";
import authReducer from "./features/authSlice";
import productReducer from "./features/product/productSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    product: productReducer,
  },
});
