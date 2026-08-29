const EarningsCard = ({
  title = "Total Earnings",
  amount = 0,
  currency = "₹",
  period,
  trend,
  trendType = "up",
  icon = "💰",
  loading = false,
}) => {
  const numericAmount = Number(amount) || 0;

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(numericAmount);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />

          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="mt-4 h-8 w-36 rounded bg-gray-200 dark:bg-gray-700" />

        <div className="mt-3 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const isPositive = trendType === "up";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {currency}
            {formattedAmount}
          </h3>

          {period && <p className="mt-1 text-xs text-gray-400">{period}</p>}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl dark:bg-green-900/20">
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4">
          <span
            className={`text-xs font-semibold ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "↑" : "↓"} {trend}
          </span>

          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            vs previous period
          </span>
        </div>
      )}
    </div>
  );
};

export default EarningsCard;
