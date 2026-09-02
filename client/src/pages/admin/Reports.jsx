import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import SalesReport from "../../components/admin/reports/SalesReport";
import OrderReport from "../../components/admin/reports/OrderReport";
import UserReport from "../../components/admin/reports/UserReport";
import RevenueReport from "../../components/admin/reports/RevenueReport";

const Reports = ({
  user = null,

  salesData = null,
  orderData = null,
  userData = null,
  revenueData = null,

  loading = false,

  notificationCount = 0,

  onPeriodChange,
  onExport,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("30d");

  const handlePeriodChange = (value) => {
    setPeriod(value);
    onPeriodChange?.(value);
  };

  const handleExport = (type) => {
    onExport?.(type, period);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader
        user={user}
        notificationCount={notificationCount}
        onMenuClick={() => setSidebarOpen(true)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Reports
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Analyze sales, orders, users and revenue performance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={period}
                  onChange={(event) => handlePeriodChange(event.target.value)}
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                  aria-label="Report period"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last 1 Year</option>
                </select>

                {onExport && (
                  <button
                    type="button"
                    onClick={() => handleExport("all")}
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Export Report
                  </button>
                )}
              </div>
            </div>

            {/* Sales Report */}
            <section className="mb-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Sales Report</h2>

                <p className="text-sm text-muted-foreground">
                  Sales performance for the selected period.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <SalesReport
                  data={salesData}
                  loading={loading}
                  period={period}
                  onExport={onExport ? () => handleExport("sales") : undefined}
                />
              </div>
            </section>

            {/* Revenue Report */}
            <section className="mb-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Revenue Report</h2>

                <p className="text-sm text-muted-foreground">
                  Revenue and earnings overview.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <RevenueReport
                  data={revenueData}
                  loading={loading}
                  period={period}
                  onExport={
                    onExport ? () => handleExport("revenue") : undefined
                  }
                />
              </div>
            </section>

            {/* Order Report */}
            <section className="mb-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Order Report</h2>

                <p className="text-sm text-muted-foreground">
                  Order volume and status analysis.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <OrderReport
                  data={orderData}
                  loading={loading}
                  period={period}
                  onExport={onExport ? () => handleExport("orders") : undefined}
                />
              </div>
            </section>

            {/* User Report */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">User Report</h2>

                <p className="text-sm text-muted-foreground">
                  User registration and activity overview.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <UserReport
                  data={userData}
                  loading={loading}
                  period={period}
                  onExport={onExport ? () => handleExport("users") : undefined}
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
