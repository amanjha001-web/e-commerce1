
import { useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import OrderStatus from "../../components/order/OrderStatus";
import OrderSummary from "../../components/order/OrderSummary";
import OrderTimeline from "../../components/order/OrderTimeline";
import OrderItem from "../../components/order/OrderItem";

import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const OrderDetails = ({
  user = null,
  order = null,
  loading = false,
  actionLoading = false,
  notificationCount = 0,

  onUpdateStatus,
  onTrackOrder,
  onCancelOrder,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const handleStatusChange = (status) => {
    if (!order || actionLoading) return;

    onUpdateStatus?.(order, status);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/30">
        <VendorSidebar
          activeItem="orders"
          collapsed={false}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div className="lg:pl-64">
          <VendorHeader
            title="Order Details"
            subtitle="View order information"
            user={user}
            notificationCount={notificationCount}
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={onLogout}
            onProfileClick={() => handleNavigate("profile")}
            onNotificationsClick={() =>
              handleNavigate("notifications")
            }
          />

          <main className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <EmptyState
                  title="Order not found"
                  description="The order you're looking for could not be found."
                />

                <div className="mt-6">
                  <Button
                    onClick={() => handleNavigate("orders")}
                  >
                    Back to Orders
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const orderId =
    order?.orderNumber ||
    order?.orderId ||
    order?._id ||
    "—";

  const customer =
    order?.customer ||
    order?.user ||
    {};

  const items =
    order?.items ||
    order?.orderItems ||
    [];

  const shippingAddress =
    order?.shippingAddress ||
    order?.address ||
    {};

  const payment =
    order?.payment ||
    {};

  const status =
    order?.status ||
    "pending";

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorSidebar
        activeItem="orders"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <VendorHeader
          title="Order Details"
          subtitle={`Order #${orderId}`}
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onProfileClick={() => handleNavigate("profile")}
          onNotificationsClick={() =>
            handleNavigate("notifications")
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <Breadcrumb
              items={[
                {
                  label: "Vendor",
                  onClick: () => handleNavigate("dashboard"),
                },
                {
                  label: "Orders",
                  onClick: () => handleNavigate("orders"),
                },
                {
                  label: `Order #${orderId}`,
                },
              ]}
            />

            {/* Order Header */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Order
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-foreground">
                    #{orderId}
                  </h1>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Placed on{" "}
                    {order?.createdAt
                      ? new Date(
                          order.createdAt
                        ).toLocaleString("en-IN")
                      : "—"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <OrderStatus status={status} />

                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() =>
                      onTrackOrder?.(order)
                    }
                  >
                    Track Order
                  </Button>
                </div>
              </div>
            </section>

            {/* Status Management */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Update Order Status
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update the order as it moves through fulfillment.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "pending",
                  "confirmed",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      handleStatusChange(item)
                    }
                    className={[
                      "rounded-xl border px-4 py-2 text-sm font-medium capitalize transition",
                      status === item
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            {/* Main Grid */}
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                {/* Customer */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Customer Information
                  </h2>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Name
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {customer?.fullName ||
                          customer?.name ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Email
                      </p>
                      <p className="mt-1 break-all font-medium text-foreground">
                        {customer?.email || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Phone
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {customer?.phone || "—"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Items */}
                <section className="rounded-2xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      Order Items
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {items.length} item
                      {items.length === 1 ? "" : "s"} in this order.
                    </p>
                  </div>

                  {items.length === 0 ? (
                    <div className="p-8">
                      <EmptyState
                        title="No order items"
                        description="No products were found for this order."
                      />
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {items.map((item, index) => (
                        <div
                          key={
                            item?._id ||
                            item?.product?._id ||
                            index
                          }
                          className="p-5 sm:p-6"
                        >
                          <OrderItem item={item} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Timeline */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Order Timeline
                  </h2>

                  <div className="mt-6">
                    <OrderTimeline
                      order={order}
                      status={status}
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {/* Summary */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                  <h2 className="mb-5 text-lg font-semibold text-foreground">
                    Order Summary
                  </h2>

                  <OrderSummary order={order} />
                </section>

                {/* Shipping */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Shipping Address
                  </h2>

                  <div className="mt-4 text-sm leading-6 text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {shippingAddress?.fullName ||
                        customer?.fullName ||
                        customer?.name ||
                        "—"}
                    </p>

                    <p>
                      {shippingAddress?.addressLine1 ||
                        shippingAddress?.address ||
                        "—"}
                    </p>

                    {shippingAddress?.addressLine2 && (
                      <p>
                        {shippingAddress.addressLine2}
                      </p>
                    )}

                    <p>
                      {[
                        shippingAddress?.city,
                        shippingAddress?.state,
                        shippingAddress?.postalCode ||
                          shippingAddress?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <p>
                      {shippingAddress?.country ||
                        "India"}
                    </p>

                    {shippingAddress?.phone && (
                      <p className="mt-2">
                        Phone: {shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </section>

                {/* Payment */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Payment Information
                  </h2>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        Method
                      </span>
                      <span className="font-medium capitalize text-foreground">
                        {payment?.method ||
                          order?.paymentMethod ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        Status
                      </span>
                      <span className="font-medium capitalize text-foreground">
                        {payment?.status ||
                          order?.paymentStatus ||
                          "—"}
                      </span>
                    </div>

                    {payment?.transactionId && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground">
                          Transaction
                        </span>

                        <span className="max-w-[180px] break-all text-right font-medium text-foreground">
                          {payment.transactionId}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Cancellation */}
                {!["cancelled", "delivered"].includes(
                  String(status).toLowerCase()
                ) && (
                  <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      Cancel Order
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Cancel this order if you cannot fulfill it.
                    </p>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() =>
                          onCancelOrder?.(order)
                        }
                      >
                        Cancel Order
                      </Button>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDetails;
