import { Link, NavLink } from "react-router-dom";

const Navbar = ({
  logo = "ShopSphere",
  navItems = [],
  onMenuClick,
  showMenuButton = true,
  rightContent,
  className = "",
}) => {
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
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}

        <Link
          to="/"
          className="shrink-0 text-xl font-bold text-gray-900 dark:text-white"
        >
          {logo}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`
              }
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}

              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {rightContent || (
            <>
              <Link
                to="/wishlist"
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-red-500 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Wishlist"
              >
                ♡
              </Link>

              <Link
                to="/cart"
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Cart"
              >
                🛒
              </Link>

              <Link
                to="/profile"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 md:block dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
