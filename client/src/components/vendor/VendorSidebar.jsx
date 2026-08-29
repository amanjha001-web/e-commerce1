import { NavLink } from "react-router-dom";

const VendorSidebar = ({ isOpen = false, onClose, vendor, onLogout }) => {
  const storeName = vendor?.storeName || vendor?.businessName || "My Store";

  const menuItems = [
    {
      label: "Dashboard",
      path: "/vendor/dashboard",
      icon: "📊",
    },
    {
      label: "Products",
      path: "/vendor/products",
      icon: "📦",
    },
    {
      label: "Add Product",
      path: "/vendor/products/add",
      icon: "➕",
    },
    {
      label: "Inventory",
      path: "/vendor/inventory",
      icon: "🗃️",
    },
    {
      label: "Orders",
      path: "/vendor/orders",
      icon: "🛒",
    },
    {
      label: "Earnings",
      path: "/vendor/earnings",
      icon: "💰",
    },
    {
      label: "Payouts",
      path: "/vendor/payouts",
      icon: "💳",
    },
    {
      label: "Coupons",
      path: "/vendor/coupons",
      icon: "🎟️",
    },
    {
      label: "Reviews",
      path: "/vendor/reviews",
      icon: "⭐",
    },
    {
      label: "Store Settings",
      path: "/vendor/store-settings",
      icon: "⚙️",
    },
    {
      label: "Profile",
      path: "/vendor/profile",
      icon: "👤",
    },
  ];

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Store */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              🏪
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                {storeName}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vendor Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Store Management
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`
                }
              >
                <span className="flex w-6 justify-center text-base">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-gray-200 p-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <span className="flex w-6 justify-center">🚪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default VendorSidebar;
