import { NavLink } from "react-router-dom";

const MobileMenu = ({ isOpen, onClose, navItems = [] }) => {
  const defaultNavItems = [
    {
      label: "Home",
      to: "/",
    },
    {
      label: "Products",
      to: "/products",
    },
    {
      label: "Categories",
      to: "/categories",
    },
    {
      label: "Deals",
      to: "/deals",
    },
    {
      label: "Wishlist",
      to: "/wishlist",
    },
    {
      label: "Cart",
      to: "/cart",
    },
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="relative flex h-full w-[280px] max-w-[85%] flex-col bg-white shadow-xl dark:bg-gray-950"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            ShopSphere
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`
                }
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}

                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            👤
            <span className="ml-3">My Account</span>
          </NavLink>
        </div>
      </aside>
    </div>
  );
};

export default MobileMenu;
