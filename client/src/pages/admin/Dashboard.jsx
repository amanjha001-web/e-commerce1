import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchAdminDashboard,
  fetchAdminDashboardAnalytics,
  fetchAdminRecentOrders,
  fetchAdminLowStockProducts,
} from "../../store/slices/Admin/adminDashboardSlice";
import { fetchAdminUsers } from "../../store/slices/Admin/adminUsersSlice";
import { fetchAdminOrders } from "../../store/slices/Admin/adminOrdersSlice";
import adminService from "../../services/admin.service";

import DashboardStats from "../../components/admin/dashboard/DashboardStats";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import RevenueChart from "../../components/admin/dashboard/RevenueChart";
import RecentUsers from "../../components/admin/dashboard/RecentUsers";
import RecentOrders from "../../components/admin/dashboard/RecentOrders";
import TopProducts from "../../components/admin/dashboard/TopProducts";
import LowStockProducts from "../../components/admin/dashboard/LowStockProducts";

const PERIODS = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

const ADMIN_ROUTES = {
  users: "/admin/users",
  vendors: "/admin/vendors",
  vendorRequests: "/admin/vendor-requests",
  products: "/admin/products",
  orders: "/admin/orders",
  payments: "/admin/payments",
  coupons: "/admin/coupons",
  categories: "/admin/categories",
  brands: "/admin/brands",
  reports: "/admin/reports",
  support: "/admin/support",
  settings: "/admin/settings",
  notifications: "/admin/notifications",
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    stats,
    loading,
    error,
    salesData,
    revenueData,
    summary = {},
    recentOrders: dashboardRecentOrders = [],
    recentUsers: dashboardRecentUsers = [],
    topProducts: dashboardTopProducts = [],
    lowStockProducts = [],
    period: analyticsPeriod = "7d",
    analyticsLoading,
  } = useSelector((state) => state.adminDashboard || {});

  const { users: storeUsers = [], loading: usersLoading } = useSelector(
    (state) => state.adminUsers || {},
  );
  const { orders: storeOrders = [], loading: ordersLoading } = useSelector(
    (state) => state.adminOrders || {},
  );

  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [manualPeriod, setManualPeriod] = useState(null);
  const autoAllFallbackRef = useRef(false);
  const selectedPeriod = manualPeriod || analyticsPeriod || "7d";
  const isAnalyticsLoading = loading || analyticsLoading;

  const refreshDashboard = useCallback(
    (activePeriod) => {
      dispatch(fetchAdminDashboard());
      dispatch(fetchAdminDashboardAnalytics(activePeriod));
      dispatch(fetchAdminRecentOrders({ limit: 5 }));
      dispatch(fetchAdminLowStockProducts({ threshold: 10, limit: 5 }));
      dispatch(fetchAdminUsers({ limit: 5, sortBy: "latest" }));
      dispatch(fetchAdminOrders({ limit: 5 }));

      adminService
        .getProducts({ limit: 15, sortBy: "latest" })
        .then((res) => {
          const data = res?.data ?? res;
          const list = Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data)
              ? data
              : [];
          setCatalogProducts(list);
        })
        .catch(() => {})
        .finally(() => setCatalogLoading(false));
    },
    [dispatch],
  );

  useEffect(() => {
    refreshDashboard("7d");
  }, [refreshDashboard]);

  // If Last 7 Days has ₹0 earned revenue while the DB has historical paid orders/payments, automatically show All Time once
  useEffect(() => {
    if (
      autoAllFallbackRef.current ||
      manualPeriod !== null ||
      loading ||
      analyticsLoading ||
      analyticsPeriod !== "7d" ||
      !(revenueData || []).length
    ) {
      return;
    }
    const periodRevenue = (revenueData || []).reduce(
      (sum, item) => sum + (Number(item?.value) || 0),
      0,
    );
    if (periodRevenue === 0 && Number(stats?.totalRevenue || 0) > 0) {
      autoAllFallbackRef.current = true;
      dispatch(fetchAdminDashboardAnalytics("all"));
    }
  }, [
    dispatch,
    manualPeriod,
    loading,
    analyticsLoading,
    analyticsPeriod,
    revenueData,
    stats?.totalRevenue,
  ]);

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === selectedPeriod && !analyticsLoading) return;
    autoAllFallbackRef.current = true;
    setManualPeriod(newPeriod);
    dispatch(fetchAdminDashboardAnalytics(newPeriod));
  };

  const handleRetry = () => {
    setCatalogLoading(true);
    refreshDashboard(selectedPeriod);
  };

  const handleNavigate = (key) => {
    const route = ADMIN_ROUTES[key];
    if (route) {
      navigate(route);
    }
  };

  const topOrdersList = useMemo(() => {
    const source =
      dashboardRecentOrders.length > 0 ? dashboardRecentOrders : storeOrders;
    return source.slice(0, 5);
  }, [dashboardRecentOrders, storeOrders]);

  const topUsersList = useMemo(() => {
    const source =
      dashboardRecentUsers.length > 0 ? dashboardRecentUsers : storeUsers;
    return source.slice(0, 5);
  }, [dashboardRecentUsers, storeUsers]);

  const topProductsList = useMemo(() => {
    const source =
      dashboardTopProducts.length > 0 ? dashboardTopProducts : catalogProducts;
    return [...source]
      .sort(
        (a, b) =>
          Number(b.totalSales ?? b.sales ?? b.sold ?? 0) -
          Number(a.totalSales ?? a.sales ?? a.sold ?? 0),
      )
      .slice(0, 5);
  }, [dashboardTopProducts, catalogProducts]);

  const resolvedLowStock = useMemo(() => {
    if (lowStockProducts.length > 0) return lowStockProducts;
    return catalogProducts.filter((p) => Number(p.stock ?? 0) <= 10);
  }, [lowStockProducts, catalogProducts]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl dark:text-foreground">
            Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-white p-1 shadow-xs dark:bg-card dark:border-line">
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
            disabled={isAnalyticsLoading}
            onClick={handleRetry}
            className="outlinebtn cursor-pointer !py-1.5 !px-3 !text-xs disabled:opacity-50"
          >
            {isAnalyticsLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] p-4 text-xs font-bold text-[var(--red)]"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isAnalyticsLoading}
              className="btnsm text-[var(--red)]"
            >
              {loading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        <DashboardStats
          stats={stats}
          loading={loading && !stats?.totalOrders && !stats?.totalUsers}
          onNavigate={handleNavigate}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <SalesChart
            data={salesData || []}
            period={selectedPeriod}
            loading={isAnalyticsLoading && !(salesData || []).length}
            growth={summary.ordersGrowth}
          />
          <RevenueChart
            data={revenueData || []}
            period={selectedPeriod}
            loading={isAnalyticsLoading && !(revenueData || []).length}
            growth={summary.revenueGrowth}
            averageOrderValue={summary.averageOrderValue}
            grossSales={summary.grossSales}
            lifetimeRevenue={stats?.totalRevenue}
          />
        </div>

        {/* Store Activity */}
        <div className="space-y-6">
          <RecentOrders
            orders={topOrdersList}
            loading={(loading || ordersLoading) && !topOrdersList.length}
            onViewOrder={() => handleNavigate("orders")}
            onViewAll={() => handleNavigate("orders")}
          />

          <RecentUsers
            users={topUsersList}
            loading={(loading || usersLoading) && !topUsersList.length}
            onViewUser={(user) =>
              user?._id
                ? navigate(`/admin/users/${user._id}`)
                : handleNavigate("users")
            }
            onViewAll={() => handleNavigate("users")}
          />

          <TopProducts
            products={topProductsList}
            loading={(loading || catalogLoading) && !topProductsList.length}
            onViewProduct={() => handleNavigate("products")}
            onViewAll={() => handleNavigate("products")}
          />

          <LowStockProducts
            products={resolvedLowStock}
            fallbackProducts={catalogProducts}
            loading={
              (loading || catalogLoading) &&
              !resolvedLowStock.length &&
              !catalogProducts.length
            }
            onViewProduct={() => handleNavigate("products")}
            onViewAll={() => handleNavigate("products")}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
