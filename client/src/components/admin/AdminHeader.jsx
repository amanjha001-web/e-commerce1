
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { logout } from "../../store/slices/authSlice";

const AdminHeader = ({
  title = "Dashboard",
  subtitle = "",
  user: userProp = null,
  onMenuClick,
  onProfileClick,
  onNotificationsClick,
  onLogout,
  notificationCount = 0,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authUser = useSelector((state) => state.auth?.user);
  const user = userProp || authUser || {};

  const userName =
    user?.fullName || user?.name || user?.username || "Admin";

  const userEmail = user?.email || "";

  const avatar =
    user?.avatar || user?.profileImage || user?.image || null;

  const getInitials = () =>
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "AD";

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!profileOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  const handleProfileClick = () => {
    setProfileOpen(false);
    onProfileClick?.();
  };

  const handleNotificationsClick = () => {
    setProfileOpen(false);
    onNotificationsClick?.();
  };

  const handleLogout = async () => {
    setProfileOpen(false);

    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      // Your authSlice also clears auth state on logout.rejected.
      console.error("Logout request failed:", error);
    } finally {
      onLogout?.();
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {title}
            </h1>

            {subtitle && (
              <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <button
            type="button"
            onClick={handleNotificationsClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={19} />

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setProfileOpen((previous) => !previous)
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 sm:gap-3 sm:px-3"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={userName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {getInitials()}
                </div>
              )}

              <div className="hidden max-w-32 text-left sm:block">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {userName}
                </p>

                <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                  {String(user?.role || "Admin").replace(/_/g, " ")}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={[
                  "hidden text-slate-400 transition-transform sm:block",
                  profileOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setProfileOpen(false)}
                />

                <div
                  className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
                  role="menu"
                >
                  {/* User Info */}
                  <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={userName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          {getInitials()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {userName}
                        </p>

                        {userEmail && (
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {userEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      <UserRound size={17} />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={handleNotificationsClick}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      <Bell size={17} />
                      Notifications
                    </button>

                    <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      role="menuitem"
                    >
                      <LogOut size={17} />
                      Logout
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

export default AdminHeader;
