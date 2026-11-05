import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchAdminDashboard, fetchAdminDashboardAnalytics } from "../../store/slices/Admin/adminDashboardSlice";
import { fetchAdminUsers } from "../../store/slices/Admin/adminUsersSlice";

import DashboardStats from "../../components/admin/dashboard/DashboardStats";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import RevenueChart from "../../components/admin/dashboard/RevenueChart";
import RecentUsers from "../../components/admin/dashboard/RecentUsers";
import RecentOrders from "../../components/admin/dashboard/RecentOrders";
import TopProducts from "../../components/admin/dashboard/TopProducts";

import { fetchAdminOrders } from "../../store/slices/Admin/adminOrdersSlice";
import { fetchProducts } from "../../store/slices/productThunk";

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
  activityLogs: "/admin/activity-logs",
  taxes: "/admin/taxes",
  shipping: "/admin/shipping-zones",
  banners: "/admin/banners",
  inventory: "/admin/inventory",
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Dashboard Stats
  const { stats, loading, error } = useSelector(
    (state) => state.adminDashboard,
  );
  
  // Dashboard Analytics
  const { salesData, revenueData, period, analyticsLoading } = useSelector(
    (state) => state.adminDashboard,
  );

  // Recent Users - take first 5
  const { users: allUsers = [], loading: usersLoading } = useSelector(
    (state) => state.adminUsers || {}
  );
  const recentUsers = allUsers.slice(0, 5);

  // Orders
  const { orders = [], loading: ordersLoading } = useSelector(
    (state) => state.adminOrders || {}
  );
  const recentOrders = orders.slice(0, 5);

  // Products
  const { products: allProducts = [], loading: productsLoading } = useSelector(
    (state) => state.product || {}
  );
  const topProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return [...allProducts]
      .sort((a, b) => (Number(b.totalSales ?? b.sales ?? b.sold ?? 0)) - (Number(a.totalSales ?? a.sales ?? a.sold ?? 0)))
      .slice(0, 5);
  }, [allProducts]);

  const [localPeriod, setLocalPeriod] = useState("7d");
  const isAnalyticsLoading = loading || analyticsLoading;

  // Fetch dashboard data
  useEffect(() => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchAdminUsers({ limit: 5, sortBy: "createdAt" }));
    dispatch(fetchAdminOrders({ limit: 5 }));
    dispatch(fetchProducts({ limit: 10, sortBy: "sales", sortOrder: "desc" }));
  }, [dispatch]);

  // Fetch analytics when period changes
  useEffect(() => {
    dispatch(fetchAdminDashboardAnalytics(localPeriod));
  }, [dispatch, localPeriod]);

  // Sync local period with Redux state
  const currentPeriod = period || localPeriod;

  const handlePeriodChange = (value) => {
    setLocalPeriod(value);
  };

  const handleNavigate = (page) => {
    const route = ADMIN_ROUTES[page];

    if (route) navigate(route);
  };

  const handleRetry = () => {
    dispatch(fetchAdminDashboard());
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isAnalyticsLoading}
                className="rounded-lg border border-red-300 px-3 py-2 font-medium transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {/* Dashboard Statistics */}
          <DashboardStats stats={stats} loading={loading} />

          {/* Charts */}
          <div className="grid gap-6 xl:grid-cols-2">
            <SalesChart data={salesData || []} period={currentPeriod} loading={isAnalyticsLoading} />

            <RevenueChart data={revenueData || []} period={currentPeriod} loading={isAnalyticsLoading} />
          </div>

          {/* Store Activity */}
          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Store Activity
                </h2>

                <p className="text-sm text-muted-foreground">
                  Recent activity across your marketplace
                </p>
              </div>

              <div className="flex rounded-xl border border-border bg-background p-1">
                {PERIODS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePeriodChange(value)}
                    aria-pressed={currentPeriod === value}
                    className={currentPeriod === value
                      ? "rounded-lg px-3 py-2 text-xs font-medium transition bg-primary text-primary-foreground"
                      : "rounded-lg px-3 py-2 text-xs font-medium transition text-muted-foreground hover:bg-muted"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <RecentOrders
              orders={recentOrders}
              loading={loading || ordersLoading}
              onViewOrder={(order) => navigate(`/admin/orders/${order._id}`)}
              onViewAll={() => handleNavigate("orders")}
            />

            {/* Recent Users */}
            <RecentUsers
              users={recentUsers}
              loading={loading || usersLoading}
              onViewUser={(user) => navigate(`/admin/users/${user._id}`)}
              onViewAll={() => handleNavigate("users")}
            />

            {/* Top Products */}
            <TopProducts
              products={topProducts}
              loading={loading || productsLoading}
              onViewProduct={(product) =>
                navigate(`/admin/products/${product._id}`)
              }
              onViewAll={() => handleNavigate("products")}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
