import { useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";

import TopBar from "../components/layout/TopBar";
import Navbar from "../components/layout/Navbar";

const vendorLinks = [
  ["/vendor", "▦", "Dashboard"],
  ["/vendor/products", "▣", "My products"],
  ["/vendor/orders", "▥", "Orders"],
  ["/vendor/inventory", "▤", "Inventory"],
  ["/vendor/earnings", "₹", "Earnings"],
  ["/vendor/profile", "♙", "Shop profile"],
  ["/vendor/support", "✉", "Support"],
];

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isLinkActive = (path) => {
    if (path === "/vendor") {
      return (
        location.pathname === "/vendor" ||
        location.pathname === "/vendor/" ||
        location.pathname === "/vendor/dashboard"
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
            <div className="side-title">Vendor workspace</div>

            {vendorLinks.map(([path, icon, label]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/vendor"}
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

export default VendorLayout;
