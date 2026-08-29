const ErrorMessage = ({
  message = "Something went wrong.",
  title = "Error",
  onRetry,
  retryText = "Try Again",
  className = "",
}) => {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
          aria-hidden="true"
        >
          !
        </div>

        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="font-medium text-red-800 dark:text-red-300">
              {title}
            </h3>
          )}

          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {message}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
