import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ items = [], logo = "ShopSphere", onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultItems = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: "📊",
    },
    {
      label: "Orders",
      to: "/dashboard/orders",
      icon: "📦",
    },
    {
      label: "Products",
      to: "/dashboard/products",
      icon: "🛍️",
    },
    {
      label: "Users",
      to: "/dashboard/users",
      icon: "👥",
    },
    {
      label: "Settings",
      to: "/dashboard/settings",
      icon: "⚙️",
    },
  ];

  const menuItems = items.length > 0 ? items : defaultItems;

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item) => {
    setIsOpen(false);
    onItemClick?.(item);
  };

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center border-b border-gray-200 px-5 dark:border-gray-800">
        <NavLink
          to="/"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          {logo}
        </NavLink>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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

              <span>{item.label}</span>

              {item.badge !== undefined && (
                <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-lg bg-white p-2 text-gray-700 shadow-md lg:hidden dark:bg-gray-900 dark:text-gray-200"
        aria-label="Open sidebar"
      >
        ☰
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex dark:border-gray-800 dark:bg-gray-900">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden dark:bg-gray-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
