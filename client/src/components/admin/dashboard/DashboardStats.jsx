const DashboardStats = ({ stats = {}, loading = false }) => {
  const cards = [
    {
      key: "totalUsers",
      label: "Total Users",
      icon: "👥",
      value: stats.totalUsers ?? 0,
    },
    {
      key: "totalVendors",
      label: "Total Vendors",
      icon: "🏪",
      value: stats.totalVendors ?? 0,
    },
    {
      key: "totalProducts",
      label: "Total Products",
      icon: "📦",
      value: stats.totalProducts ?? 0,
    },
    {
      key: "totalOrders",
      label: "Total Orders",
      icon: "🛒",
      value: stats.totalOrders ?? 0,
    },
    {
      key: "totalRevenue",
      label: "Total Revenue",
      icon: "💰",
      value:
        stats.totalRevenue !== undefined
          ? `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}`
          : "₹0",
    },
    {
      key: "pendingOrders",
      label: "Pending Orders",
      icon: "⏳",
      value: stats.pendingOrders ?? 0,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800" />

              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
            </div>

            <div className="mt-5 h-7 w-24 rounded bg-gray-200 dark:bg-gray-800" />

            <div className="mt-2 h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg dark:bg-blue-900/20">
              {card.icon}
            </div>

            {stats[`${card.key}Change`] !== undefined && (
              <span
                className={`text-xs font-semibold ${
                  Number(stats[`${card.key}Change`]) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {Number(stats[`${card.key}Change`]) >= 0 ? "+" : ""}
                {stats[`${card.key}Change`]}%
              </span>
            )}
          </div>

          <p className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
            {card.value}
          </p>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
