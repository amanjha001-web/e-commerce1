import { useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";

import TopBar from "../components/layout/TopBar";
import Navbar from "../components/layout/Navbar";

const adminLinks = [
  ["/admin/dashboard", "▦", "Dashboard"],
  ["/admin/users", "♙", "Users"],
  ["/admin/vendors", "♧", "Vendors"],
  ["/admin/vendor-requests", "✉", "Vendor requests"],
  ["/admin/products", "▣", "Products"],
  ["/admin/categories", "▤", "Categories"],
  ["/admin/orders", "▥", "Orders"],
  ["/admin/refunds", "↩", "Refund requests"],
  ["/admin/payments", "₹", "Payments"],
  ["/admin/coupons", "％", "Coupons"],
  ["/admin/banners", "▧", "Banners"],
  ["/admin/support", "☏", "Support"],
  ["/admin/settings", "⚙", "Settings"],
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isLinkActive = (path) => {
    if (path === "/admin/dashboard") {
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/" ||
        location.pathname === "/admin/dashboard"
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TopBar />
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <main className="page">
        <div className="layout">
          <aside
            id="sideNav"
            className={`sidebar ${sidebarOpen ? "open" : ""}`}
          >
            <div className="side-title">Admin console</div>

            {adminLinks.map(([path, icon, label]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`side-link ${isLinkActive(path) ? "active" : ""}`}
              >
                <span>{icon}</span>
                {label}
              </NavLink>
            ))}

            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="side-link"
            >
              <span>↗</span>
              View storefront
            </Link>
          </aside>

          <section className="content">
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
