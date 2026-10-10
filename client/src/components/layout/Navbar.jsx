
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import useAuth from "../../hooks/useAuth";
import { fetchWishlist } from "../../store/slices/wishlistThunk.js";
import { fetchCart } from "../../store/slices/cartThunk.js";

const Navbar = ({
  logo = "ShopSphere",
  navItems = [],
  onMenuClick,
  showMenuButton = true,
  rightContent,
  className = "",
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isAuthenticated, logout } = useAuth();

  const [accountOpen, setAccountOpen] = useState(false);

  // Wishlist Redux state
  const wishlistItems = useSelector(
    (state) => state.wishlist?.items || []
  );

  const wishlistCount = isAuthenticated
    ? wishlistItems.length
    : 0;

  // Cart Redux state
  const cartItems = useSelector(
    (state) => state.cart?.items || []
  );

  // Total quantity of all products in cart
  const cartCount = isAuthenticated
    ? cartItems.reduce(
        (total, item) =>
          total + Math.max(0, Number(item?.quantity) || 0),
        0
      )
    : 0;

  // Fetch wishlist and cart for authenticated user
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const defaultNavItems = [
    { label: "Home", to: "/" },
    { label: "Products", to: "/products" },
    { label: "Categories", to: "/categories" },
  ];

  const items =
    navItems.length > 0 ? navItems : defaultNavItems;

  const handleLogout = async () => {
    try {
      const result = await logout();

      if (result?.meta?.requestStatus === "fulfilled") {
        toast.success(
          result?.payload?.message || "Logged out successfully"
        );
      }
    } finally {
      setAccountOpen(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu */}
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

        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 text-xl font-bold text-gray-900 dark:text-white"
        >
          {logo}
        </Link>

        {/* Navigation */}
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
              {item.icon && (
                <span className="mr-2">{item.icon}</span>
              )}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Content */}
        <div className="ml-auto flex items-center gap-2">
          {rightContent || (
            <>
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-red-500 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label={`Wishlist, ${wishlistCount} items`}
              >
                <span className="text-xl">♡</span>

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label={`Cart, ${cartCount} items`}
              >
                <span className="text-xl">🛒</span>

                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setAccountOpen((prev) => !prev)
                  }
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.fullName || "User"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}

                  <span className="hidden md:block">
                    {isAuthenticated
                      ? user?.fullName ||
                        user?.username ||
                        "Account"
                      : "Account"}
                  </span>

                  <span className="text-xs">
                    {accountOpen ? "▲" : "▼"}
                  </span>
                </button>

                {/* Dropdown */}
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {isAuthenticated ? (
                      <>
                        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {user?.fullName ||
                              user?.username ||
                              "User"}
                          </p>

                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {user?.email || ""}
                          </p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setAccountOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          My Profile
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:border-gray-800 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setAccountOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Login
                        </Link>

                        <Link
                          to="/login/register"
                          onClick={() => setAccountOpen(false)}
                          className="block border-t border-gray-100 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                        >
                          Register
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
