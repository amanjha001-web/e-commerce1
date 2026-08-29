import NotificationList from "./NotificationList";

const NotificationDropdown = ({
  notifications = [],
  onRead,
  onMarkAllRead,
  onDelete,
  onClose,
}) => {
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <div className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>

          {unreadCount > 0 && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {unreadCount} unread
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Mark all read
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close notifications"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <NotificationList
        notifications={notifications}
        onRead={onRead}
        onDelete={onDelete}
      />
    </div>
  );
};

export default NotificationDropdown;
