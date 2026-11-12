const EarningsCard = ({
  title = "Total Earnings",
  amount = 0,
  value,
  change,
  currency = "₹",
  period,
  trend,
  trendType = "up",
  icon = "💰",
  loading = false,
}) => {
  const numericAmount = Number(amount) || 0;

  const formattedAmount =
    value !== undefined
      ? value
      : `${currency}${new Intl.NumberFormat("en-IN", {
          maximumFractionDigits: 2,
        }).format(numericAmount)}`;

  if (loading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-[var(--soft)]" />
          <div className="h-10 w-10 rounded-xl bg-[var(--soft)]" />
        </div>
        <div className="mt-4 h-8 w-36 rounded bg-[var(--soft)]" />
        <div className="mt-3 h-3 w-24 rounded bg-[var(--soft)]" />
      </div>
    );
  }

  const effectiveTrend = trend !== undefined ? trend : change;
  const isPositive = trendType === "up" || (change && !String(change).startsWith("-"));

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[var(--muted)]">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-black text-[var(--text)] dark:text-foreground">
            {formattedAmount}
          </h3>

          {period && <p className="mt-1 text-xs text-[var(--muted)]">{period}</p>}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft)] text-xl text-[var(--primary)]">
          {icon}
        </div>
      </div>

      {effectiveTrend !== undefined && effectiveTrend !== null && (
        <div className="mt-4 flex items-center">
          <span
            className={`text-xs font-black ${
              isPositive ? "text-[var(--green)]" : "text-[var(--red)]"
            }`}
          >
            {isPositive ? "↑" : "↓"} {effectiveTrend}
          </span>

          <span className="ml-2 text-[11px] font-medium text-[var(--muted)]">
            vs previous period
          </span>
        </div>
      )}
    </div>
  );
};

export default EarningsCard;
