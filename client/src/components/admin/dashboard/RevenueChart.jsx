import AnalyticsAreaChart from "./AnalyticsAreaChart";

const RevenueChart = ({
  data = [],
  title = "Revenue Overview",
  period = "7d",
  loading = false,
  growth,
  averageOrderValue,
  grossSales,
}) => {
  const collectedTotal = data.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0,
  );
  const grossOrderTotal =
    Number(grossSales) ||
    data.reduce((sum, item) => sum + (Number(item.grossValue) || 0), 0);

  const parts = [];
  if (collectedTotal === 0 && grossOrderTotal > 0) {
    parts.push(
      `Order value: ₹${grossOrderTotal.toLocaleString("en-IN")} (pending payment/delivery)`,
    );
  } else {
    if (typeof growth === "number") {
      parts.push(`${growth >= 0 ? "↗ +" : "↘ "}${growth}% vs prev`);
    }
    if (Number(averageOrderValue) > 0) {
      parts.push(`Avg ₹${Math.round(averageOrderValue).toLocaleString("en-IN")}`);
    }
  }

  return (
    <AnalyticsAreaChart
      data={data}
      title={title}
      subtitle="Earned revenue performance"
      period={period}
      loading={loading}
      seriesLabel="Revenue"
      totalHeading="Total Revenue in Period"
      isCurrency={true}
      footerMeta={parts.join(" · ")}
    />
  );
};

export default RevenueChart;
