import { Route, Routes, Navigate } from "react-router-dom";

import VendorLayout from "../layouts/VendorLayout";
import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../pages/vendor/Dashboard";
import Products from "../pages/vendor/Products";
import AddProduct from "../pages/vendor/AddProduct";
import EditProduct from "../pages/vendor/EditProduct";
import Inventory from "../pages/vendor/Inventory";

import Orders from "../pages/vendor/Orders";
import OrderDetails from "../pages/vendor/OrderDetails";

import Coupons from "../pages/vendor/Coupons";
import Earnings from "../pages/vendor/Earnings";
import Payouts from "../pages/vendor/Payouts";

import Reviews from "../pages/vendor/Reviews";
import Profile from "../pages/vendor/Profile";
import StoreSettings from "../pages/vendor/StoreSettings";

const VendorRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
        <Route path="/" element={<VendorLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="dashboard" element={<Navigate to="/vendor" replace />} />

          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:productId" element={<EditProduct />} />

          <Route path="inventory" element={<Inventory />} />

          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<OrderDetails />} />

          <Route path="coupons" element={<Coupons />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="payouts" element={<Payouts />} />

          <Route path="reviews" element={<Reviews />} />
          <Route path="profile" element={<Profile />} />
          <Route path="store-settings" element={<StoreSettings />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default VendorRoutes;
