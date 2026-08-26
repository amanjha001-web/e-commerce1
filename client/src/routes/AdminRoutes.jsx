import { Route, Routes } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../pages/admin/Dashboard";
import Users from "../pages/admin/Users";
import UserDetails from "../pages/admin/UserDetails";
import Vendors from "../pages/admin/Vendors";
import VendorRequests from "../pages/admin/VendorRequests";

import Products from "../pages/admin/Products";
import Categories from "../pages/admin/Categories";
import Brands from "../pages/admin/Brands";
import Banners from "../pages/admin/Banners";

import Orders from "../pages/admin/Orders";
import Payments from "../pages/admin/Payments";
import Coupons from "../pages/admin/Coupons";

import Reports from "../pages/admin/Reports";
import Support from "../pages/admin/Support";
import Notifications from "../pages/admin/Notifications";

import Settings from "../pages/admin/Settings";
import Permissions from "../pages/admin/Permissions";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route
        element={<ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]} />}
      >
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />

          <Route path="/admin/users" element={<Users />} />

          <Route path="/admin/users/:userId" element={<UserDetails />} />

          <Route path="/admin/vendors" element={<Vendors />} />

          <Route path="/admin/vendor-requests" element={<VendorRequests />} />

          <Route path="/admin/products" element={<Products />} />

          <Route path="/admin/categories" element={<Categories />} />

          <Route path="/admin/brands" element={<Brands />} />

          <Route path="/admin/banners" element={<Banners />} />

          <Route path="/admin/orders" element={<Orders />} />

          <Route path="/admin/payments" element={<Payments />} />

          <Route path="/admin/coupons" element={<Coupons />} />

          <Route path="/admin/reports" element={<Reports />} />

          <Route path="/admin/support" element={<Support />} />

          <Route path="/admin/notifications" element={<Notifications />} />

          <Route path="/admin/settings" element={<Settings />} />

          <Route path="/admin/permissions" element={<Permissions />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
