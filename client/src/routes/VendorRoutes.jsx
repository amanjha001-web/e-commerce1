import { Route, Routes } from "react-router-dom";

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
      <Route element={<ProtectedRoute allowedRoles={["VENDOR"]} />}>
        <Route element={<VendorLayout />}>
          <Route path="/vendor" element={<Dashboard />} />

          <Route path="/vendor/products" element={<Products />} />

          <Route path="/vendor/products/add" element={<AddProduct />} />

          <Route
            path="/vendor/products/edit/:productId"
            element={<EditProduct />}
          />

          <Route path="/vendor/inventory" element={<Inventory />} />

          <Route path="/vendor/orders" element={<Orders />} />

          <Route path="/vendor/orders/:orderId" element={<OrderDetails />} />

          <Route path="/vendor/coupons" element={<Coupons />} />

          <Route path="/vendor/earnings" element={<Earnings />} />

          <Route path="/vendor/payouts" element={<Payouts />} />

          <Route path="/vendor/reviews" element={<Reviews />} />

          <Route path="/vendor/profile" element={<Profile />} />

          <Route path="/vendor/store-settings" element={<StoreSettings />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default VendorRoutes;
