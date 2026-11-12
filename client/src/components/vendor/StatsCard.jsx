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
      <div className="stat-card animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-[var(--soft)]" />
          <div className="h-10 w-10 rounded-xl bg-[var(--soft)]" />
        </div>
        <div className="mt-4 h-8 w-24 rounded bg-[var(--soft)]" />
        <div className="mt-3 h-3 w-32 rounded bg-[var(--soft)]" />
      </div>
    );
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-[var(--muted)]">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-black text-[var(--text)] dark:text-foreground">
            {value ?? "—"}
          </h3>
        </div>

        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft)] text-xl text-[var(--primary)]">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend !== undefined) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {trend !== undefined && (
            <span
              className={`text-xs font-black ${
                isPositive
                  ? "text-[var(--green)]"
                  : "text-[var(--red)]"
              }`}
            >
              {isPositive ? "↑" : "↓"} {trend}
            </span>
          )}

          {subtitle && (
            <span className="text-[11px] font-medium text-[var(--muted)]">
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
        className="stat-card w-full text-left transition hover:-translate-y-0.5 hover:border-[var(--primary)] cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="stat-card">
      {content}
    </div>
  );
};

export default StatsCard;
