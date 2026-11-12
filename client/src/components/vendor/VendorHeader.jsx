import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { logout } from "../../store/slices/authSlice";

const VendorHeader = ({
  vendor,
  onMenuClick,
  onNotificationClick,
  notificationCount = 0,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const currentVendor = vendor || user || {};

  const vendorName =
    currentVendor?.shopName ||
    currentVendor?.storeName ||
    currentVendor?.businessName ||
    currentVendor?.fullName ||
    currentVendor?.name ||
    "Vendor";

  const vendorEmail =
    currentVendor?.email ||
    currentVendor?.user?.email ||
    "";

  const avatar =
    currentVendor?.avatar?.url ||
    (typeof currentVendor?.avatar === "string" ? currentVendor.avatar : "");

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate("/vendor/profile");
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setShowProfileMenu(false);

    try {
      await dispatch(logout());
    } finally {
      navigate("/", { replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur-md dark:border-line dark:bg-card/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Menu and Dashboard title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open vendor menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--text)] transition hover:bg-[var(--soft)] lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="eyebrow hidden sm:block text-[10px]">Seller Centre</div>
            <h1 className="truncate text-base font-black text-[var(--text)] dark:text-foreground">
              {vendorName}
            </h1>
          </div>
        </div>

        {/* Right: Storefront, Notifications and Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
          >
            ↗ Storefront
          </Link>

          <button
            type="button"
            onClick={onNotificationClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
            aria-label="Notifications"
          >
            <Bell size={17} />

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] font-bold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white p-1.5 transition hover:bg-[var(--soft)] sm:px-3"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={vendorName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-white">
                  {vendorName.charAt(0).toUpperCase()}
                </div>
              )}

              <span className="hidden max-w-28 truncate text-xs font-bold text-[var(--text)] sm:block">
                {vendorName}
              </span>

              <ChevronDown
                size={13}
                className={`hidden text-[var(--muted)] transition-transform sm:block ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xl dark:bg-card">
                <div className="border-b border-[var(--line)] bg-[var(--soft)] px-4 py-3">
                  <p className="truncate text-xs font-black text-[var(--primary)]">
                    {vendorName}
                  </p>
                  <p className="truncate text-[11px] text-[var(--muted)]">
                    {vendorEmail || "seller@shopsphere.demo"}
                  </p>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
                  >
                    <UserRound size={14} />
                    Shop Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--red)] transition hover:bg-[#fff0f1]"
                  >
                    <LogOut size={14} />
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default VendorHeader;
