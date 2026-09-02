
import { useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import DashboardCard from "../../components/vendor/DashboardCard";
import StatsCard from "../../components/vendor/StatsCard";
import EarningsCard from "../../components/vendor/EarningsCard";
import SalesChart from "../../components/vendor/SalesChart";

import OrderTable from "../../components/vendor/OrderTable";
import ProductTable from "../../components/vendor/ProductTable";

import Loader from "../../components/common/Loader";
import Button from "../../components/common/Button";

const Dashboard = ({
  user = null,
  stats = {},
  earnings = {},
  salesData = [],
  recentOrders = [],
  topProducts = [],
  loading = false,
  notificationCount = 0,
  onNavigate,
  onViewOrder,
  onViewProduct,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("7d");

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <VendorSidebar
        activeItem="dashboard"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="lg:pl-64">
        <VendorHeader
          title="Dashboard"
          subtitle="Overview of your store performance"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onProfileClick={() =>
            handleNavigate("profile")
          }
          onNotificationsClick={() =>
            handleNavigate("notifications")
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Welcome */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  Welcome back
                </p>

                <h1 className="mt-1 text-2xl font-bold text-foreground">
                  {user?.fullName ||
                    user?.name ||
                    "Vendor"}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Here's what's happening with your store today.
                </p>
              </div>

              <Button
                onClick={() =>
                  handleNavigate("add-product")
                }
              >
                Add Product
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="Total Sales"
                value={
                  stats?.totalSales ??
                  stats?.sales ??
                  0
                }
                change={stats?.salesChange}
              />

              <StatsCard
                title="Total Orders"
                value={
                  stats?.totalOrders ??
                  stats?.orders ??
                  0
                }
                change={stats?.ordersChange}
              />

              <StatsCard
                title="Total Products"
                value={
                  stats?.totalProducts ??
                  stats?.products ??
                  0
                }
                change={stats?.productsChange}
              />

              <StatsCard
                title="Customers"
                value={
                  stats?.totalCustomers ??
                  stats?.customers ??
                  0
                }
                change={stats?.customersChange}
              />
            </div>

            {/* Earnings */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <EarningsCard
                  earnings={earnings}
                />
              </div>

              <DashboardCard
                title="Pending Orders"
                value={
                  stats?.pendingOrders ?? 0
                }
              />
            </div>

            {/* Sales Chart */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Sales Overview
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Track your store sales over time.
                  </p>
                </div>

                <div className="flex rounded-xl border border-border bg-background p-1">
                  {[
                    {
                      label: "7 Days",
                      value: "7d",
                    },
                    {
                      label: "30 Days",
                      value: "30d",
                    },
                    {
                      label: "90 Days",
                      value: "90d",
                    },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setPeriod(item.value)
                      }
                      className={[
                        "rounded-lg px-3 py-2 text-xs font-medium transition",
                        period === item.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <SalesChart
                data={salesData}
                period={period}
              />
            </section>

            {/* Recent Orders */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Recent Orders
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Latest orders received by your store.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    handleNavigate("orders")
                  }
                >
                  View All
                </Button>
              </div>

              <div className="overflow-x-auto">
                <OrderTable
                  orders={recentOrders}
                  onViewOrder={onViewOrder}
                />
              </div>
            </section>

            {/* Top Products */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Top Products
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Your best performing products.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    handleNavigate("products")
                  }
                >
                  View All
                </Button>
              </div>

              <div className="overflow-x-auto">
                <ProductTable
                  products={topProducts}
                  onViewProduct={onViewProduct}
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
