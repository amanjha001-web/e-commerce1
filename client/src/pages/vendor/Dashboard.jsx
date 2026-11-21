import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchVendorDashboard,
  fetchVendorSalesReport,
} from "../../store/slices/vendorDashboardSlice";

const PERIODS = [
  { label: "8 Weeks", value: "8w" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

const PERIOD_CAPTION = {
  "8w": "Last 8 weeks",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time monthly",
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatStatusLabel = (status) => {
  const clean = String(status || "pending")
    .trim()
    .replace(/[_-]+/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const statusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (["delivered", "active", "resolved", "published", "paid", "approved"].includes(s)) {
    return "green";
  }
  if (
    [
      "pending",
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out for delivery",
      "open",
      "under review",
    ].includes(s)
  ) {
    return "amber";
  }
  if (["blocked", "cancelled", "canceled", "rejected", "refunded", "failed"].includes(s)) {
    return "red";
  }
  return "";
};

const formatOrderDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStoreNotice = (store) => {
  if (!store) {
    return {
      text: "Loading your store overview and latest order metrics...",
      style: {},
    };
  }
  const normalizedStatus = String(store.status || "approved").toLowerCase();
  if (store.isActive === false) {
    return {
      text: "Your shop is currently inactive. Customers cannot purchase your products until your store is reactivated.",
      style: { background: "#fff0f1", borderColor: "#f3cbd0", color: "#9f2233" },
    };
  }
  if (normalizedStatus === "pending" || normalizedStatus === "under_review") {
    return {
      text: "Your shop application is under admin review. Approved products will go live automatically once your store is verified.",
      style: {},
    };
  }
  if (normalizedStatus === "rejected") {
    return {
      text: `Your shop verification needs attention${store.rejectionReason ? `: ${store.rejectionReason}` : "."}`,
      style: { background: "#fff0f1", borderColor: "#f3cbd0", color: "#9f2233" },
    };
  }
  const ratingText =
    Number(store.rating || 0) > 0
      ? ` · ★ ${Number(store.rating).toFixed(1)} rating`
      : "";
  return {
    text: `Your shop${store.storeName ? ` (${store.storeName})` : ""} is active${ratingText}. Keep your inventory and order status up to date.`,
    style: {},
  };
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    data: dashboardData,
    loading,
    error,
    salesReport,
    salesPeriod = "8w",
    salesLoading,
    salesError,
  } = useSelector((state) => state.vendorDashboard || {});

  const [manualPeriod, setManualPeriod] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const autoAllFallbackRef = useRef(false);

  const selectedPeriod = manualPeriod || salesPeriod || "8w";

  const refreshDashboard = useCallback(
    (periodToFetch) => {
      dispatch(fetchVendorDashboard());
      if (periodToFetch && periodToFetch !== "8w") {
        dispatch(fetchVendorSalesReport(periodToFetch));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    dispatch(fetchVendorDashboard());
  }, [dispatch]);

  const store = dashboardData?.store || null;
  const metrics = dashboardData?.metrics || dashboardData?.stats || {};
  const earnings = dashboardData?.earnings || {};
  const lowStockProducts = useMemo(
    () =>
      Array.isArray(dashboardData?.lowStockProducts)
        ? dashboardData.lowStockProducts
        : [],
    [dashboardData],
  );

  const activeSalesReport = useMemo(() => {
    if (salesReport && (!manualPeriod || salesReport.period === manualPeriod)) {
      return salesReport;
    }
    if (dashboardData?.salesReport && selectedPeriod === "8w") {
      return dashboardData.salesReport;
    }
    return salesReport || dashboardData?.salesReport || null;
  }, [salesReport, dashboardData, manualPeriod, selectedPeriod]);

  const salesTrend = useMemo(
    () =>
      Array.isArray(activeSalesReport?.salesTrend)
        ? activeSalesReport.salesTrend
        : [],
    [activeSalesReport],
  );
  const salesSummary = activeSalesReport?.summary || {};

  // Auto-fallback once from 8w -> All Time if recent 8 weeks have ₹0 revenue while historical sales exist
  useEffect(() => {
    if (
      autoAllFallbackRef.current ||
      manualPeriod !== null ||
      loading ||
      salesLoading ||
      salesPeriod !== "8w" ||
      !salesTrend.length
    ) {
      return;
    }
    const periodRevenue = salesTrend.reduce(
      (sum, pt) => sum + (Number(pt?.revenue ?? pt?.totalSales) || 0),
      0,
    );
    const lifetimeTotal = Number(metrics?.totalRevenue ?? metrics?.grossSales ?? 0);
    if (periodRevenue === 0 && lifetimeTotal > 0) {
      autoAllFallbackRef.current = true;
      dispatch(fetchVendorSalesReport("all"));
    }
  }, [
    dispatch,
    manualPeriod,
    loading,
    salesLoading,
    salesPeriod,
    salesTrend,
    metrics?.totalRevenue,
    metrics?.grossSales,
  ]);

  const handlePeriodChange = (nextPeriod) => {
    if (nextPeriod === selectedPeriod && !salesLoading) return;
    autoAllFallbackRef.current = true;
    setManualPeriod(nextPeriod);
    setHoveredIndex(null);
    dispatch(fetchVendorSalesReport(nextPeriod));
  };

  const recentOrders = useMemo(() => {
    const raw = Array.isArray(dashboardData?.recentOrders)
      ? dashboardData.recentOrders
      : [];
    return raw.slice(0, 5).map((o) => {
      const displayStatus = formatStatusLabel(o.orderStatus || o.status || "pending");
      return {
        mongoId: o._id || null,
        id:
          o.orderNumber ||
          (o._id ? `#SS-${String(o._id).slice(-5).toUpperCase()}` : "Order"),
        customer:
          o.customer?.fullName ||
          o.userId?.fullName ||
          o.userId?.name ||
          o.shippingAddress?.fullName ||
          o.user?.fullName ||
          "Customer",
        date: formatOrderDate(o.createdAt || o.orderDate),
        amount: o.vendorOrderTotal ?? o.totalAmount ?? o.amount ?? 0,
        itemsCount: o.vendorItemsCount ?? (Array.isArray(o.items) ? o.items.length : 1),
        status: displayStatus,
      };
    });
  }, [dashboardData]);

  const grossSalesValue = Number(metrics.grossSales ?? metrics.totalSales ?? metrics.totalRevenue ?? 0);
  const netEarnedValue = Number(metrics.netEarnings ?? earnings.netEarnings ?? 0);
  const totalOrdersValue = Number(metrics.totalOrders ?? 0);
  const ordersThisWeek = Number(metrics.ordersThisWeek ?? 0);
  const pendingOrdersCount = Number(metrics.pendingOrders ?? 0);
  const totalProductsCount = Number(metrics.totalProducts ?? 0);
  const publishedProductsCount = Number(metrics.publishedProducts ?? 0);
  const lowStockCount = Number(metrics.lowStockCount ?? lowStockProducts.length ?? 0);
  const pendingPayoutAmount = Number(
    metrics.pendingPayouts ?? earnings.pendingPayouts ?? earnings.pendingBalance ?? 0,
  );
  const pendingPayoutCount = Number(
    metrics.pendingPayoutCount ?? earnings.pendingPayoutCount ?? 0,
  );
  const availableBalance = Number(
    metrics.availableBalance ?? earnings.availableBalance ?? 0,
  );
  const latestPayout = earnings.latestPayout || null;

  const salesTrendLabel =
    typeof metrics.salesGrowth === "number" &&
    (metrics.salesGrowth !== 0 || Number(metrics.totalRevenue || 0) > 0)
      ? `${metrics.salesGrowth >= 0 ? "+" : ""}${metrics.salesGrowth}% vs last month`
      : `Net earned: ${money(netEarnedValue)}`;

  const ordersTrendLabel =
    ordersThisWeek > 0
      ? `+${ordersThisWeek} this week`
      : `${pendingOrdersCount} pending orders`;

  const productsTrendLabel =
    lowStockCount > 0
      ? `${lowStockCount} low stock`
      : `${publishedProductsCount} published`;

  const payoutTrendLabel =
    pendingPayoutCount > 0
      ? `${pendingPayoutCount} payout request${pendingPayoutCount > 1 ? "s" : ""} pending`
      : availableBalance > 0
        ? `Available: ${money(availableBalance)}`
        : latestPayout?.status
          ? `Last: ${money(latestPayout.amount)} (${formatStatusLabel(latestPayout.status)})`
          : "Available: ₹0";

  const statItems = [
    {
      label: "Gross sales",
      value: money(grossSalesValue),
      trend: salesTrendLabel,
      tone:
        typeof metrics.salesGrowth === "number" && metrics.salesGrowth < 0
          ? "var(--red)"
          : "var(--green)",
      route: "/vendor/earnings",
    },
    {
      label: "Orders",
      value: totalOrdersValue.toLocaleString("en-IN"),
      trend: ordersTrendLabel,
      tone: pendingOrdersCount > 0 ? "#b45309" : "var(--green)",
      route: "/vendor/orders",
    },
    {
      label: "Products",
      value: totalProductsCount.toLocaleString("en-IN"),
      trend: productsTrendLabel,
      tone: lowStockCount > 0 ? "#b45309" : "var(--green)",
      route: lowStockCount > 0 ? "/vendor/inventory" : "/vendor/products",
    },
    {
      label: "Pending payouts",
      value: money(pendingPayoutAmount),
      trend: payoutTrendLabel,
      tone: pendingPayoutCount > 0 ? "#b45309" : "var(--green)",
      route: "/vendor/payouts",
    },
  ];

  const isChartLoading =
    (loading || salesLoading) &&
    (!salesTrend.length || selectedPeriod !== (activeSalesReport?.period || salesPeriod));

  // Display compact subset of labels for 30d so labels never overlap
  const barLabelStep = salesTrend.length > 16 ? 5 : 1;
  const maxBarValue = Math.max(
    ...salesTrend.map(
      (pt) => Number(pt?.revenue ?? pt?.totalSales ?? pt?.grossSales ?? 0) || 0,
    ),
    1,
  );
  const periodCollected = salesTrend.reduce(
    (sum, pt) => sum + (Number(pt?.revenue ?? pt?.totalSales) || 0),
    0,
  );
  const periodGross = salesTrend.reduce(
    (sum, pt) => sum + (Number(pt?.grossSales ?? pt?.sales) || 0),
    0,
  );
  const periodOrders = Number(
    salesSummary?.totalOrders ??
      salesTrend.reduce((sum, pt) => sum + (Number(pt?.orders ?? pt?.count) || 0), 0),
  );
  const hoveredPoint =
    hoveredIndex !== null && salesTrend[hoveredIndex]
      ? salesTrend[hoveredIndex]
      : null;

  const storeNotice = getStoreNotice(store);
  const combinedError = error || salesError;

  return (
    <div>
      <div className="pagehead flex-wrap gap-3">
        <div>
          <div className="eyebrow">
            {store?.storeName ? `${store.storeName} · Seller centre` : "Seller centre"}
          </div>
          <h1>Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-white p-1 shadow-xs">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePeriodChange(value)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === value
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading || salesLoading}
            onClick={() => refreshDashboard(selectedPeriod)}
            className="outlinebtn cursor-pointer !py-1.5 !px-3 !text-xs disabled:opacity-50"
          >
            {loading || salesLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {combinedError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 text-xs font-bold text-[var(--red)]"
        >
          <span>{combinedError}</span>
          <button
            type="button"
            onClick={() => refreshDashboard(selectedPeriod)}
            disabled={loading || salesLoading}
            className="btnsm text-[var(--red)]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="notice" style={{ marginBottom: "16px", ...storeNotice.style }}>
        {storeNotice.text}
      </div>

      <div className="stats">
        {statItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.route)}
            className="stat cursor-pointer text-left transition hover:-translate-y-0.5"
          >
            <span className="label">{item.label}</span>
            <strong>{loading && !dashboardData ? "—" : item.value}</strong>
            <span className="trend" style={{ color: item.tone }}>
              {loading && !dashboardData ? "Loading..." : item.trend}
            </span>
          </button>
        ))}
      </div>

      <div className="twocol">
        <div className="panel">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 style={{ marginBottom: 2 }}>Sales performance</h2>
              <p className="small muted" style={{ margin: 0 }}>
                {hoveredPoint
                  ? `${hoveredPoint.label}: ${money(hoveredPoint.revenue ?? hoveredPoint.totalSales ?? 0)} collected · ${hoveredPoint.orders ?? hoveredPoint.count ?? 0} order(s)`
                  : `${PERIOD_CAPTION[selectedPeriod] || selectedPeriod} · ${money(periodCollected)} collected`}
              </p>
            </div>
            {typeof salesSummary?.growth === "number" && (
              <span className="pill">
                {salesSummary.growth >= 0 ? `↗ +${salesSummary.growth}%` : `↘ ${salesSummary.growth}%`}
              </span>
            )}
          </div>

          {isChartLoading ? (
            <div className="h-[190px] animate-pulse rounded-xl bg-[var(--soft)]/60" />
          ) : salesTrend.length === 0 ? (
            <div className="flex h-[170px] items-center justify-center rounded-xl border border-dashed border-[var(--line)] text-xs font-medium text-[var(--muted)]">
              No sales data recorded for this period yet.
            </div>
          ) : (
            <div>
              <div
                style={{
                  height: "170px",
                  display: "flex",
                  alignItems: "end",
                  gap: salesTrend.length > 15 ? "4px" : "10px",
                  paddingTop: "10px",
                }}
              >
                {salesTrend.map((point, index) => {
                  const earned = Number(point?.revenue ?? point?.totalSales ?? 0);
                  const gross = Number(point?.grossSales ?? point?.sales ?? 0);
                  const primaryVal = earned > 0 ? earned : 0;
                  const heightPct =
                    primaryVal > 0
                      ? Math.max(Math.round((primaryVal / maxBarValue) * 100), 8)
                      : gross > 0
                        ? 10
                        : 4;
                  const isHovered = hoveredIndex === index;
                  const barBg =
                    earned > 0
                      ? "linear-gradient(var(--secondary),var(--primary))"
                      : gross > 0
                        ? "#f3d8ae"
                        : "var(--soft)";

                  return (
                    <div
                      key={point.date || point._id || index}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      title={`${point.label}: ${money(earned)} collected (Order value: ${money(gross)}, ${point.orders ?? point.count ?? 0} orders)`}
                      style={{
                        flex: 1,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${heightPct}%`,
                          background: barBg,
                          borderRadius: "6px 6px 0 0",
                          opacity: hoveredIndex !== null && !isHovered ? 0.65 : 1,
                          transition: "opacity 120ms ease, height 200ms ease",
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: salesTrend.length > 15 ? "4px" : "10px",
                  marginTop: "6px",
                }}
              >
                {salesTrend.map((point, index) => {
                  const showLabel =
                    index === 0 ||
                    index === salesTrend.length - 1 ||
                    index % barLabelStep === 0;
                  return (
                    <div
                      key={`lbl-${point.date || index}`}
                      style={{
                        flex: 1,
                        fontSize: "10px",
                        color: "var(--muted)",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {showLabel ? point.label : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
            <span>
              {PERIOD_CAPTION[selectedPeriod] || selectedPeriod} ·{" "}
              <strong>{periodOrders}</strong> order{periodOrders === 1 ? "" : "s"}
            </span>
            <span>
              Order value: <strong>{money(periodGross)}</strong>
              {periodCollected === 0 && grossSalesValue > 0 && selectedPeriod !== "all"
                ? ` · Lifetime: ${money(metrics.totalRevenue ?? grossSalesValue)}`
                : ""}
            </span>
          </div>
        </div>

        <div className="panel">
          <h2>Quick actions</h2>
          <p>
            <button
              type="button"
              className="primarybtn"
              onClick={() => navigate("/vendor/products")}
            >
              Manage products
            </button>
          </p>
          <p>
            <button
              type="button"
              className="outlinebtn"
              onClick={() => navigate("/vendor/products/add")}
            >
              Add new product
            </button>
          </p>
          <p>
            <button
              type="button"
              className="outlinebtn"
              onClick={() => navigate("/vendor/orders")}
            >
              View new orders
            </button>
          </p>
          <p>
            <button
              type="button"
              className="outlinebtn"
              onClick={() => navigate("/vendor/earnings")}
            >
              View earnings
            </button>
          </p>
          <div className="mt-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)] space-y-1">
            <div className="flex justify-between">
              <span>Available balance</span>
              <strong className="text-[var(--text)]">{money(availableBalance)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Platform commission</span>
              <strong className="text-[var(--text)]">{Number(store?.commissionRate ?? 10)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="panel">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 style={{ margin: 0 }}>Low stock alerts</h2>
            <button
              type="button"
              className="btnsm"
              onClick={() => navigate("/vendor/inventory")}
            >
              Manage inventory →
            </button>
          </div>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock left</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p._id}>
                    <td className="font-bold">{p.name}</td>
                    <td>{money(p.price)}</td>
                    <td>
                      <span className={`status ${Number(p.stock) <= 0 ? "red" : "amber"}`}>
                        {Number(p.stock) <= 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btnsm"
                        onClick={() => navigate("/vendor/inventory")}
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 style={{ margin: 0 }}>Recent orders</h2>
          <button
            type="button"
            className="btnsm"
            onClick={() => navigate("/vendor/orders")}
          >
            View all orders →
          </button>
        </div>

        {loading && !dashboardData ? (
          <div className="h-32 animate-pulse rounded-xl bg-[var(--soft)]/50" />
        ) : recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-[var(--muted)]">
            No orders have been placed for your shop yet.
          </div>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr
                    key={o.mongoId || o.id}
                    onClick={() =>
                      o.mongoId
                        ? navigate(`/vendor/orders/${o.mongoId}`)
                        : navigate("/vendor/orders")
                    }
                    className="cursor-pointer hover:bg-[var(--soft)]/40"
                  >
                    <td className="font-bold">
                      {o.id}
                      {o.itemsCount > 1 && (
                        <span className="ml-1.5 text-[11px] font-normal text-[var(--muted)]">
                          ({o.itemsCount} items)
                        </span>
                      )}
                    </td>
                    <td>{o.customer}</td>
                    <td>{o.date}</td>
                    <td className="font-bold">{money(o.amount)}</td>
                    <td>
                      <span className={`status ${statusClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
