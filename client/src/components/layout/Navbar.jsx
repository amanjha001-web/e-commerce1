import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import useAuth from "../../hooks/useAuth";
import { fetchWishlist } from "../../store/slices/wishlistThunk.js";
import { fetchCart } from "../../store/slices/cartThunk.js";

const Navbar = ({
  logo,
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

  // Support string roles as well as object-based roles.
  const rawRole =
    user?.role?.name ||
    user?.role?.roleName ||
    user?.role ||
    user?.userRole ||
    "";

  const role = String(rawRole)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const isAdmin = ["admin", "superadmin", "super_admin"].includes(role);
  const isVendor = ["vendor", "seller"].includes(role);
  const isCustomer = ["customer", "user"].includes(role) || (!isAdmin && !isVendor);

  // Wishlist Redux state
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  const wishlistCount =
    isAuthenticated && isCustomer ? wishlistItems.length : 0;

  // Cart Redux state
  const cartItems = useSelector((state) => state.cart?.items || []);

  const cartCount =
    isAuthenticated && isCustomer
      ? cartItems.reduce(
          (total, item) => total + Math.max(0, Number(item?.quantity) || 0),
          0,
        )
      : 0;

  // Only customers should fetch customer cart and wishlist.
  useEffect(() => {
    if (!isAuthenticated || !isCustomer) {
      return;
    }

    dispatch(fetchWishlist());
    dispatch(fetchCart());
  }, [dispatch, isAuthenticated, isCustomer]);

  const defaultNavItems = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/products" },
    { label: "Categories", to: "/categories" },
    { label: "Deals", to: "/products?deals=true" },
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  const closeAccount = () => setAccountOpen(false);

  const handleLogout = async () => {
    try {
      const result = await logout();

      if (result?.meta?.requestStatus === "fulfilled") {
        toast.success(result?.payload?.message || "Logged out successfully");
      }
    } finally {
      closeAccount();
      navigate("/", { replace: true });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-[var(--line)] bg-white/95 backdrop-blur-md dark:border-line dark:bg-card/95 ${className}`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-[1440px] items-center gap-2 sm:gap-4 md:gap-6 px-2.5 sm:px-7">
        {/* Mobile Menu Button */}
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--soft)] md:hidden"
            aria-label="Open menu"
          >
            <span className="text-base leading-none">☰</span>
          </button>
        )}

        {/* Brand Logo */}
        <Link
          to="/"
          className="shrink-0 text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[var(--primary)] transition hover:opacity-90"
        >
          {logo || (
            <>
              Shop<span className="text-[var(--gold)]">Sphere</span>.
            </>
          )}
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[var(--soft)] text-[var(--primary)]"
                    : "text-[#55464c] hover:bg-[var(--soft)]/60 hover:text-[var(--primary)] dark:text-foreground"
                }`
              }
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Tools */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {rightContent || (
            <>
              {/* Wishlist Button */}
              {(!isAuthenticated || isCustomer) && (
                <Link
                  to="/wishlist"
                  className="hidden items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--soft)] hover:text-[var(--primary)] sm:inline-flex dark:bg-card"
                  aria-label={`Wishlist, ${wishlistCount} items`}
                >
                  <span className="text-sm">♡</span>
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="rounded-full bg-[var(--soft)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--primary)]">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart Button */}
              {(!isAuthenticated || isCustomer) && (
                <Link
                  to="/cart"
                  className="inline-flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl border border-[var(--line)] bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--soft)] hover:text-[var(--primary)] dark:bg-card"
                  aria-label={`Cart, ${cartCount} items`}
                >
                  <span>🛍</span>
                  <span className="hidden sm:inline">Cart</span>
                  <span className="rounded-full bg-[var(--soft)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--primary)]">
                    {cartCount}
                  </span>
                </Link>
              )}

              {/* Account / Sign In */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((prev) => !prev)}
                    className="flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl border border-[var(--line)] bg-white px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--soft)] dark:bg-card"
                    aria-expanded={accountOpen}
                    aria-haspopup="true"
                  >
                    {user?.avatar?.url ? (
                      <img
                        src={user.avatar.url}
                        alt={user.fullName || "User"}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                        {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}

                    <span className="hidden max-w-28 truncate sm:inline">
                      {user?.fullName || user?.username || "Account"}
                    </span>

                    <span className="text-[10px] text-[var(--muted)]">
                      {accountOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {accountOpen && (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xl dark:bg-card">
                      <div className="border-b border-[var(--line)] bg-[var(--soft)] px-4 py-3">
                        <p className="truncate text-sm font-bold text-[var(--primary)]">
                          {user?.fullName || user?.username || "User"}
                        </p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {user?.email || ""}
                        </p>
                        <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase text-[var(--primary)]">
                          {role || "Customer"}
                        </span>
                      </div>

                      <div className="py-1">
                        {isCustomer && (
                          <>
                            <Link
                              to="/profile"
                              onClick={closeAccount}
                              className="block px-4 py-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
                            >
                              ♙ My Profile
                            </Link>

                            <Link
                              to="/orders"
                              onClick={closeAccount}
                              className="block px-4 py-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
                            >
                              ▤ My Orders
                            </Link>

                            <Link
                              to="/addresses"
                              onClick={closeAccount}
                              className="block px-4 py-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
                            >
                              ⌖ Saved Addresses
                            </Link>

                            <Link
                              to="/wishlist"
                              onClick={closeAccount}
                              className="block px-4 py-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
                            >
                              ♡ Wishlist
                            </Link>

                            <Link
                              to="/become-seller"
                              onClick={closeAccount}
                              className="block border-t border-[var(--line)] px-4 py-2.5 text-xs font-bold text-[var(--gold)] transition hover:bg-[var(--soft)]"
                            >
                              ✨ Become a Seller
                            </Link>
                          </>
                        )}

                        {isVendor && (
                          <Link
                            to="/vendor"
                            onClick={closeAccount}
                            className="block px-4 py-2.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--soft)]"
                          >
                            ▦ Vendor Dashboard
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={closeAccount}
                            className="block px-4 py-2.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--soft)]"
                          >
                            ⚙ Admin Console
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full border-t border-[var(--line)] px-4 py-2.5 text-left text-xs font-bold text-[var(--red)] transition hover:bg-[#fff0f1]"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="primarybtn shrink-0 whitespace-nowrap !py-1.5 !px-3 sm:!py-2 sm:!px-4 !text-xs !rounded-xl"
                >
                  Sign in
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
