import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

const customerNavItems = [
  { label: "My Profile", to: "/profile", icon: "♙" },
  { label: "My Orders", to: "/orders", icon: "▤" },
  { label: "Addresses", to: "/addresses", icon: "⌖" },
  { label: "Wishlist", to: "/wishlist", icon: "♡" },
  { label: "Notifications", to: "/notifications", icon: "♧" },
  { label: "Support tickets", to: "/support", icon: "✉" },
  { label: "Messages", to: "/chat", icon: "☏" },
  { label: "Become a Seller", to: "/become-seller", icon: "✨" },
];

const CustomerWorkspace = ({
  title = "My Account",
  eyebrow = "Customer workspace",
  action,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="page">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[245px_minmax(0,1fr)] lg:items-start">
        {/* Customer Sidebar */}
        <aside
          className={`rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs dark:bg-card dark:border-line lg:sticky lg:top-24 ${
            mobileOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-[1.3px] text-[var(--muted)]">
            Customer Menu
          </div>

          <nav className="space-y-0.5">
            {customerNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--soft)] text-[var(--primary)] shadow-xs"
                      : "text-[#65565c] hover:bg-[var(--soft)]/70 hover:text-[var(--primary)] dark:text-foreground"
                  }`
                }
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="my-2 border-t border-[var(--line)]" />

            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
            >
              <span>←</span>
              <span>Back to store</span>
            </Link>
          </nav>
        </aside>

        {/* Content Area */}
        <section className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="eyebrow">{eyebrow}</div>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl dark:text-foreground">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {action}
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="btnsm lg:hidden"
              >
                ☰ Menu
              </button>
            </div>
          </div>

          <div>{children}</div>
        </section>
      </div>
    </div>
  );
};

export default CustomerWorkspace;
