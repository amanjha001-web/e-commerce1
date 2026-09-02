import  { useMemo } from "react";

const RevenueReport = ({
  data = [],
  loading = false,
  title = "Revenue Report",
  period = "Monthly",
  onPeriodChange,
  onExport,
}) => {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => ({
      id: item?._id || item?.id || index,
      label: item?.label || item?.date || item?.period || `Item ${index + 1}`,

      revenue: Number(item?.revenue ?? item?.totalRevenue ?? item?.amount ?? 0),

      grossRevenue: Number(
        item?.grossRevenue ?? item?.gross ?? item?.sales ?? item?.revenue ?? 0,
      ),

      discount: Number(item?.discount ?? item?.discountAmount ?? 0),

      tax: Number(item?.tax ?? item?.taxAmount ?? 0),

      shipping: Number(item?.shipping ?? item?.shippingAmount ?? 0),

      refunds: Number(item?.refunds ?? item?.refundAmount ?? 0),

      orders: Number(item?.orders ?? item?.orderCount ?? 0),
    }));
  }, [data]);

  const summary = useMemo(() => {
    return normalizedData.reduce(
      (acc, item) => {
        acc.revenue += item.revenue;
        acc.grossRevenue += item.grossRevenue;
        acc.discount += item.discount;
        acc.tax += item.tax;
        acc.shipping += item.shipping;
        acc.refunds += item.refunds;
        acc.orders += item.orders;

        return acc;
      },
      {
        revenue: 0,
        grossRevenue: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        refunds: 0,
        orders: 0,
      },
    );
  }, [normalizedData]);

  const averageRevenuePerOrder =
    summary.orders > 0 ? summary.revenue / summary.orders : 0;

  const refundRate =
    summary.revenue > 0 ? (summary.refunds / summary.revenue) * 100 : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
  };

  const formatPercentage = (value) => `${Number(value).toFixed(1)}%`;

  const handleExport = () => {
    onExport?.({
      type: "revenue",
      period,
      data: normalizedData,
      summary: {
        ...summary,
        averageRevenuePerOrder,
        refundRate,
      },
    });
  };

  const breakdown = [
    {
      key: "grossRevenue",
      label: "Gross Revenue",
    },
    {
      key: "discount",
      label: "Discounts",
    },
    {
      key: "tax",
      label: "Tax",
    },
    {
      key: "shipping",
      label: "Shipping",
    },
    {
      key: "refunds",
      label: "Refunds",
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

  const maxRevenue = Math.max(...normalizedData.map((item) => item.revenue), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Track revenue, refunds, discounts and financial performance.
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Revenue
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatCurrency(summary.revenue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Net revenue for selected period
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Gross Revenue
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatCurrency(summary.grossRevenue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Revenue before adjustments
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Average Per Order
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatCurrency(averageRevenuePerOrder)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Revenue per order
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Refunds</p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatCurrency(summary.refunds)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Refund rate {formatPercentage(refundRate)}
          </p>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Revenue Trend
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Revenue performance over the selected period.
            </p>
          </div>

          <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {period}
          </span>
        </div>

        {normalizedData.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No revenue data available
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Revenue data will appear here once transactions are recorded.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedData.map((item) => {
              const percentage = (item.revenue / maxRevenue) * 100;

              return (
                <div key={item.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-foreground">
                      {item.label}
                    </span>

                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(item.revenue)}
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

      {/* Financial Breakdown */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground">
            Financial Breakdown
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Revenue components and adjustments.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {breakdown.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-border bg-muted/20 p-4"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>

              <p className="mt-2 text-base font-semibold text-foreground">
                {formatCurrency(summary[item.key])}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Revenue Details
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Detailed financial breakdown for each period.
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
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Period
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Revenue
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Gross
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Discount
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Tax
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Shipping
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Refunds
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Orders
                    </th>
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
                        {formatCurrency(item.revenue)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatCurrency(item.grossRevenue)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatCurrency(item.discount)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatCurrency(item.tax)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatCurrency(item.shipping)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatCurrency(item.refunds)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatNumber(item.orders)}
                      </td>
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
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Gross</p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatCurrency(item.grossRevenue)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Discount
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatCurrency(item.discount)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Tax</p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatCurrency(item.tax)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Shipping
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatCurrency(item.shipping)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Refunds
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatCurrency(item.refunds)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Orders
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatNumber(item.orders)}
                      </p>
                    </div>
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

export default RevenueReport;
