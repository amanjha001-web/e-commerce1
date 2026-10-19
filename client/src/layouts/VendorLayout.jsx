import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import VendorHeader from "../components/vendor/VendorHeader";
import Sidebar from "../components/layout/Sidebar";
import { logout } from "../store/slices/authSlice";

const vendorItems = [
  { label: "Dashboard", to: "/vendor/dashboard", icon: "📊", end: true },
  { label: "Products", to: "/vendor/products", icon: "📦" },
  { label: "Add Product", to: "/vendor/products/add", icon: "➕" },
  { label: "Inventory", to: "/vendor/inventory", icon: "🗃️" },
  { label: "Orders", to: "/vendor/orders", icon: "🛒" },
  { label: "Earnings", to: "/vendor/earnings", icon: "💰" },
  { label: "Payouts", to: "/vendor/payouts", icon: "💳" },
  { label: "Coupons", to: "/vendor/coupons", icon: "🎟️" },
  { label: "Reviews", to: "/vendor/reviews", icon: "⭐" },
  {
    label: "Store Settings",
    to: "/vendor/store-settings",
    icon: "⚙️",
  },
  { label: "Profile", to: "/vendor/profile", icon: "👤" },
];

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const storeName = user?.storeName || user?.businessName || "My Store";

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error("Vendor logout failed:", error);
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <VendorHeader vendor={user} onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar
          variant="vendor"
          logo={storeName}
          sectionTitle="Store Management"
          items={vendorItems}
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
