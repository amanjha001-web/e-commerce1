import { useEffect, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";

const Sidebar = ({
  items = [],
  logo = "ShopSphere",
  sectionTitle = "Menu",
  isOpen = false,
  onClose,
  onItemClick,
  variant = "admin",
}) => {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  const menuItems = items.length
    ? items
    : [
        { label: "Dashboard", to: "/dashboard", icon: "📊" },
        { label: "Orders", to: "/dashboard/orders", icon: "📦" },
        { label: "Products", to: "/dashboard/products", icon: "🛍️" },
        { label: "Settings", to: "/dashboard/settings", icon: "⚙️" },
      ];

  const closeSidebar = () => {
    onClose?.();
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const isItemActive = (item) => {
    const path = item.to || item.path;

    if (!path) return false;

    if (item.end || path === "/admin" || path === "/admin/dashboard" || path === "/vendor" || path === "/vendor/dashboard") {
      return location.pathname === path;
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const handleItemClick = (item) => {
    onItemClick?.(item);
    closeSidebar();
  };

  const renderItem = (item) => {
    const path = item.to || item.path;

    if (item.children?.length) {
      const groupActive = item.children.some((child) => isItemActive(child));
      const groupOpen = openGroups[item.label] ?? groupActive;

      return (
        <div key={item.label} className="my-0.5">
          <button
            type="button"
            onClick={() =>
              setOpenGroups((previous) => ({
                ...previous,
                [item.label]: !groupOpen,
              }))
            }
            className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-bold transition-all duration-150 cursor-pointer ${
              groupActive
                ? "bg-[var(--soft)] text-[var(--primary)]"
                : "text-[#65565c] hover:bg-[var(--soft)]/70 hover:text-[var(--primary)] dark:text-foreground"
            }`}
          >
            {item.icon && <span className="mr-2.5 text-sm">{item.icon}</span>}

            <span className="flex-1">{item.label}</span>

            <span className="text-[10px] text-[var(--muted)]">{groupOpen ? "▲" : "▼"}</span>
          </button>

          {groupOpen && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-[var(--line)] pl-2.5">
              {item.children.map((child) => renderItem(child))}
            </div>
          )}
        </div>
      );
    }

    if (!path) return null;

    return (
      <NavLink
        key={path}
        to={path}
        end={item.end}
        onClick={() => handleItemClick(item)}
        className={({ isActive }) =>
          `my-0.5 flex items-center rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer ${
            isActive
              ? "bg-[var(--soft)] text-[var(--primary)] shadow-xs"
              : "text-[#65565c] hover:bg-[var(--soft)]/70 hover:text-[var(--primary)] dark:text-foreground"
          }`
        }
      >
        {item.icon && <span className="mr-2.5 text-sm">{item.icon}</span>}

        <span className="flex-1">{item.label}</span>

        {item.badge !== undefined && (
          <span className="ml-auto rounded-full bg-[var(--soft)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--primary)]">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line)] px-5">
        <div className="min-w-0">
          <NavLink
            to={variant === "admin" ? "/admin" : "/vendor"}
            onClick={closeSidebar}
            className="block truncate text-base font-black tracking-tight text-[var(--primary)]"
          >
            {logo}
          </NavLink>

          <p className="text-[11px] font-bold text-[var(--muted)]">
            {variant === "admin" ? "Admin Console" : "Seller Centre"}
          </p>
        </div>

        <button
          type="button"
          onClick={closeSidebar}
          className="rounded-lg p-1.5 text-xs font-bold text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--primary)] lg:hidden"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[1.3px] text-[var(--muted)]">
          {sectionTitle}
        </p>

        <div className="space-y-0.5">{menuItems.map(renderItem)}</div>
      </nav>

      {/* Storefront return button */}
      <div className="shrink-0 border-t border-[var(--line)] p-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
        >
          <span>↗</span>
          <span>View storefront</span>
        </Link>
      </div>
    </div>
  );

  const isAdmin = variant === "admin";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#1b0a11]/50 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        aria-label={`${variant} navigation`}
        aria-hidden={!isOpen && undefined}
        className={`${
          isAdmin
            ? "fixed inset-y-0 left-0 top-16 z-50 w-64"
            : "fixed inset-y-0 left-0 top-16 z-50 w-64 lg:static lg:top-auto lg:z-auto lg:min-h-[calc(100vh-4rem)]"
        } flex flex-col border-r border-[var(--line)] bg-white transition-transform duration-300 dark:border-line dark:bg-card ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isAdmin
            ? "lg:fixed lg:bottom-0 lg:top-16 lg:translate-x-0"
            : "lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
