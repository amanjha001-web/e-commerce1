import { useMemo, useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import DashboardStats from "../../components/admin/dashboard/DashboardStats";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import RevenueChart from "../../components/admin/dashboard/RevenueChart";
import RecentOrders from "../../components/admin/dashboard/RecentOrders";
import RecentUsers from "../../components/admin/dashboard/RecentUsers";
import TopProducts from "../../components/admin/dashboard/TopProducts";

const AdminDashboard = ({
  user = null,
  stats = {},
  salesData = [],
  revenueData = [],
  recentOrders = [],
  recentUsers = [],
  topProducts = [],
  loading = false,
  notificationCount = 0,

  onLogout,
  onNavigate,
  onViewOrder,
  onViewUser,
  onViewProduct,
  onPeriodChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("7d");

  const dashboardStats = useMemo(
    () => ({
      totalUsers: stats?.totalUsers ?? 0,
      totalVendors: stats?.totalVendors ?? 0,
      totalProducts: stats?.totalProducts ?? 0,
      totalOrders: stats?.totalOrders ?? 0,
      totalRevenue: stats?.totalRevenue ?? 0,
      pendingOrders: stats?.pendingOrders ?? 0,

      totalUsersChange: stats?.totalUsersChange,
      totalVendorsChange: stats?.totalVendorsChange,
      totalProductsChange: stats?.totalProductsChange,
      totalOrdersChange: stats?.totalOrdersChange,
      totalRevenueChange: stats?.totalRevenueChange,
      pendingOrdersChange: stats?.pendingOrdersChange,
    }),
    [stats],
  );

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    onPeriodChange?.(value);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <AdminSidebar
        activeItem="dashboard"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="lg:pl-64">
        <AdminHeader
          title="Dashboard"
          subtitle="Overview of your store performance"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onProfileClick={() => handleNavigate("profile")}
          onNotificationsClick={() => handleNavigate("notifications")}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Dashboard Stats */}
            <DashboardStats stats={dashboardStats} loading={loading} />

            {/* Charts */}
            <div className="grid gap-6 xl:grid-cols-2">
              <SalesChart data={salesData} period={period} loading={loading} />

              <RevenueChart
                data={revenueData}
                period={period}
                loading={loading}
              />
            </div>

            {/* Store Activity Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Store Activity
                </h2>

                <p className="text-sm text-muted-foreground">
                  Recent activity across your marketplace
                </p>
              </div>

              {/* Period Selector */}
              <div className="flex rounded-xl border border-border bg-background p-1">
                {[
                  { label: "7 Days", value: "7d" },
                  { label: "30 Days", value: "30d" },
                  { label: "90 Days", value: "90d" },
                ].map((item) => {
                  const isActive = period === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handlePeriodChange(item.value)}
                      className={[
                        "rounded-lg px-3 py-2 text-xs font-medium transition",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders */}
            <RecentOrders
              orders={recentOrders}
              loading={loading}
              onViewOrder={onViewOrder}
              onViewAll={() => handleNavigate("orders")}
            />

            {/* Recent Users */}
            <RecentUsers
              users={recentUsers}
              loading={loading}
              onViewUser={onViewUser}
              onViewAll={() => handleNavigate("users")}
            />

            {/* Top Products */}
            <TopProducts
              products={topProducts}
              loading={loading}
              onViewProduct={onViewProduct}
              onViewAll={() => handleNavigate("products")}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;