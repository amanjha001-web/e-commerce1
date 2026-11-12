import { useEffect, useMemo, useState } from "react";
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
import { fetchProducts } from "../../store/slices/productThunk";

import DashboardStats from "../../components/admin/dashboard/DashboardStats";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import RevenueChart from "../../components/admin/dashboard/RevenueChart";
import RecentUsers from "../../components/admin/dashboard/RecentUsers";
import RecentOrders from "../../components/admin/dashboard/RecentOrders";
import TopProducts from "../../components/admin/dashboard/TopProducts";

const PERIODS = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
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
  reviews: "/admin/reviews",
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
    recentOrders: dashboardRecentOrders = [],
    lowStockProducts = [],
    period,
    analyticsLoading,
  } = useSelector((state) => state.adminDashboard);

  const { users: allUsers = [], loading: usersLoading } = useSelector(
    (state) => state.adminUsers || {},
  );
  const recentUsers = allUsers.slice(0, 5);

  const { orders = [], loading: ordersLoading } = useSelector(
    (state) => state.adminOrders || {},
  );
  const recentOrders = useMemo(() => {
    const source =
      dashboardRecentOrders.length > 0 ? dashboardRecentOrders : orders;
    return source.slice(0, 5);
  }, [dashboardRecentOrders, orders]);

  const { products: allProducts = [], loading: productsLoading } = useSelector(
    (state) => state.product || {},
  );
  const topProducts = useMemo(() => {
    if (allProducts && allProducts.length > 0) {
      return [...allProducts]
        .sort(
          (a, b) =>
            Number(b.totalSales ?? b.sales ?? b.sold ?? 0) -
            Number(a.totalSales ?? a.sales ?? a.sold ?? 0),
        )
        .slice(0, 5);
    }
    return lowStockProducts.slice(0, 5);
  }, [allProducts, lowStockProducts]);

  const [localPeriod, setLocalPeriod] = useState("7d");
  const isAnalyticsLoading = loading || analyticsLoading;

  useEffect(() => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchAdminRecentOrders({ limit: 5 }));
    dispatch(fetchAdminLowStockProducts({ threshold: 10, limit: 5 }));
    dispatch(fetchAdminUsers({ limit: 5, sortBy: "newest" }));
    dispatch(fetchAdminOrders({ limit: 5 }));
    dispatch(fetchProducts({ limit: 10, sortBy: "sales", sortOrder: "desc" }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAdminDashboardAnalytics(localPeriod));
  }, [dispatch, localPeriod]);

  useEffect(() => {
    if (period && period !== localPeriod) {
      setLocalPeriod(period);
    }
  }, [period, localPeriod]);

  const handlePeriodChange = (newPeriod) => {
    setLocalPeriod(newPeriod);
    dispatch(fetchAdminDashboardAnalytics(newPeriod));
  };

  const handleRetry = () => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchAdminDashboardAnalytics(localPeriod));
    dispatch(fetchAdminRecentOrders({ limit: 5 }));
    dispatch(fetchAdminLowStockProducts({ threshold: 10, limit: 5 }));
  };

  const handleNavigate = (key) => {
    const route = ADMIN_ROUTES[key];
    if (route) {
      navigate(route);
    }
  };

  const currentPeriod = period || localPeriod;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl dark:text-foreground">
            Dashboard
          </h1>
        </div>

        <div className="flex gap-1.5 rounded-xl border border-[var(--line)] bg-white p-1 shadow-xs dark:bg-card dark:border-line">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => handlePeriodChange(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                currentPeriod === value
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--primary)]"
              }`}
            >
              {label}
            </button>
          ))}
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

        <DashboardStats stats={stats} loading={loading} />

        <div className="grid gap-6 xl:grid-cols-2">
          <SalesChart
            data={salesData || []}
            period={currentPeriod}
            loading={isAnalyticsLoading}
          />
          <RevenueChart
            data={revenueData || []}
            period={currentPeriod}
            loading={isAnalyticsLoading}
          />
        </div>

        {/* Store Activity — 1 per row (Recent Orders, then Recent Users, then Top Performing Products) */}
        <div className="space-y-6">
          <RecentOrders
            orders={recentOrders}
            loading={loading || ordersLoading}
            onViewOrder={() => handleNavigate("orders")}
            onViewAll={() => handleNavigate("orders")}
          />

          <RecentUsers
            users={recentUsers}
            loading={loading || usersLoading}
            onViewUser={(user) =>
              user?._id
                ? navigate(`/admin/users/${user._id}`)
                : handleNavigate("users")
            }
            onViewAll={() => handleNavigate("users")}
          />

          <TopProducts
            products={topProducts}
            loading={loading || productsLoading}
            onViewProduct={() => handleNavigate("products")}
            onViewAll={() => handleNavigate("products")}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
