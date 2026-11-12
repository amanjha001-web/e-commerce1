
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loader />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
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
              <div className="panel p-8 text-center">
                <EmptyState
                  title="Order not found"
                  description="The order you're looking for could not be found."
                />

                <div className="mt-6">
                  <Button
                    onClick={() => handleNavigate("orders")}
                    className="primarybtn"
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
    <div className="min-h-screen bg-[var(--bg)]">
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
            <section className="panel">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="eyebrow">Order Summary</div>

                  <h1 className="mt-1 text-2xl font-black text-[var(--text)] dark:text-foreground">
                    #{orderId}
                  </h1>

                  <p className="mt-1 text-xs font-medium text-[var(--muted)]">
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
                    className="outlinebtn"
                  >
                    Track Order
                  </Button>
                </div>
              </div>
            </section>

            {/* Status Management */}
            <section className="panel">
              <div>
                <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                  Update Order Status
                </h2>

                <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
                  Update the order as it moves through fulfillment.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
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
                      "rounded-xl border px-3.5 py-1.5 text-xs font-bold capitalize transition cursor-pointer",
                      status === item
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                        : "border-[var(--line)] bg-white text-[var(--text)] hover:bg-[var(--soft)]",
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
                <section className="panel">
                  <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                    Customer Information
                  </h2>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold text-[var(--muted)]">
                        Name
                      </p>
                      <p className="mt-1 font-bold text-[var(--text)] dark:text-foreground">
                        {customer?.fullName ||
                          customer?.name ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[var(--muted)]">
                        Email
                      </p>
                      <p className="mt-1 break-all font-bold text-[var(--text)] dark:text-foreground">
                        {customer?.email || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[var(--muted)]">
                        Phone
                      </p>
                      <p className="mt-1 font-bold text-[var(--text)] dark:text-foreground">
                        {customer?.phone || "—"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Items */}
                <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
                  <div className="border-b border-[var(--line)] p-5 bg-[#fcf9fa] dark:bg-card">
                    <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                      Order Items
                    </h2>

                    <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
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
                    <div className="divide-y divide-[var(--line)]">
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
                <section className="panel">
                  <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                    Order Timeline
                  </h2>

                  <div className="mt-5">
                    <OrderTimeline
                      order={order}
                      status={status}
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {/* Summary */}
                <section className="panel">
                  <h2 className="mb-4 text-base font-black text-[var(--text)] dark:text-foreground">
                    Order Summary
                  </h2>

                  <OrderSummary order={order} />
                </section>

                {/* Shipping */}
                <section className="panel">
                  <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                    Shipping Address
                  </h2>

                  <div className="mt-4 text-xs font-medium leading-5 text-[var(--text)] dark:text-foreground">
                    <p className="font-bold text-[var(--primary)]">
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
                      <p className="mt-2 text-[var(--muted)]">
                        Phone: {shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </section>

                {/* Payment */}
                <section className="panel">
                  <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                    Payment Information
                  </h2>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-[var(--muted)]">
                        Method
                      </span>
                      <span className="font-bold capitalize text-[var(--text)] dark:text-foreground">
                        {payment?.method ||
                          order?.paymentMethod ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-[var(--muted)]">
                        Status
                      </span>
                      <span className="font-bold capitalize text-[var(--primary)]">
                        {payment?.status ||
                          order?.paymentStatus ||
                          "—"}
                      </span>
                    </div>

                    {payment?.transactionId && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-bold text-[var(--muted)]">
                          Transaction
                        </span>

                        <span className="max-w-[180px] break-all text-right font-bold text-[var(--text)] dark:text-foreground">
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
                  <section className="panel border-[#f3cbd0] bg-[#fff0f1]/50">
                    <h2 className="text-base font-black text-[var(--red)]">
                      Cancel Order
                    </h2>

                    <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                      Cancel this order if you cannot fulfill it.
                    </p>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() =>
                          onCancelOrder?.(order)
                        }
                        className="dangerbtn"
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
