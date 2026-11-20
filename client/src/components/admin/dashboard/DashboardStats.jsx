import { useSelector } from "react-redux";

const formatGrowthTrend = (growth, fallbackText) => {
  if (typeof growth !== "number" || Number.isNaN(growth)) {
    return { text: fallbackText, tone: "positive" };
  }
  if (growth > 0) {
    return { text: `↗ +${growth}% vs last month`, tone: "positive" };
  }
  if (growth < 0) {
    return { text: `↘ ${growth}% vs last month`, tone: "negative" };
  }
  return { text: fallbackText, tone: "neutral" };
};

const DashboardStats = ({ stats: propStats, loading: propLoading, onNavigate }) => {
  const { stats: storeStats = {}, loading: storeLoading } = useSelector(
    (state) => state.adminDashboard || {},
  );

  const stats = propStats || storeStats;
  const loading = propLoading !== undefined ? propLoading : storeLoading;

  const collectedRevenue = Number(stats.totalRevenue ?? 0);
  const grossSales = Number(stats.grossSales ?? 0);
  const pendingRevenue = Number(
    stats.pendingRevenue ?? Math.max(0, grossSales - collectedRevenue),
  );

  const revenueTrend =
    collectedRevenue === 0 && grossSales > 0
      ? {
          text: `₹${grossSales.toLocaleString("en-IN")} pending COD / capture`,
          tone: "alert",
        }
      : formatGrowthTrend(
          stats.revenueGrowth,
          pendingRevenue > 0
            ? `₹${pendingRevenue.toLocaleString("en-IN")} pending collection`
            : `₹${Number(stats.revenueThisMonth ?? 0).toLocaleString("en-IN")} this month`,
        );
  const ordersTrend = formatGrowthTrend(
    stats.ordersGrowth,
    `${stats.pendingOrders ?? 0} pending orders`,
  );
  const usersTrend = formatGrowthTrend(
    stats.usersGrowth,
    `${stats.newUsersThisMonth ?? 0} joined this month`,
  );

  const cards = [
    {
      key: "totalRevenue",
      routeKey: "payments",
      label: "Total Revenue",
      icon: "💰",
      formattedValue: `₹${Number(stats.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      value: Number(stats.totalRevenue ?? 0),
      trend: revenueTrend.text,
      tone: revenueTrend.tone,
    },
    {
      key: "totalOrders",
      routeKey: "orders",
      label: "Total Orders",
      icon: "🛒",
      value: Number(stats.totalOrders ?? 0),
      trend: ordersTrend.text,
      tone: ordersTrend.tone,
    },
    {
      key: "totalUsers",
      routeKey: "users",
      label: "Total Customers",
      icon: "👥",
      value: Number(stats.totalUsers ?? 0),
      trend: usersTrend.text,
      tone: usersTrend.tone,
    },
    {
      key: "totalVendors",
      routeKey: "vendors",
      label: "Active Vendors",
      icon: "🏪",
      value: Number(stats.totalVendors ?? 0),
      trend: "Verified sellers",
      tone: "positive",
    },
    {
      key: "totalProducts",
      routeKey: "products",
      label: "Catalog Products",
      icon: "📦",
      value: Number(stats.totalProducts ?? 0),
      trend: `${Number(stats.publishedProducts ?? 0).toLocaleString("en-IN")} live in store`,
      tone: "positive",
    },
    {
      key: "pendingVendors",
      routeKey: "vendorRequests",
      label: "Pending Vendors",
      icon: "⏳",
      value: Number(stats.pendingVendors ?? 0),
      trend: Number(stats.pendingVendors ?? 0) > 0 ? "Needs review" : "All reviewed",
      tone: Number(stats.pendingVendors ?? 0) > 0 ? "alert" : "positive",
    },
    {
      key: "pendingProducts",
      routeKey: "products",
      label: "Pending Approvals",
      icon: "📝",
      value: Number(stats.pendingProducts ?? 0),
      trend: Number(stats.pendingProducts ?? 0) > 0 ? "Action required" : "Queue clear",
      tone: Number(stats.pendingProducts ?? 0) > 0 ? "alert" : "positive",
    },
    {
      key: "lowStockCount",
      routeKey: "products",
      label: "Low Stock Alerts",
      icon: "📉",
      value: Number(stats.lowStockCount ?? 0),
      trend: Number(stats.lowStockCount ?? 0) > 0 ? "Stock ≤ 10 units" : "Inventory healthy",
      tone: Number(stats.lowStockCount ?? 0) > 0 ? "alert" : "positive",
    },
    {
      key: "openTickets",
      routeKey: "support",
      label: "Open Tickets",
      icon: "🎫",
      value: Number(stats.openTickets ?? 0),
      trend: Number(stats.openTickets ?? 0) > 0 ? "Needs response" : "No pending tickets",
      tone: Number(stats.openTickets ?? 0) > 0 ? "alert" : "positive",
    },
  ];

  const toneClass = (tone) => {
    if (tone === "alert") return "!text-[#b7791f]";
    if (tone === "negative") return "!text-[#c0394b]";
    if (tone === "neutral") return "!text-[var(--muted)]";
    return "!text-[#16845b]";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
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
        <button
          key={card.key}
          type="button"
          onClick={() => onNavigate?.(card.routeKey)}
          className={`stat text-left transition ${
            onNavigate
              ? "cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--soft)]/25"
              : "cursor-default"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="label">{card.label}</span>
            <span className="text-sm">{card.icon}</span>
          </div>

          <strong>
            {card.formattedValue ?? card.value.toLocaleString("en-IN")}
          </strong>

          <span className={`trend ${toneClass(card.tone)}`}>
            {card.trend}
          </span>
        </button>
      ))}
    </div>
  );
};

export default DashboardStats;
