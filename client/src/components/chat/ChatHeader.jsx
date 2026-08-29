import { Link } from "react-router-dom";

const ChatHeader = ({ conversation = null, onBack, onClose }) => {
  const user = conversation?.user || conversation?.vendor;

  const name = user?.fullName || user?.name || conversation?.name || "Chat";

  const avatar = user?.avatar || conversation?.avatar || null;

  const isOnline = conversation?.isOnline ?? user?.isOnline ?? false;

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Go back"
          >
            ←
          </button>
        )}

        <Link
          to={user?._id ? `/users/${user._id}` : "#"}
          onClick={(event) => {
            if (!user?._id) {
              event.preventDefault();
            }
          }}
          className="flex min-w-0 items-center gap-3"
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {name}
            </h2>

            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />

              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close chat"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
