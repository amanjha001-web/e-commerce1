import { useMemo } from "react";

const PERIOD_LABELS = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
};

const AnalyticsAreaChart = ({
  data = [],
  title,
  subtitle,
  period = "7d",
  loading = false,
  seriesLabel = "Total",
  totalHeading = "Total",
  isCurrency = false,
  footerMeta = "",
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

  const formatMetric = (val) => {
    const num = Number(val) || 0;
    return isCurrency ? `₹${num.toLocaleString("en-IN")}` : num.toLocaleString("en-IN");
  };

  const maxValue = Math.max(
    ...chartData.map((item) => Number(item.value) || 0),
    1,
  );
  const totalValue = chartData.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0,
  );

  const width = 700;
  const height = 270;
  const paddingX = isCurrency ? 58 : 44;
  const paddingY = 26;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const labelStep =
    chartData.length > 45 ? 14 : chartData.length > 14 ? 5 : 1;

  const points = chartData.map((item, index) => {
    const x =
      paddingX + (index / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y =
      height -
      paddingY -
      ((Number(item.value) || 0) / maxValue) * chartHeight;
    return { ...item, x, y, index };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = [
    `${paddingX},${height - paddingY}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${paddingX + chartWidth},${height - paddingY}`,
  ].join(" ");

  const periodText = PERIOD_LABELS[period] || period;

  if (loading) {
    return (
      <div className="panel p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--soft)]" />
            <div className="mt-2 h-3.5 w-28 animate-pulse rounded bg-[var(--soft)]" />
          </div>
          <div className="h-6 w-24 animate-pulse rounded-full bg-[var(--soft)]" />
        </div>
        <div className="h-[260px] animate-pulse rounded-xl bg-[var(--soft)]/50" />
      </div>
    );
  }

  return (
    <div className="panel p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black text-[var(--text)]">{title}</h2>
          <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
            {subtitle}
          </p>
        </div>

        <span className="pill self-start sm:self-auto">{periodText}</span>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[540px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
            {[0, 1, 2, 3, 4].map((line) => {
              const y = paddingY + (line / 4) * chartHeight;
              return (
                <line
                  key={line}
                  x1={paddingX}
                  y1={y}
                  x2={paddingX + chartWidth}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {[4, 3, 2, 1, 0].map((tick) => {
              const amount = Math.round((tick / 4) * maxValue);
              const y = paddingY + ((4 - tick) / 4) * chartHeight;
              return (
                <text
                  key={tick}
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10.5"
                  fill="var(--muted)"
                >
                  {formatMetric(amount)}
                </text>
              );
            })}

            <polygon points={areaPoints} fill="var(--primary)" fillOpacity="0.1" />

            <polyline
              points={linePoints}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point) => {
              const showLabel =
                point.index === 0 ||
                point.index === points.length - 1 ||
                point.index % labelStep === 0;
              return (
                <g key={`${point.label}-${point.index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={points.length > 35 ? "3" : "4.5"}
                    fill="var(--primary)"
                  >
                    <title>{`${point.label}: ${formatMetric(point.value)}`}</title>
                  </circle>

                  {points.length <= 35 && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="1.8"
                      fill="#ffffff"
                    />
                  )}

                  {showLabel && (
                    <text
                      x={point.x}
                      y={height - 6}
                      textAnchor="middle"
                      fontSize="10.5"
                      fill="var(--muted)"
                    >
                      {point.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-4">
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">
            {totalHeading}
          </p>
          <p className="mt-0.5 text-lg font-black text-[var(--text)]">
            {formatMetric(totalValue)}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-[var(--muted)]">
          {footerMeta && (
            <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px] text-[var(--primary)]">
              {footerMeta}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
            {seriesLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAreaChart;
