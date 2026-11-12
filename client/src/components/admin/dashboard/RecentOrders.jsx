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
    const s = String(status || "").toLowerCase();
    if (s === "delivered" || s === "completed") {
      return "bg-[#e7f6ef] text-[#16845b]";
    }
    if (s === "processing" || s === "shipped" || s === "confirmed" || s === "pending") {
      return "bg-[#fff4df] text-[#9b6814]";
    }
    if (s === "cancelled" || s === "failed" || s === "refunded") {
      return "bg-[#ffeaec] text-[#bd3345]";
    }
    return "bg-[var(--soft)] text-[var(--primary)]";
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
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-[var(--soft)]" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-[var(--soft)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
        <div>
          <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
            Recent orders
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Latest transactions across store
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[var(--primary)] hover:underline"
        >
          View all →
        </button>
      </div>

      {/* Empty State */}
      {!recentOrders.length ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-xs text-[var(--muted)]">
            No recent orders available.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#fcf9fa] text-[11px] font-black uppercase tracking-wider text-[var(--muted)] dark:bg-card/40">
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
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
                  "Customer";

                const amount =
                  order.totalAmount ?? order.total ?? order.amount ?? 0;

                const status = order.status || order.orderStatus || "pending";

                return (
                  <tr
                    key={order._id || order.orderId || index}
                    className="border-b border-[#f0e8eb] transition hover:bg-[var(--soft)]/30 dark:border-line"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-[var(--text)] dark:text-foreground">
                      #{String(orderId).slice(-6)}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-medium text-[var(--text)] dark:text-foreground">
                      {customerName}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[var(--muted)]">
                      {formatDate(order.createdAt || order.date)}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-black text-[var(--text)] dark:text-foreground">
                      ₹{Number(amount).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${getStatusClass(
                          status,
                        )}`}
                      >
                        {formatStatus(status)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewOrder?.(order)}
                        className="btnsm text-[11px] !py-1 !px-2.5"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
