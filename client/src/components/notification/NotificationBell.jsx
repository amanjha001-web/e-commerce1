import { useState } from "react";
import NotificationDropdown from "./NotificationDropdown";

const NotificationBell = ({
  unreadCount = 0,
  notifications = [],
  onRead,
  onMarkAllRead,
  onDelete,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const count = Number(unreadCount) || 0;

  const handleToggle = () => {
    setIsOpen((current) => !current);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <span className="text-xl">🔔</span>

        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute right-0 top-12 z-50">
            <NotificationDropdown
              notifications={notifications}
              onRead={onRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={onDelete}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
