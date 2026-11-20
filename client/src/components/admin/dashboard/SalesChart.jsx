import AnalyticsAreaChart from "./AnalyticsAreaChart";

const SalesChart = ({
  data = [],
  title = "Orders Overview",
  period = "7d",
  loading = false,
  growth,
}) => {
  const footerMeta =
    typeof growth === "number"
      ? `${growth >= 0 ? "↗ +" : "↘ "}${growth}% vs prev period`
      : "";

  return (
    <AnalyticsAreaChart
      data={data}
      title={title}
      subtitle="Order volume performance"
      period={period}
      loading={loading}
      seriesLabel="Orders"
      totalHeading="Total Orders in Period"
      isCurrency={false}
      footerMeta={footerMeta}
    />
  );
};

export default SalesChart;
