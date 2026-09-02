import { useMemo } from "react";

const OrderReport = ({
  data = [],
  loading = false,
  title = "Order Report",
  period = "Monthly",
  onPeriodChange,
  onExport,
}) => {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => ({
      id: item?._id || item?.id || index,
      label: item?.label || item?.date || item?.period || `Item ${index + 1}`,
      totalOrders: Number(
        item?.totalOrders ?? item?.orders ?? item?.orderCount ?? 0,
      ),
      pending: Number(item?.pending ?? item?.pendingOrders ?? 0),
      confirmed: Number(item?.confirmed ?? item?.confirmedOrders ?? 0),
      processing: Number(item?.processing ?? item?.processingOrders ?? 0),
      shipped: Number(item?.shipped ?? item?.shippedOrders ?? 0),
      delivered: Number(item?.delivered ?? item?.deliveredOrders ?? 0),
      cancelled: Number(item?.cancelled ?? item?.cancelledOrders ?? 0),
      refunded: Number(item?.refunded ?? item?.refundedOrders ?? 0),
    }));
  }, [data]);

  const summary = useMemo(() => {
    return normalizedData.reduce(
      (acc, item) => {
        acc.totalOrders += item.totalOrders;
        acc.pending += item.pending;
        acc.confirmed += item.confirmed;
        acc.processing += item.processing;
        acc.shipped += item.shipped;
        acc.delivered += item.delivered;
        acc.cancelled += item.cancelled;
        acc.refunded += item.refunded;

        return acc;
      },
      {
        totalOrders: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
      },
    );
  }, [normalizedData]);

  const completionRate =
    summary.totalOrders > 0
      ? (summary.delivered / summary.totalOrders) * 100
      : 0;

  const cancellationRate =
    summary.totalOrders > 0
      ? (summary.cancelled / summary.totalOrders) * 100
      : 0;

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN").format(Number(value) || 0);

  const formatPercentage = (value) => `${Number(value).toFixed(1)}%`;

  const handleExport = () => {
    onExport?.({
      type: "orders",
      period,
      data: normalizedData,
      summary: {
        ...summary,
        completionRate,
        cancellationRate,
      },
    });
  };

  const statusConfig = [
    {
      key: "pending",
      label: "Pending",
    },
    {
      key: "confirmed",
      label: "Confirmed",
    },
    {
      key: "processing",
      label: "Processing",
    },
    {
      key: "shipped",
      label: "Shipped",
    },
    {
      key: "delivered",
      label: "Delivered",
    },
    {
      key: "cancelled",
      label: "Cancelled",
    },
    {
      key: "refunded",
      label: "Refunded",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted/40" />

        <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor order volume and fulfillment status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(event) => onPeriodChange?.(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14a2 2 0 0 0 2-2v-1M3 18v1a2 2 0 0 0 2 2"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Orders
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.totalOrders)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Orders in selected period
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Delivered</p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.delivered)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Completion rate {formatPercentage(completionRate)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Pending</p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.pending)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Awaiting processing
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Cancelled</p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.cancelled)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Cancellation rate {formatPercentage(cancellationRate)}
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground">
            Order Status Overview
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Current order distribution by status.
          </p>
        </div>

        {summary.totalOrders === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No order data available
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Order statistics will appear here once data is available.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {statusConfig.map((status) => {
              const value = summary[status.key] || 0;

              const percentage =
                summary.totalOrders > 0
                  ? (value / summary.totalOrders) * 100
                  : 0;

              return (
                <div key={status.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-foreground">
                      {status.label}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {formatNumber(value)} ({formatPercentage(percentage)})
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Order Details
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Detailed order status breakdown.
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            {normalizedData.length} records
          </span>
        </div>

        {normalizedData.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No records found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try selecting another reporting period.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Period
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Total
                    </th>

                    {statusConfig.map((status) => (
                      <th
                        key={status.key}
                        className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground"
                      >
                        {status.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {normalizedData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-foreground">
                        {item.label}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                        {formatNumber(item.totalOrders)}
                      </td>

                      {statusConfig.map((status) => (
                        <td
                          key={status.key}
                          className="px-4 py-4 text-right text-sm text-muted-foreground"
                        >
                          {formatNumber(item[status.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-border md:hidden">
              {normalizedData.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>

                    <p className="text-sm font-bold text-foreground">
                      {formatNumber(item.totalOrders)} orders
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {statusConfig.map((status) => (
                      <div
                        key={status.key}
                        className="rounded-lg bg-muted/40 p-2.5"
                      >
                        <p className="text-[10px] text-muted-foreground">
                          {status.label}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {formatNumber(item[status.key])}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderReport;
