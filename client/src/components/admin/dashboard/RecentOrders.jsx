import { useMemo } from "react";

const RecentOrders = ({
  orders = [],
  loading = false,
  onViewOrder,
  onViewAll,
}) => {
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  const getStatusClass = (status) => {
    const statusMap = {
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      confirmed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      processing:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      shipped:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      delivered:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      refunded:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };

    return statusMap[status?.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />

                <div>
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>

              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Latest customer orders
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-primary transition hover:opacity-80"
        >
          View All
        </button>
      </div>

      {/* Empty State */}
      {!recentOrders.length ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
            🛒
          </div>

          <h3 className="text-sm font-semibold text-foreground">
            No recent orders
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Orders will appear here once customers place them.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Order</th>

                  <th className="px-6 py-4 font-medium">Customer</th>

                  <th className="px-6 py-4 font-medium">Date</th>

                  <th className="px-6 py-4 font-medium">Amount</th>

                  <th className="px-6 py-4 font-medium">Status</th>

                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order, index) => {
                  const orderId =
                    order.orderNumber ||
                    order.orderId ||
                    order._id ||
                    `#${index + 1}`;

                  const customerName =
                    order.customer?.fullName ||
                    order.user?.fullName ||
                    order.user?.name ||
                    order.customerName ||
                    "Unknown Customer";

                  const amount =
                    order.totalAmount ?? order.total ?? order.amount ?? 0;

                  return (
                    <tr
                      key={order._id || order.orderId || index}
                      className="border-b border-border last:border-0 transition hover:bg-muted/30"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">
                          #{String(orderId).replace(/^#/, "")}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-foreground">
                          {customerName}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(order.createdAt || order.date)}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        ₹{Number(amount).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            order.status,
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onViewOrder?.(order)}
                          className="text-sm font-medium text-primary transition hover:opacity-80"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-border md:hidden">
            {recentOrders.map((order, index) => {
              const orderId =
                order.orderNumber ||
                order.orderId ||
                order._id ||
                `#${index + 1}`;

              const customerName =
                order.customer?.fullName ||
                order.user?.fullName ||
                order.user?.name ||
                order.customerName ||
                "Unknown Customer";

              const amount =
                order.totalAmount ?? order.total ?? order.amount ?? 0;

              return (
                <div key={order._id || order.orderId || index} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">
                        #{String(orderId).replace(/^#/, "")}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {customerName}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                        order.status,
                      )}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>

                      <p className="mt-1 font-semibold text-foreground">
                        ₹{Number(amount).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Date</p>

                      <p className="mt-1 text-sm text-foreground">
                        {formatDate(order.createdAt || order.date)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewOrder?.(order)}
                    className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    View Order
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RecentOrders;
