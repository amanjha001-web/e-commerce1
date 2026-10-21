import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchAdminDashboard } from "../../store/slices/adminDashboardSlice";

import DashboardStats from "../../components/admin/dashboard/DashboardStats";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import RevenueChart from "../../components/admin/dashboard/RevenueChart";
import RecentOrders from "../../components/admin/dashboard/RecentOrders";
import RecentUsers from "../../components/admin/dashboard/RecentUsers";
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
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { stats, loading, error } = useSelector(
    (state) => state.adminDashboard,
  );

  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

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
                disabled={loading}
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
            <SalesChart data={[]} period={period} loading={loading} />

            <RevenueChart data={[]} period={period} loading={loading} />
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
                    onClick={() => setPeriod(value)}
                    aria-pressed={period === value}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      period === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <RecentOrders
              orders={[]}
              loading={loading}
              onViewOrder={(order) => navigate(`/admin/orders/${order._id}`)}
              onViewAll={() => handleNavigate("orders")}
            />

            {/* Recent Users */}
            <RecentUsers
              users={[]}
              loading={loading}
              onViewUser={(user) => navigate(`/admin/users/${user._id}`)}
              onViewAll={() => handleNavigate("users")}
            />

            {/* Top Products */}
            <TopProducts
              products={[]}
              loading={loading}
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
