
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchVendorDashboard } from "../../store/slices/vendorDashboardSlice";

// Currency formatter
const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

// Date formatter
const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Status badge
const StatusBadge = ({ status }) => {
  const value = String(status || "Unknown");
  const normalized = value.toLowerCase();

  let styles = "bg-slate-500/10 text-slate-300 border-slate-500/20";

  if (
    ["completed", "delivered", "published", "approved", "active", "paid"].includes(
      normalized
    )
  ) {
    styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (
    ["pending", "confirmed", "processing", "draft"].includes(normalized)
  ) {
    styles = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (
    ["cancelled", "canceled", "failed", "rejected", "inactive"].includes(
      normalized
    )
  ) {
    styles = "bg-red-500/10 text-red-400 border-red-500/20";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {value}
    </span>
  );
};

// Reusable statistic card
const StatCard = ({ title, value, description }) => (
  <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 transition hover:border-blue-500/40">
    <p className="text-sm text-slate-400">{title}</p>

    <h3 className="mt-3 text-2xl font-bold text-white">
      {value}
    </h3>

    <p className="mt-2 text-xs text-slate-500">{description}</p>
  </div>
);

const Dashboard = () => {
  console.log("VENDOR DASHBOARD RENDERED");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    data: dashboardData,
    loading,
    error,
  } = useSelector((state) => state.vendorDashboard);

  useEffect(() => {
    dispatch(fetchVendorDashboard());
  }, [dispatch]);

  // Data comes from the backend response
  const vendor = dashboardData?.vendor ?? {};
  const stats = dashboardData?.stats ?? {};
  const earnings = dashboardData?.earnings ?? {};
  const recentOrders = dashboardData?.recentOrders ?? [];
  const topProducts = dashboardData?.topProducts ?? [];

  const handleRefresh = () => {
    dispatch(fetchVendorDashboard());
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="mt-4 text-sm text-slate-400">
            Loading vendor dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0e1422] p-6 text-center">
          <h2 className="text-xl font-semibold text-white">
            Dashboard could not load
          </h2>

          <p className="mt-3 break-words text-sm text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#070b14]/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Vendor Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage your store, orders and earnings.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-[#0e1422] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </header>

      <main className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Store information */}
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1422] to-[#111c35] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-400">Welcome to your store</p>

              <h2 className="mt-2 text-2xl font-bold">
                {vendor.shopName || "My Store"}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Vendor ID: {vendor._id || "—"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={vendor.isApproved ? "Approved" : "Not Approved"}
              />

              <StatusBadge
                status={vendor.isVerified ? "Verified" : "Not Verified"}
              />

              <StatusBadge
                status={vendor.isActive ? "Active" : "Inactive"}
              />
            </div>
          </div>
        </section>

        {/* Dashboard error while retaining existing data */}
        {error && dashboardData && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Statistics */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Store Overview</h2>
            <p className="mt-1 text-sm text-slate-400">
              Summary of your store performance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Products"
              value={stats.totalProducts ?? 0}
              description="Products listed in your store"
            />

            <StatCard
              title="Total Orders"
              value={stats.totalOrders ?? 0}
              description="Orders associated with your store"
            />

            <StatCard
              title="Total Sales"
              value={formatCurrency(stats.totalSales)}
              description="Total sales reported by the backend"
            />

            <StatCard
              title="Total Earnings"
              value={formatCurrency(stats.totalEarnings)}
              description="Your reported vendor earnings"
            />

            <StatCard
              title="Pending Orders"
              value={stats.pendingOrders ?? 0}
              description="Orders awaiting completion"
            />

            <StatCard
              title="Delivered Orders"
              value={stats.deliveredOrders ?? 0}
              description="Orders marked as delivered"
            />

            <StatCard
              title="Low Stock Products"
              value={stats.lowStockProducts ?? 0}
              description="Products flagged as low stock"
            />
          </div>
        </section>

        {/* Earnings */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Earnings Overview</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-500/20 bg-[#0e1422] p-5">
              <p className="text-sm text-slate-400">Pending Earnings</p>
              <h3 className="mt-3 text-2xl font-bold text-amber-400">
                {formatCurrency(earnings.pending)}
              </h3>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#0e1422] p-5">
              <p className="text-sm text-slate-400">Available Earnings</p>
              <h3 className="mt-3 text-2xl font-bold text-emerald-400">
                {formatCurrency(earnings.available)}
              </h3>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-[#0e1422] p-5">
              <p className="text-sm text-slate-400">Withdrawn Earnings</p>
              <h3 className="mt-3 text-2xl font-bold text-blue-400">
                {formatCurrency(earnings.withdrawn)}
              </h3>
            </div>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e1422]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
            <div>
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest orders returned by your backend.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/vendor/orders")}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              View Orders →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">
              No recent orders found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#070b14]/70 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Order Number</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">Items</th>
                    <th className="px-5 py-4 font-medium">Order Total</th>
                    <th className="px-5 py-4 font-medium">Order Status</th>
                    <th className="px-5 py-4 font-medium">Payment</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4 font-medium text-white">
                        {order.orderNumber || order._id || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {Array.isArray(order.items)
                          ? order.items.reduce(
                              (total, item) =>
                                total + (Number(item.quantity) || 0),
                              0
                            )
                          : 0}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-white">
                        {formatCurrency(order.vendorOrderTotal)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.orderStatus} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top Products */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e1422]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
            <div>
              <h2 className="text-lg font-semibold">Top Products</h2>
              <p className="mt-1 text-sm text-slate-400">
                Products included in the dashboard response.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/vendor/products")}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Manage Products →
            </button>
          </div>

          {topProducts.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">
              No products found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#070b14]/70 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Product</th>
                    <th className="px-5 py-4 font-medium">Price</th>
                    <th className="px-5 py-4 font-medium">Stock</th>
                    <th className="px-5 py-4 font-medium">Sold</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {topProducts.map((product) => {
                    const imageUrl =
                      product.thumbnail?.url ||
                      product.images?.[0]?.url ||
                      (typeof product.images?.[0] === "string"
                        ? product.images[0]
                        : "");

                    return (
                      <tr
                        key={product._id}
                        className="transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name || "Product"}
                                className="h-12 w-12 rounded-xl border border-slate-700 bg-[#070b14] object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-[#070b14] text-xs text-slate-500">
                                N/A
                              </div>
                            )}

                            <span className="max-w-[260px] font-medium text-white">
                              {product.name || "Unnamed Product"}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                          {formatCurrency(product.price)}
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {product.stock ?? 0}
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {product.sold ?? 0}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={product.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};


export default Dashboard;
