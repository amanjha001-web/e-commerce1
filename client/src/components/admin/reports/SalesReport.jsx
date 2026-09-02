import  { useMemo } from "react";

const SalesReport = ({
  data = [],
  loading = false,
  title = "Sales Report",
  period = "Monthly",
  onPeriodChange,
  onExport,
}) => {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => ({
      id: item?._id || item?.id || index,
      label: item?.label || item?.date || item?.period || `Item ${index + 1}`,
      sales: Number(
        item?.sales ?? item?.totalSales ?? item?.amount ?? item?.revenue ?? 0,
      ),
      orders: Number(
        item?.orders ?? item?.orderCount ?? item?.totalOrders ?? 0,
      ),
      units: Number(item?.units ?? item?.quantity ?? item?.itemsSold ?? 0),
    }));
  }, [data]);

  const summary = useMemo(() => {
    const totalSales = normalizedData.reduce(
      (sum, item) => sum + item.sales,
      0,
    );

    const totalOrders = normalizedData.reduce(
      (sum, item) => sum + item.orders,
      0,
    );

    const totalUnits = normalizedData.reduce(
      (sum, item) => sum + item.units,
      0,
    );

    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      totalUnits,
      averageOrderValue,
    };
  }, [normalizedData]);

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

  const maxSales = Math.max(...normalizedData.map((item) => item.sales), 1);

  const chartHeight = 220;
  const chartWidth = 760;
  const chartPadding = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 65,
  };

  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;

  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  const points = normalizedData.map((item, index) => {
    const x =
      normalizedData.length === 1
        ? chartPadding.left + innerWidth / 2
        : chartPadding.left +
          (index / (normalizedData.length - 1)) * innerWidth;

    const y =
      chartPadding.top + innerHeight - (item.sales / maxSales) * innerHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          chartPadding.top + innerHeight
        } L ${points[0].x} ${chartPadding.top + innerHeight} Z`
      : "";

  const handleExport = () => {
    onExport?.({
      type: "sales",
      period,
      data: normalizedData,
      summary,
    });
  };

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

        <div className="h-[360px] animate-pulse rounded-2xl border border-border bg-muted/40" />

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
            Track sales performance and order activity.
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
            Total Sales
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatCurrency(summary.totalSales)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Gross sales for selected period
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Orders
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.totalOrders)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">Orders generated</p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Units Sold
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.totalUnits)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">Total items sold</p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Average Order Value
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatCurrency(summary.averageOrderValue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Average sales per order
          </p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Sales Trend
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Sales performance over {period.toLowerCase()} periods.
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
                No sales data available
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sales data will appear here once orders are recorded.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-[260px] min-w-[680px] w-full"
              preserveAspectRatio="none"
            >
              {/* Grid */}
              {[0, 1, 2, 3, 4].map((index) => {
                const y = chartPadding.top + (innerHeight / 4) * index;

                return (
                  <line
                    key={index}
                    x1={chartPadding.left}
                    y1={y}
                    x2={chartPadding.left + innerWidth}
                    y2={y}
                    stroke="currentColor"
                    className="text-border"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Area */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="currentColor"
                  className="text-primary/10"
                />
              )}

              {/* Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {points.map((point) => (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="currentColor"
                    className="text-primary"
                  />

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    className="text-primary/20"
                  />
                </g>
              ))}

              {/* X Axis Labels */}
              {points.map((point) => (
                <text
                  key={`label-${point.id}`}
                  x={point.x}
                  y={chartPadding.top + innerHeight + 25}
                  textAnchor="middle"
                  className="fill-current text-[11px] text-muted-foreground"
                >
                  {String(point.label).slice(0, 10)}
                </text>
              ))}

              {/* Y Axis Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const value = maxSales * ratio;

                const y = chartPadding.top + innerHeight - ratio * innerHeight;

                return (
                  <text
                    key={index}
                    x={chartPadding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-current text-[10px] text-muted-foreground"
                  >
                    ₹
                    {new Intl.NumberFormat("en-IN", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(value)}
                  </text>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Sales Details
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Detailed sales breakdown for the selected period.
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
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Period
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Sales
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Orders
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Units
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                      AOV
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {normalizedData.map((item) => {
                    const aov = item.orders > 0 ? item.sales / item.orders : 0;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-foreground">
                          {item.label}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-foreground">
                          {formatCurrency(item.sales)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-muted-foreground">
                          {formatNumber(item.orders)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-muted-foreground">
                          {formatNumber(item.units)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-muted-foreground">
                          {formatCurrency(aov)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-border md:hidden">
              {normalizedData.map((item) => {
                const aov = item.orders > 0 ? item.sales / item.orders : 0;

                return (
                  <div key={item.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground">
                        {item.label}
                      </p>

                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(item.sales)}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-[10px] text-muted-foreground">
                          Orders
                        </p>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {formatNumber(item.orders)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-[10px] text-muted-foreground">
                          Units
                        </p>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {formatNumber(item.units)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-[10px] text-muted-foreground">AOV</p>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {formatCurrency(aov)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
