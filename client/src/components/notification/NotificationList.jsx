import NotificationItem from "./NotificationItem";

const NotificationList = ({
  notifications = [],
  onRead,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="max-h-96 overflow-y-auto p-3">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex animate-pulse gap-3 p-2">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-2 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl">🔔</div>

        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
          No notifications
        </h3>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          You're all caught up.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification._id || notification.id || index}
          notification={notification}
          onRead={onRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default NotificationList;
