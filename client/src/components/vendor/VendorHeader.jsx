import { useState } from "react";

const VendorHeader = ({
  vendor,
  onMenuClick,
  onNotificationClick,
  onProfileClick,
  notificationCount = 0,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const vendorName =
    vendor?.storeName ||
    vendor?.businessName ||
    vendor?.fullName ||
    vendor?.name ||
    "Vendor";

  const vendorEmail = vendor?.email || vendor?.user?.email || "";

  const avatar =
    vendor?.avatar ||
    vendor?.avatarUrl ||
    vendor?.profileImage ||
    vendor?.user?.avatar;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open vendor menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
          >
            ☰
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

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            type="button"
            onClick={onNotificationClick}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <span className="text-xl">🔔</span>

            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((previous) => !previous)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={vendorName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {vendorName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden max-w-[150px] text-left md:block">
                <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                  {vendorName}
                </p>

                {vendorEmail && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {vendorEmail}
                  </p>
                )}
              </div>

              <span className="hidden text-xs text-gray-400 md:block">▼</span>
            </button>

            {showProfileMenu && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  onClick={() => setShowProfileMenu(false)}
                  className="fixed inset-0 z-40 h-full w-full cursor-default"
                />

                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {vendorName}
                    </p>

                    {vendorEmail && (
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {vendorEmail}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onProfileClick?.();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <span>👤</span>
                    My Profile
                  </button>
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
