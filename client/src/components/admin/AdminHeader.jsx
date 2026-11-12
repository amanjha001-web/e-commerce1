import { useEffect, useState } from "react";
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
    user?.avatar?.url || (typeof user?.avatar === "string" ? user.avatar : null);

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
      console.error("Logout request failed:", error);
    } finally {
      onLogout?.();
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur-md dark:border-line dark:bg-card/95">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--text)] transition hover:bg-[var(--soft)] lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="eyebrow hidden sm:block text-[10px]">
              ShopSphere Administration
            </div>
            <h1 className="truncate text-base font-black tracking-tight text-[var(--text)] sm:text-lg dark:text-foreground">
              {title}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* View Storefront Link */}
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
          >
            ↗ Storefront
          </Link>

          {/* Notifications */}
          <button
            type="button"
            onClick={handleNotificationsClick}
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
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white p-1.5 transition hover:bg-[var(--soft)] sm:px-3"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={userName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-white">
                  {getInitials()}
                </div>
              )}

              <div className="hidden max-w-28 text-left sm:block">
                <p className="truncate text-xs font-bold text-[var(--text)]">
                  {userName}
                </p>
                <p className="truncate text-[10px] text-[var(--muted)] capitalize">
                  {String(user?.role || "Admin").replace(/_/g, " ")}
                </p>
              </div>

              <ChevronDown
                size={13}
                className={`hidden text-[var(--muted)] transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xl dark:bg-card dark:border-line"
                role="menu"
              >
                <div className="border-b border-[var(--line)] bg-[var(--soft)] px-4 py-3">
                  <p className="truncate text-xs font-black text-[var(--primary)]">
                    {userName}
                  </p>
                  <p className="truncate text-[11px] text-[var(--muted)]">
                    {userEmail || "admin@shopsphere.demo"}
                  </p>
                </div>

                <div className="p-1">
                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--soft)] hover:text-[var(--primary)]"
                  >
                    <UserRound size={14} />
                    Settings & Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--red)] transition hover:bg-[#fff0f1]"
                  >
                    <LogOut size={14} />
                    Logout
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

export default AdminHeader;
