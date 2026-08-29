import { Link } from "react-router-dom";

const DashboardHeader = ({
  title = "Dashboard",
  subtitle,
  search,
  actions,
  user,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 pl-16 sm:px-6 sm:pl-16 lg:px-8 lg:pl-8">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 hidden truncate text-sm text-gray-500 sm:block dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {search && (
          <div className="hidden w-full max-w-md lg:block">{search}</div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions || (
            <Link
              to="/notifications"
              className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              🔔
            </Link>
          )}

          {user && (
            <Link
              to="/profile"
              className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-100 sm:flex dark:hover:bg-gray-800"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
              )}

              <span className="max-w-32 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                {user.name || "User"}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
