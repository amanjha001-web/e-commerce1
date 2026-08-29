import { Link } from "react-router-dom";

const ConversationItem = ({ conversation, isActive = false, onClick }) => {
  if (!conversation) {
    return null;
  }

  const user =
    conversation.user || conversation.vendor || conversation.participant;

  const name =
    user?.fullName || user?.name || conversation.name || "Unknown User";

  const avatar = user?.avatar || conversation.avatar || null;

  const lastMessage =
    conversation.lastMessage?.content ||
    conversation.lastMessage?.text ||
    conversation.lastMessage ||
    "No messages yet";

  const unreadCount = conversation.unreadCount || 0;

  const isOnline = conversation.isOnline ?? user?.isOnline ?? false;

  const conversationId = conversation._id || conversation.id;

  const handleClick = () => {
    onClick?.(conversation);
  };

  return (
    <Link
      to={conversationId ? `/chat/${conversationId}` : "#"}
      onClick={(event) => {
        if (!conversationId) {
          event.preventDefault();
        }

        handleClick();
      }}
      className={`flex gap-3 border-b border-gray-100 px-4 py-3 transition dark:border-gray-800 ${
        isActive
          ? "bg-blue-50 dark:bg-blue-950/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div className="relative shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`truncate text-sm ${
              unreadCount > 0
                ? "font-bold text-gray-900 dark:text-white"
                : "font-medium text-gray-800 dark:text-gray-200"
            }`}
          >
            {name}
          </h3>

          {conversation.updatedAt && (
            <span className="shrink-0 text-[11px] text-gray-400">
              {new Date(conversation.updatedAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${
              unreadCount > 0
                ? "font-medium text-gray-700 dark:text-gray-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {lastMessage}
          </p>

          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ConversationItem;
