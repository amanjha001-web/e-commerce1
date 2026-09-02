import { useState } from "react";

const AdminHeader = ({
  title = "Dashboard",
  subtitle = "",
  user = {},
  onMenuClick,
  onProfileClick,
  onNotificationsClick,
  onLogout,
  notificationCount = 0,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = user?.fullName || user?.name || user?.username || "Admin";

  const userEmail = user?.email || "";

  const avatar = user?.avatar || user?.profileImage || user?.image || null;

  const getInitials = () => {
    return userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const handleProfileClick = () => {
    setProfileOpen(false);
    onProfileClick?.();
  };

  const handleLogout = () => {
    setProfileOpen(false);
    onLogout?.();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <span className="text-xl">☰</span>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
              {title}
            </h1>

            {subtitle && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
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
            onClick={onNotificationsClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-muted"
            aria-label="Notifications"
          >
            <span className="text-lg">🔔</span>

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 transition hover:bg-muted sm:px-3"
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials()}
                </div>
              )}

              <div className="hidden max-w-32 text-left sm:block">
                <p className="truncate text-sm font-medium text-foreground">
                  {userName}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {user?.role || "Admin"}
                </p>
              </div>

              <span className="hidden text-xs text-muted-foreground sm:block">
                ▾
              </span>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
                role="menu"
              >
                {/* User Info */}
                <div className="border-b border-border px-4 py-4">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={userName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {userName}
                      </p>

                      {userEmail && (
                        <p className="truncate text-xs text-muted-foreground">
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
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-muted"
                    role="menuitem"
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onNotificationsClick?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-muted"
                    role="menuitem"
                  >
                    <span>🔔</span>
                    <span>Notifications</span>
                  </button>

                  <div className="my-1 border-t border-border" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    role="menuitem"
                  >
                    <span>↪</span>
                    <span>Logout</span>
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
