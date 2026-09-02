import { useMemo, useState } from "react";

import OrderList from "../../components/order/OrderList";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
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
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Account</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Orders
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View and manage all your orders in one place.
          </p>
        </div>

        <Button variant="outline" onClick={() => onNavigate?.("/")}>
          Continue Shopping
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {/* Total Orders */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Orders</p>

          <p className="mt-2 text-2xl font-bold">{orders.length}</p>
        </div>

        {/* Active Orders */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Orders</p>

          <p className="mt-2 text-2xl font-bold text-primary">
            {activeOrdersCount}
          </p>
        </div>

        {/* Delivered */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Delivered</p>

          <p className="mt-2 text-2xl font-bold">{getCount("delivered")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="w-full md:max-w-md">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order ID or status..."
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((item) => {
              const isActive = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <span>{item.label}</span>

                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      isActive ? "bg-primary-foreground/15" : "bg-background",
                    ].join(" ")}
                  >
                    {getCount(item.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <Loader />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={hasFilters ? "No matching orders" : "No orders yet"}
              description={
                hasFilters
                  ? "Try changing your search or status filter."
                  : "Your orders will appear here after you place an order."
              }
            />

            {!hasFilters && (
              <div className="mt-5 flex justify-center">
                <Button onClick={() => onNavigate?.("/products")}>
                  Start Shopping
                </Button>
              </div>
            )}
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

      {/* Navigation */}
      <div className="mt-8 flex justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate?.("/")}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Home
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.("/profile")}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          Account →
        </button>
      </div>
    </main>
  );
};

export default Orders;
