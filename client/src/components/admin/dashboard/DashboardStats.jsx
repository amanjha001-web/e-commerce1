import { useSelector } from "react-redux";

const DashboardStats = () => {
  const { stats, loading } = useSelector((state) => state.adminDashboard);

  const cards = [
    {
      key: "totalUsers",
      label: "Total Customers",
      icon: "👥",
      value: stats.totalUsers ?? 0,
      trend: "↗ +4.3% this month",
    },
    {
      key: "totalVendors",
      label: "Active Vendors",
      icon: "🏪",
      value: stats.totalVendors ?? 0,
      trend: "Verified sellers",
    },
    {
      key: "totalProducts",
      label: "Catalog Products",
      icon: "📦",
      value: stats.totalProducts ?? 0,
      trend: "Live in store",
    },
    {
      key: "totalOrders",
      label: "Total Orders",
      icon: "🛒",
      value: stats.totalOrders ?? 0,
      trend: "↗ +8.2% this month",
    },
    {
      key: "pendingVendors",
      label: "Pending Vendors",
      icon: "⏳",
      value: stats.pendingVendors ?? 0,
      trend: "Needs review",
      alert: true,
    },
    {
      key: "pendingProducts",
      label: "Pending Approvals",
      icon: "📝",
      value: stats.pendingProducts ?? 0,
      trend: "Action required",
      alert: true,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="stat animate-pulse">
            <div className="h-3 w-20 rounded bg-[var(--soft)]" />
            <div className="my-2 h-7 w-24 rounded bg-[var(--soft)]" />
            <div className="h-2.5 w-28 rounded bg-[var(--soft)]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.key} className="stat">
          <div className="flex items-center justify-between">
            <span className="label">{card.label}</span>
            <span className="text-sm">{card.icon}</span>
          </div>

          <strong>{Number(card.value).toLocaleString("en-IN")}</strong>

          <span
            className={`trend ${
              card.alert && card.value > 0
                ? "!text-[#b7791f]"
                : "!text-[#16845b]"
            }`}
          >
            {card.trend}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
