
import OrderItem from "../../components/order/OrderItem";
import OrderStatus from "../../components/order/OrderStatus";
import OrderSummary from "../../components/order/OrderSummary";
import OrderTimeline from "../../components/order/OrderTimeline";
import TrackOrder from "../../components/order/TrackOrder";
import CancelOrder from "../../components/order/CancelOrder";
import ReturnOrder from "../../components/order/ReturnOrder";

import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const OrderDetails = ({
  order = null,
  loading = false,
  actionLoading = false,
  onCancelOrder,
  onReturnOrder,
  onTrackOrder,
  onNavigate,
}) => {
  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Loader />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Order not found"
          description="The order you're looking for does not exist or is no longer available."
        />

        <div className="mt-6 flex justify-center">
          <Button onClick={() => onNavigate?.("/orders")}>
            Back to Orders
          </Button>
        </div>
      </main>
    );
  }

  const orderId = order?._id || order?.id || order?.orderId || "N/A";

  const orderDate = order?.createdAt || order?.orderDate || order?.date;

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const items = order?.items || order?.orderItems || [];

  const shippingAddress =
    order?.shippingAddress ||
    order?.address ||
    order?.deliveryAddress ||
    null;

  const paymentMethod =
    order?.paymentMethod ||
    order?.payment?.method ||
    "N/A";

  const paymentStatus =
    order?.paymentStatus ||
    order?.payment?.status ||
    "N/A";

  const status =
    order?.status ||
    order?.orderStatus ||
    "pending";

  const canCancel =
    !["cancelled", "delivered", "returned", "completed"].includes(
      String(status).toLowerCase()
    );

  const canReturn =
    ["delivered", "completed"].includes(String(status).toLowerCase());

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          {
            label: "Home",
            href: "/",
          },
          {
            label: "Orders",
            href: "/orders",
          },
          {
            label: `Order #${String(orderId).slice(-8)}`,
          },
        ]}
      />

      {/* Header */}
      <div className="mt-6 flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Order Details
            </h1>

            <OrderStatus status={status} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>
              Order ID:{" "}
              <span className="font-medium text-foreground">
                #{String(orderId).slice(-8)}
              </span>
            </span>

            <span>Placed on {formattedDate}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {onTrackOrder && (
            <Button
              variant="outline"
              onClick={() => onTrackOrder(order)}
              disabled={actionLoading}
            >
              Track Order
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => onNavigate?.("/orders")}
          >
            Back to Orders
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Order Items</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <OrderItem
                    key={item?._id || item?.id || item?.product?._id || index}
                    item={item}
                  />
                ))
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="No items found"
                    description="No products are associated with this order."
                  />
                </div>
              )}
            </div>
          </section>

          {/* Timeline */}
          {(order?.timeline ||
            order?.statusHistory ||
            order?.history) && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-semibold">Order Timeline</h2>

              <div className="mt-5">
                <OrderTimeline
                  timeline={
                    order?.timeline ||
                    order?.statusHistory ||
                    order?.history ||
                    []
                  }
                />
              </div>
            </section>
          )}

          {/* Tracking */}
          {order?.tracking ||
            order?.trackingInfo ||
            order?.shipment ? (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <h2 className="font-semibold">Shipment Tracking</h2>

                <div className="mt-5">
                  <TrackOrder
                    order={order}
                    tracking={
                      order?.tracking ||
                      order?.trackingInfo ||
                      order?.shipment
                    }
                    onTrack={onTrackOrder}
                  />
                </div>
              </section>
            ) : null}

          {/* Shipping Address */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Shipping Address</h2>

            {shippingAddress ? (
              <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm">
                <p className="font-medium">
                  {shippingAddress?.fullName ||
                    shippingAddress?.name ||
                    "Customer"}
                </p>

                {shippingAddress?.phone && (
                  <p className="mt-1 text-muted-foreground">
                    {shippingAddress.phone}
                  </p>
                )}

                <p className="mt-3 text-muted-foreground">
                  {[
                    shippingAddress?.addressLine1,
                    shippingAddress?.addressLine2,
                    shippingAddress?.street,
                    shippingAddress?.city,
                    shippingAddress?.state,
                    shippingAddress?.postalCode ||
                      shippingAddress?.pincode ||
                      shippingAddress?.zipCode,
                    shippingAddress?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Shipping address information is not available.
              </p>
            )}
          </section>

          {/* Payment Information */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Payment Information</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Payment Method
                </p>
                <p className="mt-1 font-medium capitalize">
                  {String(paymentMethod).replace(/_/g, " ")}
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Payment Status
                </p>
                <p className="mt-1 font-medium capitalize">
                  {String(paymentStatus).replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Summary */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 font-semibold">Order Summary</h2>

            <OrderSummary order={order} />
          </section>

          {/* Actions */}
          {(canCancel || canReturn) && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-semibold">Order Actions</h2>

              <div className="mt-4 space-y-3">
                {canCancel && onCancelOrder && (
                  <CancelOrder
                    order={order}
                    loading={actionLoading}
                    onCancel={onCancelOrder}
                  />
                )}

                {canReturn && onReturnOrder && (
                  <ReturnOrder
                    order={order}
                    loading={actionLoading}
                    onReturn={onReturnOrder}
                  />
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
};

export default OrderDetails;