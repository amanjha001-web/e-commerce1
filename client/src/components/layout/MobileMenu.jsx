import { useEffect } from "react";
import { NavLink } from "react-router-dom";

const MobileMenu = ({ isOpen, onClose, navItems = [] }) => {
  const defaultNavItems = [
    { label: "Home", to: "/" },
    { label: "Shop Products", to: "/products" },
    { label: "Categories", to: "/categories" },
    { label: "Deals", to: "/products?deals=true" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "Cart", to: "/cart" },
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-[#1b0a11]/60 backdrop-blur-xs"
        onClick={onClose}
        aria-label="Close navigation menu"
      />

      {/* Sidebar */}
      <aside
        className="absolute inset-y-0 left-0 flex h-full w-[290px] max-w-[85vw] flex-col border-r border-[var(--line)] bg-white shadow-2xl dark:bg-card"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line)] px-5">
          <span className="text-xl font-black text-[var(--primary)]">
            Shop<span className="text-[var(--gold)]">Sphere</span>.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)]"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-4">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
            Navigation
          </p>
          <div className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-[var(--soft)] text-[var(--primary)]"
                      : "text-[var(--text)] hover:bg-[var(--soft)]/50 hover:text-[var(--primary)] dark:text-foreground"
                  }`
                }
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Account footer */}
        <div className="shrink-0 border-t border-[var(--line)] p-4">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-[var(--soft)] px-3.5 py-2.5 text-xs font-bold text-[var(--primary)]"
          >
            <span>♙</span>
            <span>My Account</span>
          </NavLink>
        </div>
      </aside>
    </div>
  );
};

export default MobileMenu;
