const NotificationItem = ({ notification, onRead, onDelete }) => {
  if (!notification) {
    return null;
  }

  const isRead = Boolean(notification.read || notification.isRead);

  const title = notification.title || "Notification";

  const message = notification.message || notification.content || "";

  const type = notification.type || "general";

  const createdAt = notification.createdAt || notification.timestamp;

  const getIcon = () => {
    switch (type) {
      case "order":
        return "📦";

      case "payment":
        return "💳";

      case "success":
        return "✅";

      case "warning":
        return "⚠️";

      case "error":
        return "❌";

      case "message":
        return "💬";

      case "promotion":
        return "🎁";

      default:
        return "🔔";
    }
  };

  return (
    <div
      className={`flex gap-3 border-b border-gray-100 px-4 py-3 transition last:border-b-0 dark:border-gray-800 ${
        isRead
          ? "bg-white dark:bg-gray-900"
          : "bg-blue-50/50 dark:bg-blue-950/20"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base dark:bg-gray-800">
        {getIcon()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`text-sm ${
              isRead
                ? "font-medium text-gray-800 dark:text-gray-200"
                : "font-semibold text-gray-900 dark:text-white"
            }`}
          >
            {title}
          </h3>

          {!isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          )}
        </div>

        {message && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {message}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          {createdAt && (
            <span className="text-[11px] text-gray-400">
              {new Date(createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}

          {!isRead && onRead && (
            <button
              type="button"
              onClick={() => onRead(notification)}
              className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Mark as read
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(notification)}
              className="text-[11px] font-medium text-red-500 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
