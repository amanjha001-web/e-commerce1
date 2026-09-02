

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  paymentStatus: "all",
  dateRange: "all",
  sort: "newest",
};

const OrderFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  loading = false,
}) => {
  const currentFilters = {
    ...DEFAULT_FILTERS,
    ...filters,
  };

  const handleChange = (key, value) => {
    const updatedFilters = {
      ...currentFilters,
      [key]: value,
    };

    onFilterChange?.(key, value, updatedFilters);
  };

  const handleReset = () => {
    onReset?.(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    Boolean(currentFilters.search?.trim()) ||
    currentFilters.status !== "all" ||
    currentFilters.paymentStatus !== "all" ||
    currentFilters.dateRange !== "all" ||
    currentFilters.sort !== "newest";

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
        {/* Search */}
        <div className="relative md:col-span-2 lg:col-span-2">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
          </span>

          <input
            type="text"
            value={currentFilters.search}
            onChange={(event) => handleChange("search", event.target.value)}
            disabled={loading}
            placeholder="Search order, customer, email..."
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Order Status */}
        <div>
          <select
            value={currentFilters.status}
            onChange={(event) => handleChange("status", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payment Status */}
        <div>
          <select
            value={currentFilters.paymentStatus}
            onChange={(event) =>
              handleChange("paymentStatus", event.target.value)
            }
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially Refunded</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <select
            value={currentFilters.dateRange}
            onChange={(event) => handleChange("dateRange", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <select
            value={currentFilters.sort}
            onChange={(event) => handleChange("sort", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Active Filters / Reset */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Filters are currently applied
          </p>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderFilters;
