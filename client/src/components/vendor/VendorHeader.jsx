
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronUp,
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

  // Prefer vendor details, then logged-in user details.
  const currentVendor = vendor || user || {};

  const vendorName =
    currentVendor?.shopName ||
    currentVendor?.storeName ||
    currentVendor?.businessName ||
    currentVendor?.fullName ||
    currentVendor?.name ||
    currentVendor?.user?.fullName ||
    "Vendor";

  const vendorEmail =
    currentVendor?.email ||
    currentVendor?.user?.email ||
    "";

  const avatar =
    currentVendor?.avatar ||
    currentVendor?.avatarUrl ||
    currentVendor?.profileImage ||
    currentVendor?.user?.avatar ||
    currentVendor?.user?.profileImage ||
    "";

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate("/vendor/profile");
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setShowProfileMenu(false);

    try {
      // authSlice clears local auth state even if the API fails.
      await dispatch(logout());
    } finally {
      navigate("/", { replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Menu and Dashboard title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open vendor menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-gray-900 dark:text-white">
              Vendor Dashboard
            </h1>

            <p className="hidden truncate text-xs text-gray-500 dark:text-gray-400 sm:block">
              Manage your store and sales
            </p>
          </div>
        </div>

        {/* Right: Notifications and Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            type="button"
            onClick={onNotificationClick}
            aria-label={`Notifications${
              notificationCount > 0 ? ` (${notificationCount})` : ""
            }`}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Bell size={21} />

            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowProfileMenu((previous) => !previous)
              }
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
              aria-label="Toggle profile menu"
              className="flex max-w-[220px] items-center gap-2 rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {/* Avatar */}
              {avatar ? (
                <img
                  src={avatar}
                  alt={`${vendorName} avatar`}
                  className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {vendorName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name and email */}
              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-gray-800 dark:text-white">
                  {vendorName}
                </p>

                {vendorEmail && (
                  <p className="max-w-[140px] truncate text-xs text-gray-500 dark:text-gray-400">
                    {vendorEmail}
                  </p>
                )}
              </div>

              {showProfileMenu ? (
                <ChevronUp
                  size={16}
                  className="shrink-0 text-gray-400"
                />
              ) : (
                <ChevronDown
                  size={16}
                  className="shrink-0 text-gray-400"
                />
              )}
            </button>

            {showProfileMenu && (
              <>
                {/* Outside click overlay */}
                <button
                  type="button"
                  aria-label="Close profile menu"
                  onClick={() => setShowProfileMenu(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
                >
                  {/* Profile information */}
                  <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {vendorName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {vendorName}
                        </p>

                        {vendorEmail && (
                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {vendorEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* My Profile */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProfileClick}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <UserRound
                      size={18}
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <span>My Profile</span>
                  </button>

                  {/* Logout */}
                  <div className="border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut size={18} />

                      <span>
                        {loggingOut ? "Logging out..." : "Logout"}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default VendorHeader;
