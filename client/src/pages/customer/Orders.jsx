import { useMemo, useState } from "react";

import OrderList from "../../components/order/OrderList";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Pending", value: "pending" },
  { label: "Cancelled", value: "cancelled" },
];

const ACTIVE_STATUSES = [
  "pending",
  "processing",
  "confirmed",
  "shipped",
  "out_for_delivery",
];

const getStatus = (order) =>
  String(order?.status || order?.orderStatus || "pending").toLowerCase();

const getOrderId = (order) => order?._id || order?.id || order?.orderId || "";

const Orders = ({
  orders = [],
  loading = false,
  onViewOrder,
  onTrackOrder,
  onCancelOrder,
  onReturnOrder,
  onNavigate,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = getStatus(order);

      const matchesFilter = filter === "all" || status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const orderId = String(getOrderId(order)).toLowerCase();

      return orderId.includes(keyword) || status.includes(keyword);
    });
  }, [orders, search, filter]);

  const getCount = (status) => {
    if (status === "all") {
      return orders.length;
    }

    return orders.filter((order) => getStatus(order) === status).length;
  };

  const activeOrdersCount = orders.filter((order) =>
    ACTIVE_STATUSES.includes(getStatus(order)),
  ).length;

  const hasFilters = Boolean(search.trim() || filter !== "all");

  return (
    <CustomerWorkspace
      title="My Orders"
      eyebrow="Customer workspace"
      action={
        <button
          type="button"
          onClick={() => onNavigate?.("/products")}
          className="outlinebtn !py-2 !px-3 !text-xs"
        >
          Continue Shopping
        </button>
      }
    >
      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* Total Orders */}
        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Total Orders
          </span>
          <strong className="mt-1 block text-2xl font-black text-[var(--text)] dark:text-foreground">
            {orders.length}
          </strong>
          <span className="text-[11px] font-bold text-[var(--muted)]">Lifetime purchases</span>
        </div>

        {/* Active Orders */}
        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            In Transit
          </span>
          <strong className="mt-1 block text-2xl font-black text-[#b7791f]">
            {activeOrdersCount}
          </strong>
          <span className="text-[11px] font-bold text-[#16845b]">↗ In progress</span>
        </div>

        {/* Delivered */}
        <div className="stat-card col-span-2 sm:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Delivered
          </span>
          <strong className="mt-1 block text-2xl font-black text-[#16845b]">
            {getCount("delivered")}
          </strong>
          <span className="text-[11px] font-bold text-[#16845b]">✓ Completed</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs dark:bg-card dark:border-line">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID..."
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => {
              const isActive = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--soft)] hover:text-[var(--primary)] dark:bg-card"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--soft)] text-[var(--primary)]"
                    }`}
                  >
                    {getCount(item.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState
              title={hasFilters ? "No matching orders" : "No orders placed yet"}
              message={
                hasFilters
                  ? "Try changing your search term or status filter."
                  : "Your orders will appear here once you make your first purchase."
              }
              action={!hasFilters ? () => onNavigate?.("/products") : undefined}
              actionText="Start Shopping"
            />
          </div>
        ) : (
          <OrderList
            orders={filteredOrders}
            onView={onViewOrder}
            onTrack={onTrackOrder}
            onCancel={onCancelOrder}
            onReturn={onReturnOrder}
          />
        )}
      </div>
    </CustomerWorkspace>
  );
};

export default Orders;
