import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import cartReducer from "./slices/cartSlice";
import productReducer from "./slices/productSlice";
import wishlistReducer from "./slices/wishlistSlice";
import notificationReducer from "./slices/notificationSlice";
import uiReducer from "./slices/uiSlice";
import vendorDashboardReducer from "./slices/vendorDashboardSlice";
import vendorReducer from "./slices/vendorSlice";
import adminDashboardReducer from "./slices/adminDashboardSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    cart: cartReducer,
    product: productReducer,
    wishlist: wishlistReducer,
    notification: notificationReducer,
    ui: uiReducer,
    vendorDashboard: vendorDashboardReducer,
    vendor: vendorReducer,
    adminDashboard: adminDashboardReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),

  devTools: import.meta.env.MODE !== "production",
});

export default store;
