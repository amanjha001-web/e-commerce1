import { useMemo, useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import OrderTable from "../../components/vendor/OrderTable";

import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const STATUS_OPTIONS = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const getOrderStatus = (order) =>
  String(order?.status || order?.orderStatus || "pending").toLowerCase();

const getOrderNumber = (order) =>
  order?.orderNumber || order?.orderId || order?._id || "";

const getCustomerName = (order) =>
  order?.customer?.fullName ||
  order?.customer?.name ||
  order?.user?.fullName ||
  order?.user?.name ||
  "";

const getCustomerEmail = (order) =>
  order?.customer?.email || order?.user?.email || "";

const Orders = ({
  user = null,
  orders = [],
  loading = false,
  actionLoading = false,
  notificationCount = 0,

  onViewOrder,
  onUpdateStatus,
  onCancelOrder,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderNumber = String(getOrderNumber(order)).toLowerCase();

      const customerName = getCustomerName(order).toLowerCase();

      const customerEmail = getCustomerEmail(order).toLowerCase();

      const orderStatus = getOrderStatus(order);

      const matchesSearch =
        !keyword ||
        orderNumber.includes(keyword) ||
        customerName.includes(keyword) ||
        customerEmail.includes(keyword);

      const matchesStatus = status === "all" || orderStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const statusCount = (value) =>
    orders.filter((order) => getOrderStatus(order) === value).length;

  const hasFilters = Boolean(search.trim()) || status !== "all";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <VendorSidebar
        activeItem="orders"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        <VendorHeader
          title="Orders"
          subtitle="Manage orders received by your store"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onProfileClick={() => handleNavigate("profile")}
          onNotificationsClick={() => handleNavigate("notifications")}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Store Orders
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  View, track and manage customer orders.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => handleNavigate("dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Orders */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Total Orders</p>

                <p className="mt-2 text-2xl font-bold text-foreground">
                  {orders.length}
                </p>
              </div>

              {/* Pending */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Pending</p>

                <p className="mt-2 text-2xl font-bold text-warning">
                  {statusCount("pending")}
                </p>
              </div>

              {/* Processing */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Processing</p>

                <p className="mt-2 text-2xl font-bold text-primary">
                  {statusCount("processing")}
                </p>
              </div>

              {/* Delivered */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Delivered</p>

                <p className="mt-2 text-2xl font-bold text-success">
                  {statusCount("delivered")}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order number or customer..."
                />

                <Select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            {/* Orders Table */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Orders List
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredOrders.length} order
                  {filteredOrders.length === 1 ? "" : "s"} found.
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No orders found"
                    description={
                      hasFilters
                        ? "Try changing your search or status filter."
                        : "Orders from your customers will appear here."
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <OrderTable
                    orders={filteredOrders}
                    onViewOrder={onViewOrder}
                    onUpdateStatus={onUpdateStatus}
                    onCancelOrder={onCancelOrder}
                    actionLoading={actionLoading}
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Orders;
