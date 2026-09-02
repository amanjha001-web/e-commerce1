import { useMemo } from "react";

const RevenueChart = ({
  data = [],
  title = "Revenue Overview",
  period = "Last 7 Days",
  loading = false,
}) => {
  const chartData = useMemo(() => {
    if (!data.length) {
      return [
        { label: "Mon", value: 0 },
        { label: "Tue", value: 0 },
        { label: "Wed", value: 0 },
        { label: "Thu", value: 0 },
        { label: "Fri", value: 0 },
        { label: "Sat", value: 0 },
        { label: "Sun", value: 0 },
      ];
    }

    return data;
  }, [data]);

  const maxValue = Math.max(
    ...chartData.map((item) => Number(item.value) || 0),
    1,
  );

  const totalRevenue = chartData.reduce(
    (total, item) => total + (Number(item.value) || 0),
    0,
  );

  const width = 700;
  const height = 280;
  const paddingX = 45;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = chartData.map((item, index) => {
    const x =
      paddingX + (index / Math.max(chartData.length - 1, 1)) * chartWidth;

    const y =
      height - paddingY - ((Number(item.value) || 0) / maxValue) * chartHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  const areaPoints = [
    `${paddingX},${height - paddingY}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${paddingX + chartWidth},${height - paddingY}`,
  ].join(" ");

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-6 w-44 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-muted" />
          </div>

          <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
        </div>

        <div className="h-[280px] animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Revenue performance
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
          {period}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            preserveAspectRatio="none"
          >
            {/* Grid Lines */}
            {[0, 1, 2, 3, 4].map((line) => {
              const y = paddingY + (line / 4) * chartHeight;

              return (
                <line
                  key={line}
                  x1={paddingX}
                  y1={y}
                  x2={paddingX + chartWidth}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Y Axis Labels */}
            {[4, 3, 2, 1, 0].map((value) => {
              const amount = Math.round((value / 4) * maxValue);

              const y = paddingY + ((4 - value) / 4) * chartHeight;

              return (
                <text
                  key={value}
                  x="5"
                  y={y + 4}
                  fontSize="11"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  ₹{amount.toLocaleString("en-IN")}
                </text>
              );
            })}

            {/* Area */}
            <polygon
              points={areaPoints}
              fill="currentColor"
              className="text-primary/10"
            />

            {/* Revenue Line */}
            <polyline
              points={linePoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            />

            {/* Points + Labels */}
            {points.map((point, index) => (
              <g key={`${point.label}-${index}`}>
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
                  r="2"
                  fill="currentColor"
                  className="text-background"
                />

                <text
                  x={point.x}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Total Revenue</p>

          <p className="mt-1 text-lg font-semibold text-foreground">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          Revenue
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
