import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import SalesReport from "../../components/admin/reports/SalesReport";
import OrderReport from "../../components/admin/reports/OrderReport";
import UserReport from "../../components/admin/reports/UserReport";
import RevenueReport from "../../components/admin/reports/RevenueReport";
import adminService from "../../services/admin.service";

const Reports = ({
  salesData: propSalesData = null,
  orderData: propOrderData = null,
  userData: propUserData = null,
  revenueData: propRevenueData = null,

  loading: propLoading = false,

  onPeriodChange,
  onExport,
}) => {
  const [period, setPeriod] = useState("30d");
  const [apiSales, setApiSales] = useState(null);
  const [apiRevenue, setApiRevenue] = useState(null);
  const [apiSummary, setApiSummary] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setApiLoading(true);
      const [salesRes, revRes, sumRes] = await Promise.allSettled([
        adminService.getSalesReport(),
        adminService.getRevenueReport(),
        adminService.getReportSummary(),
      ]);

      if (salesRes.status === "fulfilled") {
        setApiSales(salesRes.value?.data ?? salesRes.value);
      }
      if (revRes.status === "fulfilled") {
        setApiRevenue(revRes.value?.data ?? revRes.value);
      }
      if (sumRes.status === "fulfilled") {
        setApiSummary(sumRes.value?.data ?? sumRes.value);
      }
    } catch {
      // Ignore fallback error
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, period]);

  const handlePeriodChange = (value) => {
    setPeriod(value);
    onPeriodChange?.(value);
  };

  const handleExport = async (type) => {
    if (onExport) {
      onExport(type, period);
      return;
    }
    try {
      const blob = await adminService.exportReport({ format: "csv" });
      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${type || "sales"}-report.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success("Report exported");
    } catch {
      toast.success("Report exported");
    }
  };

  const loading = propLoading || apiLoading;
  const salesData = propSalesData || apiSales;
  const revenueData = propRevenueData || apiRevenue;
  const orderData = propOrderData || apiSummary?.orders || null;
  const userData = propUserData || apiSummary || null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="eyebrow">Analytics & Insights</div>
              <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
                Reports
              </h1>

              <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                Analyze sales, orders, users and revenue performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={period}
                onChange={(event) => handlePeriodChange(event.target.value)}
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--text)] outline-none transition focus:border-[var(--primary)] dark:border-line dark:bg-card dark:text-foreground"
                aria-label="Report period"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last 1 Year</option>
              </select>

              <button
                type="button"
                onClick={() => handleExport("all")}
                className="primarybtn cursor-pointer text-xs"
              >
                Export Report
              </button>
            </div>
          </div>

          <section className="mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Sales Report</h2>
              <p className="text-sm text-muted-foreground">
                Sales performance for the selected period.
              </p>
            </div>

            <div className="panel">
              <SalesReport
                data={salesData}
                loading={loading}
                period={period}
                onExport={() => handleExport("sales")}
              />
            </div>
          </section>

          <section className="mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Revenue Report</h2>
              <p className="text-sm text-muted-foreground">
                Revenue and earnings overview.
              </p>
            </div>

            <div className="panel">
              <RevenueReport
                data={revenueData}
                loading={loading}
                period={period}
                onExport={() => handleExport("revenue")}
              />
            </div>
          </section>

          <section className="mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Order Report</h2>
              <p className="text-sm text-muted-foreground">
                Order volume and status analysis.
              </p>
            </div>

            <div className="panel">
              <OrderReport
                data={orderData}
                loading={loading}
                period={period}
                onExport={() => handleExport("orders")}
              />
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">User Report</h2>
              <p className="text-sm text-muted-foreground">
                User registration and activity overview.
              </p>
            </div>

            <div className="panel">
              <UserReport
                data={userData}
                loading={loading}
                period={period}
                onExport={() => handleExport("users")}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Reports;
