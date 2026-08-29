import { Link } from "react-router-dom";

const TopBar = ({
  message = "Welcome to ShopSphere",
  leftContent,
  rightContent,
  showMessage = true,
  className = "",
}) => {
  return (
    <div
      className={`w-full border-b border-gray-200 bg-gray-50 text-sm dark:border-gray-800 dark:bg-gray-950 ${className}`}
    >
      <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center">
          {leftContent ||
            (showMessage && (
              <p className="truncate text-gray-600 dark:text-gray-400">
                {message}
              </p>
            ))}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {rightContent || (
            <>
              <Link
                to="/support"
                className="hidden text-gray-600 transition hover:text-blue-600 sm:inline dark:text-gray-400 dark:hover:text-blue-400"
              >
                Help & Support
              </Link>

              <Link
                to="/orders"
                className="text-gray-600 transition hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Track Order
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
