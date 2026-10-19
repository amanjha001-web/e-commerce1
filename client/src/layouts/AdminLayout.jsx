import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import AdminHeader from "../components/admin/AdminHeader";
import Sidebar from "../components/layout/Sidebar";
import { logout } from "../store/slices/authSlice";

const adminItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "📊" },
  { label: "Users", to: "/admin/users", icon: "👥" },
  {
    label: "Vendors",
    icon: "🏪",
    children: [
      { label: "All Vendors", to: "/admin/vendors" },
      { label: "Vendor Requests", to: "/admin/vendor-requests" },
    ],
  },
  { label: "Products", to: "/admin/products", icon: "🛍️" },
  { label: "Orders", to: "/admin/orders", icon: "📦" },
  { label: "Payments", to: "/admin/payments", icon: "💳" },
  {
    label: "Catalog",
    icon: "📂",
    children: [
      { label: "Categories", to: "/admin/categories" },
      { label: "Brands", to: "/admin/brands" },
      { label: "Banners", to: "/admin/banners" },
      { label: "Coupons", to: "/admin/coupons" },
    ],
  },
  { label: "Reports", to: "/admin/reports", icon: "📈" },
  { label: "Support", to: "/admin/support", icon: "🎧" },
  { label: "Notifications", to: "/admin/notifications", icon: "🔔" },
  { label: "Permissions", to: "/admin/permissions", icon: "🛡️" },
  { label: "Settings", to: "/admin/settings", icon: "⚙️" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 h-16">
        <AdminHeader user={user} onMenuClick={() => setSidebarOpen(true)} />
      </header>

      <Sidebar
        variant="admin"
        logo="ShopSphere Admin"
        sectionTitle="Administration"
        items={adminItems}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <main className="min-h-screen min-w-0 px-4 pb-6 pt-20 md:px-6 lg:ml-[272px]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
