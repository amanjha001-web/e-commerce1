import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

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

    if (item.end || path === "/admin" || path === "/admin/dashboard") {
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
        <div key={item.label}>
          <button
            type="button"
            onClick={() =>
              setOpenGroups((previous) => ({
                ...previous,
                [item.label]: !groupOpen,
              }))
            }
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              groupActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {item.icon && <span className="mr-3 text-base">{item.icon}</span>}

            <span className="flex-1">{item.label}</span>

            <span className="text-xs">{groupOpen ? "⌃" : "⌄"}</span>
          </button>

          {groupOpen && (
            <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
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
          `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isActive
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`
        }
      >
        {item.icon && <span className="mr-3 text-base">{item.icon}</span>}

        <span className="flex-1">{item.label}</span>

        {item.badge !== undefined && (
          <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-5 dark:border-gray-800">
        <div className="min-w-0">
          <NavLink
            to={variant === "admin" ? "/admin/dashboard" : "/vendor/dashboard"}
            onClick={closeSidebar}
            className="block truncate text-lg font-bold text-gray-900 dark:text-white"
          >
            {logo}
          </NavLink>

          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {variant === "admin" ? "Administration" : "Store Management"}
          </p>
        </div>

        <button
          type="button"
          onClick={closeSidebar}
          className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {sectionTitle}
        </p>

        <div className="space-y-1">{menuItems.map(renderItem)}</div>
      </nav>

      
    </>
  );

  const isAdmin = variant === "admin";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className={`fixed inset-x-0 bottom-0 top-16 bg-black/50 ${
            isAdmin ? "z-[60]" : "z-40"
          } lg:hidden`}
          onClick={closeSidebar}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        aria-label={`${variant} navigation`}
        aria-hidden={!isOpen && undefined}
        className={`${
          isAdmin
            ? "fixed inset-y-0 left-0 top-16 z-[70] w-64"
            : "fixed inset-y-0 left-0 top-16 z-50 w-64 lg:static lg:top-auto lg:z-auto lg:min-h-[calc(100vh-4rem)]"
        } flex flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 ${
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
