import { useMemo, useState } from "react";

const SalesChart = ({
  data = [],
  loading = false,
  title = "Sales Overview",
  height = 280,
  currency = "₹",
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      label: item?.label || item?.date || item?.month || `Item ${index + 1}`,
      value:
        Number(
          item?.value ?? item?.sales ?? item?.amount ?? item?.revenue ?? 0,
        ) || 0,
    }));
  }, [data]);

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 35;
  const paddingY = 20;

  const getX = (index) => {
    if (chartData.length === 1) {
      return chartWidth / 2;
    }

    return (
      paddingX + (index * (chartWidth - paddingX * 2)) / (chartData.length - 1)
    );
  };

  const getY = (value) =>
    chartHeight - paddingY - (value / maxValue) * (chartHeight - paddingY * 2);

  const points = chartData.map((item, index) => ({
    x: getX(index),
    y: getY(item.value),
    ...item,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  if (loading) {
    return (
      <div className="panel p-5">
        <div className="animate-pulse">
          <div className="h-5 w-36 rounded bg-[var(--soft)]" />

          <div className="mt-5 h-[280px] rounded-lg bg-[var(--soft)]/50" />
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="panel p-5">
        <h2 className="text-base font-black text-[var(--text)]">
          {title}
        </h2>

        <div className="flex h-[280px] items-center justify-center">
          <p className="text-xs font-medium text-[var(--muted)]">
            No sales data available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-[var(--text)]">
          {title}
        </h2>

        <span className="pill">
          {chartData.length} periods
        </span>
      </div>

      {/* Chart */}
      <div className="mt-5 w-full overflow-x-auto" style={{ height }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full min-w-[600px] w-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label={title}
        >
          {/* Grid */}
          {[0, 1, 2, 3, 4].map((line) => {
            const y = paddingY + (line * (chartHeight - paddingY * 2)) / 4;

            return (
              <line
                key={line}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-[var(--line)]"
                strokeWidth="1"
              />
            );
          })}

          {/* Area */}
          <path
            d={`${linePath} L ${points[points.length - 1].x} ${
              chartHeight - paddingY
            } L ${points[0].x} ${chartHeight - paddingY} Z`}
            fill="currentColor"
            className="text-[var(--soft)]"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            className="text-[var(--primary)]"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((point, index) => (
            <g
              key={`${point.label}-${index}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className="cursor-pointer"
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? 6 : 4}
                fill="currentColor"
                className="text-[var(--primary)]"
              />

              {activeIndex === index && (
                <g>
                  <rect
                    x={point.x - 55}
                    y={point.y - 48}
                    width="110"
                    height="34"
                    rx="6"
                    className="fill-[#4C0519]"
                  />

                  <text
                    x={point.x}
                    y={point.y - 27}
                    textAnchor="middle"
                    className="fill-white text-[11px] font-bold"
                  >
                    {currency}
                    {point.value.toLocaleString("en-IN")}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Labels */}
          {points.map((point, index) => (
            <text
              key={`label-${index}`}
              x={point.x}
              y={chartHeight - 2}
              textAnchor="middle"
              className="fill-[var(--muted)] text-[10px] font-semibold"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>

      {/* Summary */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
        <span className="text-xs font-medium text-[var(--muted)]">
          Total Sales
        </span>

        <span className="text-sm font-black text-[var(--primary)]">
          {currency}
          {chartData
            .reduce((total, item) => total + item.value, 0)
            .toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
};

export default SalesChart;

