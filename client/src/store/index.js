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
import vendorRequestReducer from "./slices/vendorRequestSlice";

// Admin slices - located in Admin subdirectory
import adminDashboardReducer from "./slices/Admin/adminDashboardSlice";
import adminOrdersReducer from "./slices/Admin/adminOrdersSlice";
import adminUsersReducer from "./slices/Admin/adminUsersSlice";
import adminVendorsReducer from "./slices/Admin/adminVendorsSlice";
import adminBannersReducer from "./slices/Admin/adminBannersSlice";
import adminCouponsReducer from "./slices/Admin/adminCouponsSlice";
import adminPaymentsReducer from "./slices/Admin/adminPaymentsSlice";
import adminTaxesReducer from "./slices/Admin/adminTaxesSlice";
import adminShippingReducer from "./slices/Admin/adminShippingSlice";

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
    adminOrders: adminOrdersReducer,
    vendorRequests: vendorRequestReducer,
    adminVendors: adminVendorsReducer,
    adminUsers: adminUsersReducer,
    adminBanners: adminBannersReducer,
    adminCoupons: adminCouponsReducer,
    adminPayments: adminPaymentsReducer,
    adminTaxes: adminTaxesReducer,
    adminShipping: adminShippingReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),

  devTools: import.meta.env.MODE !== "production",
});

export default store;
