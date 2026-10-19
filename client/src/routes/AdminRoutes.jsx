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
        element={<ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]} />}
      >
        <Route element={<AdminLayout />}>
          {/* /admin */}
          <Route index element={<Dashboard />} />

          {/* /admin/dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="users" element={<Users />} />
          <Route path="users/:userId" element={<UserDetails />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="vendor-requests" element={<VendorRequests />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="banners" element={<Banners />} />
          <Route path="orders" element={<Orders />} />
          <Route path="payments" element={<Payments />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="reports" element={<Reports />} />
          <Route path="support" element={<Support />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="permissions" element={<Permissions />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
