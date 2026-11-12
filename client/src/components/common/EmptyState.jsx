const EmptyState = ({
  icon = "🛍️",
  title = "No data found",
  message = "There is nothing to display here.",
  action,
  actionText = "Go Back",
  className = "",
}) => {
  return (
    <div
      className={`flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-xs dark:bg-card ${className}`}
    >
      <div
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--soft)] text-3xl"
        aria-hidden="true"
      >
        {icon}
      </div>

      <h2 className="text-lg font-bold text-[var(--text)] dark:text-foreground">
        {title}
      </h2>

      <p className="mt-1.5 max-w-md text-sm text-[var(--muted)]">
        {message}
      </p>

      {action && (
        <button
          type="button"
          onClick={action}
          className="primarybtn mt-5"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
