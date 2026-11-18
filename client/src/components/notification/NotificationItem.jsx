const NotificationItem = ({ notification, onRead, onDelete, onClick }) => {
  if (!notification) {
    return null;
  }

  const isRead = Boolean(notification.read ?? notification.isRead);
  const title = notification.title || "Notification";
  const message = notification.message || notification.content || "";
  const type = String(notification.type || "system").toLowerCase();
  const createdAt = notification.createdAt || notification.timestamp;

  const getIcon = () => {
    switch (type) {
      case "order":
        return "📦";
      case "payment":
        return "💳";
      case "vendor":
        return "🏪";
      case "product":
        return "🛍";
      case "chat":
      case "message":
        return "💬";
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✕";
      case "promotion":
        return "🎁";
      default:
        return "🔔";
    }
  };

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`flex gap-3.5 border-b border-[var(--line)] px-5 py-4 transition last:border-b-0 dark:border-line ${
        onClick ? "cursor-pointer" : ""
      } ${
        isRead
          ? "bg-white hover:bg-[var(--bg)]/50 dark:bg-card"
          : "border-l-[3px] border-l-[var(--primary)] bg-[var(--soft)]/45 hover:bg-[var(--soft)]/70 dark:bg-card"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-base ${
          isRead
            ? "border-[var(--line)] bg-[var(--bg)]"
            : "border-[var(--primary)]/20 bg-white text-[var(--primary)] shadow-2xs"
        }`}
      >
        {getIcon()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h3
              className={`text-sm ${
                isRead
                  ? "font-semibold text-[var(--text)] dark:text-foreground"
                  : "font-extrabold text-[var(--text)] dark:text-white"
              }`}
            >
              {title}
            </h3>

            <span className="pill !py-0.5 !px-2 text-[10px] uppercase tracking-wider">
              {type}
            </span>
          </div>

          {!isRead && (
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--primary)]"
              title="Unread"
            />
          )}
        </div>

        {message && (
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)] dark:text-gray-300">
            {message}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          {createdAt && (
            <span className="text-[11px] font-medium text-[var(--muted)]">
              {new Date(createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {!isRead && onRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRead(notification);
              }}
              className="cursor-pointer text-[11px] font-bold text-[var(--primary)] hover:underline"
            >
              Mark as read
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification);
              }}
              className="cursor-pointer text-[11px] font-bold text-[var(--red)] hover:underline"
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
