const StatsCard = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  trendType = "up",
  loading = false,
  onClick,
}) => {
  const isPositive = trendType === "up";

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />

            <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="mt-4 h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" />

          <div className="mt-3 h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value ?? "—"}
          </h3>
        </div>

        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl dark:bg-blue-900/20">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend !== undefined) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {trend !== undefined && (
            <span
              className={`text-xs font-semibold ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "↑" : "↓"} {trend}
            </span>
          )}

          {subtitle && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {content}
    </div>
  );
};

export default StatsCard;
