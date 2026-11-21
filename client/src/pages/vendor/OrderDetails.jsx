import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import orderService from "../../services/order.service";

import OrderStatus from "../../components/order/OrderStatus";
import OrderSummary from "../../components/order/OrderSummary";
import OrderTimeline from "../../components/order/OrderTimeline";
import OrderItem from "../../components/order/OrderItem";

import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const STATUS_BUTTONS = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const OrderDetails = ({
  order: propOrder = null,
  loading: propLoading = false,
  actionLoading: propActionLoading = false,
  onUpdateStatus,
  onTrackOrder,
  onCancelOrder,
  onNavigate,
}) => {
  const { orderId: paramOrderId } = useParams();
  const navigate = useNavigate();
  const trackingSectionRef = useRef(null);

  const [order, setOrder] = useState(propOrder);
  const [fetching, setFetching] = useState(!propOrder && Boolean(paramOrderId));
  const [fetchError, setFetchError] = useState("");
  const [actionLoading, setActionLoading] = useState(propActionLoading);
  const [statusNote, setStatusNote] = useState("");
  const [trackingForm, setTrackingForm] = useState(() => ({
    carrier: propOrder?.tracking?.carrier || "",
    trackingNumber: propOrder?.tracking?.trackingNumber || "",
    trackingUrl: propOrder?.tracking?.trackingUrl || "",
    estimatedDeliveryDate: propOrder?.tracking?.estimatedDeliveryDate
      ? String(propOrder.tracking.estimatedDeliveryDate).slice(0, 10)
      : "",
  }));

  useEffect(() => {
    if (propOrder || !paramOrderId) return undefined;

    let cancelled = false;
    const timer = setTimeout(() => {
      setFetching(true);
      setFetchError("");
      orderService
        .getVendorOrderById(paramOrderId)
        .then((res) => {
          if (cancelled) return;
          const doc = res?.data?.order || res?.data || res;
          setOrder(doc || null);
          if (doc?.tracking) {
            setTrackingForm({
              carrier: doc.tracking.carrier || "",
              trackingNumber: doc.tracking.trackingNumber || "",
              trackingUrl: doc.tracking.trackingUrl || "",
              estimatedDeliveryDate: doc.tracking.estimatedDeliveryDate
                ? String(doc.tracking.estimatedDeliveryDate).slice(0, 10)
                : "",
            });
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setFetchError(
            err?.response?.data?.message || err?.message || "Order not found",
          );
          setOrder(null);
        })
        .finally(() => {
          if (!cancelled) setFetching(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paramOrderId, propOrder]);

  const resolvedOrder = propOrder || order;
  const isLoading = propLoading || fetching;

  const handleNavigate = (target) => {
    if (onNavigate) {
      onNavigate(target);
      return;
    }
    const map = {
      dashboard: "/vendor",
      orders: "/vendor/orders",
    };
    navigate(map[target] || `/vendor/${target}`);
  };

  const applyOrderUpdateState = (updatedOrder, fallbackStatus) => {
    setOrder((prev) =>
      updatedOrder &&
      typeof updatedOrder === "object" &&
      (updatedOrder._id || updatedOrder.orderStatus)
        ? {
            ...(prev || {}),
            ...updatedOrder,
            items: prev?.items || updatedOrder.items,
            customer: prev?.customer || updatedOrder.customer,
            payment: prev?.payment || updatedOrder.payment,
            vendorOrderTotal:
              updatedOrder.vendorOrderTotal ?? prev?.vendorOrderTotal,
            status: updatedOrder.orderStatus || fallbackStatus || prev?.status,
          }
        : prev
          ? {
              ...prev,
              status: fallbackStatus || prev.status,
              orderStatus: fallbackStatus || prev.orderStatus,
            }
          : prev,
    );
  };

  const handleStatusChange = async (nextStatus) => {
    if (!resolvedOrder || actionLoading || propActionLoading) return;

    if (onUpdateStatus) {
      onUpdateStatus(resolvedOrder, nextStatus);
      return;
    }

    try {
      setActionLoading(true);
      const targetId = resolvedOrder._id || paramOrderId;
      const res = await orderService.updateOrderStatus(
        targetId,
        nextStatus,
        statusNote.trim(),
      );
      const updatedOrder = res?.data?.order || res?.data || res;
      toast.success(`Order status updated to ${nextStatus.replace(/_/g, " ")}`);
      setStatusNote("");
      applyOrderUpdateState(updatedOrder, nextStatus);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTracking = async (event) => {
    event.preventDefault();
    if (!resolvedOrder?._id || actionLoading) return;
    if (!trackingForm.carrier.trim() && !trackingForm.trackingNumber.trim()) {
      toast.error("Please enter courier name or tracking number");
      return;
    }
    try {
      setActionLoading(true);
      const res = await orderService.updateOrderTracking(resolvedOrder._id, {
        carrier: trackingForm.carrier.trim(),
        trackingNumber: trackingForm.trackingNumber.trim(),
        trackingUrl: trackingForm.trackingUrl.trim(),
        ...(trackingForm.estimatedDeliveryDate
          ? { estimatedDeliveryDate: trackingForm.estimatedDeliveryDate }
          : {}),
      });
      const updated = res?.data || res;
      applyOrderUpdateState(updated);
      toast.success("Shipment tracking updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update tracking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrackOrder = () => {
    if (onTrackOrder) {
      onTrackOrder(resolvedOrder);
      return;
    }
    trackingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (resolvedOrder?.tracking?.trackingUrl) {
      window.open(resolvedOrder.tracking.trackingUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCancelOrder = async () => {
    if (!resolvedOrder || actionLoading) return;
    if (onCancelOrder) {
      onCancelOrder(resolvedOrder);
      return;
    }
    const reason = window.prompt("Optional cancellation reason for customer:");
    if (reason === null) return;
    await handleStatusChange("cancelled");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!resolvedOrder) {
    return (
      <div className="panel p-8 text-center">
        <EmptyState
          title="Order not found"
          description={fetchError || "The order you're looking for could not be found."}
        />
        <div className="mt-6">
          <Button onClick={() => handleNavigate("orders")} className="primarybtn">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const orderLabel =
    resolvedOrder.orderNumber ||
    resolvedOrder.orderId ||
    resolvedOrder._id ||
    "—";
  const customer =
    resolvedOrder.customer ||
    (resolvedOrder.userId && typeof resolvedOrder.userId === "object"
      ? resolvedOrder.userId
      : null) ||
    resolvedOrder.user ||
    {};
  const items = resolvedOrder.items || resolvedOrder.orderItems || [];
  const shippingAddress =
    resolvedOrder.shippingAddress || resolvedOrder.address || {};
  const payment = resolvedOrder.payment || {};
  const status = resolvedOrder.orderStatus || resolvedOrder.status || "pending";
  const isBusy = actionLoading || propActionLoading;

  const vendorSubtotal = items.reduce((sum, item) => {
    const line =
      item.total !== undefined && item.total !== null
        ? Number(item.total)
        : Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1);
    return sum + (Number.isFinite(line) ? line : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Vendor", onClick: () => handleNavigate("dashboard") },
          { label: "Orders", onClick: () => handleNavigate("orders") },
          { label: `Order ${orderLabel}` },
        ]}
      />

      <section className="panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="eyebrow">Order Summary</div>
            <h1 className="mt-1 text-2xl font-black text-[var(--text)]">
              {String(orderLabel).startsWith("#") ? orderLabel : `#${orderLabel}`}
            </h1>
            <p className="mt-1 text-xs font-medium text-[var(--muted)]">
              Placed on{" "}
              {resolvedOrder.createdAt
                ? new Date(resolvedOrder.createdAt).toLocaleString("en-IN")
                : "—"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <OrderStatus status={status} />
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={handleTrackOrder}
              className="outlinebtn"
            >
              Track Order
            </Button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div>
          <h2 className="text-base font-black text-[var(--text)]">
            Update Order Status
          </h2>
          <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
            Update fulfillment stage or add a timeline note for the customer.
          </p>
        </div>

        <div className="mt-3 max-w-md">
          <input
            className="field full"
            placeholder="Optional timeline note (e.g. Dispatched via Delhivery)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_BUTTONS.map((item) => {
            const normalizedCurrent = String(status)
              .trim()
              .toLowerCase()
              .replace(/[\s-]+/g, "_");
            return (
              <button
                key={item}
                type="button"
                disabled={isBusy}
                onClick={() => handleStatusChange(item)}
                className={[
                  "cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-bold capitalize transition disabled:opacity-50",
                  normalizedCurrent === item
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                    : "border-[var(--line)] bg-white text-[var(--text)] hover:bg-[var(--soft)]",
                ].join(" ")}
              >
                {item.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="panel">
            <h2 className="text-base font-black text-[var(--text)]">
              Customer Information
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold text-[var(--muted)]">Name</p>
                <p className="mt-1 font-bold text-[var(--text)]">
                  {customer?.fullName || customer?.name || shippingAddress?.fullName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--muted)]">Email</p>
                <p className="mt-1 break-all font-bold text-[var(--text)]">
                  {customer?.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--muted)]">Phone</p>
                <p className="mt-1 font-bold text-[var(--text)]">
                  {customer?.phone || shippingAddress?.phone || "—"}
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs">
            <div className="border-b border-[var(--line)] bg-[#fcf9fa] p-5">
              <h2 className="text-base font-black text-[var(--text)]">
                Your Order Items
              </h2>
              <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
                {items.length} item{items.length === 1 ? "" : "s"} from your shop.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No order items"
                  description="No products were found for this vendor in this order."
                />
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {items.map((item, index) => (
                  <div
                    key={item?._id || item?.product?._id || index}
                    className="p-5 sm:p-6"
                  >
                    <OrderItem item={item} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section ref={trackingSectionRef} className="panel">
            <h2 className="text-base font-black text-[var(--text)]">
              Shipment Tracking
            </h2>
            <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
              Add courier partner and tracking details so the customer can follow delivery progress.
            </p>

            <form onSubmit={handleSaveTracking} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="formgroup">
                <label htmlFor="detailCarrier">Courier / Carrier</label>
                <input
                  id="detailCarrier"
                  className="field full"
                  placeholder="e.g. Delhivery, BlueDart"
                  value={trackingForm.carrier}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({ ...prev, carrier: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label htmlFor="detailTrackingNumber">Tracking Number / AWB</label>
                <input
                  id="detailTrackingNumber"
                  className="field full"
                  placeholder="Enter tracking number"
                  value={trackingForm.trackingNumber}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({ ...prev, trackingNumber: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label htmlFor="detailTrackingUrl">Tracking Link (Optional)</label>
                <input
                  id="detailTrackingUrl"
                  className="field full"
                  type="url"
                  placeholder="https://..."
                  value={trackingForm.trackingUrl}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({ ...prev, trackingUrl: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label htmlFor="detailEta">Estimated Delivery Date</label>
                <input
                  id="detailEta"
                  className="field full"
                  type="date"
                  value={trackingForm.estimatedDeliveryDate}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({
                      ...prev,
                      estimatedDeliveryDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={isBusy} className="primarybtn">
                  {isBusy ? "Saving..." : "Save Tracking Info"}
                </Button>
              </div>
            </form>
          </section>

          <section className="panel">
            <h2 className="text-base font-black text-[var(--text)]">
              Order Timeline
            </h2>
            <div className="mt-5">
              <OrderTimeline
                order={resolvedOrder}
                status={status}
                events={
                  resolvedOrder.timeline ||
                  resolvedOrder.statusHistory ||
                  resolvedOrder.history ||
                  []
                }
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel">
            <h2 className="mb-4 text-base font-black text-[var(--text)]">
              Vendor Share Summary
            </h2>
            <OrderSummary
              order={resolvedOrder}
              subtotal={vendorSubtotal}
              total={resolvedOrder.vendorOrderTotal ?? vendorSubtotal}
              discount={0}
              shippingCharge={0}
              tax={0}
            />
          </section>

          <section className="panel">
            <h2 className="text-base font-black text-[var(--text)]">
              Shipping Address
            </h2>
            <div className="mt-4 text-xs font-medium leading-5 text-[var(--text)]">
              <p className="font-bold text-[var(--primary)]">
                {shippingAddress?.fullName ||
                  customer?.fullName ||
                  customer?.name ||
                  "—"}
              </p>
              <p>
                {shippingAddress?.street ||
                  shippingAddress?.addressLine1 ||
                  shippingAddress?.address ||
                  "—"}
              </p>
              {(shippingAddress?.apartment || shippingAddress?.addressLine2) && (
                <p>{shippingAddress.apartment || shippingAddress.addressLine2}</p>
              )}
              <p>
                {[
                  shippingAddress?.city,
                  shippingAddress?.state,
                  shippingAddress?.postalCode || shippingAddress?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>{shippingAddress?.country || "India"}</p>
              {shippingAddress?.phone && (
                <p className="mt-2 text-[var(--muted)]">
                  Phone: {shippingAddress.phone}
                </p>
              )}
            </div>
          </section>

          <section className="panel">
            <h2 className="text-base font-black text-[var(--text)]">
              Payment Information
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-[var(--muted)]">Method</span>
                <span className="font-bold uppercase text-[var(--text)]">
                  {payment?.method || resolvedOrder.paymentMethod || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-[var(--muted)]">Status</span>
                <span className="font-bold capitalize text-[var(--primary)]">
                  {payment?.status || resolvedOrder.paymentStatus || "—"}
                </span>
              </div>
              {payment?.transactionId && (
                <div className="flex items-start justify-between gap-4">
                  <span className="font-bold text-[var(--muted)]">Transaction</span>
                  <span className="max-w-[180px] break-all text-right font-bold text-[var(--text)]">
                    {payment.transactionId}
                  </span>
                </div>
              )}
            </div>
          </section>

          {!["cancelled", "canceled", "delivered", "refunded", "returned"].includes(
            String(status).toLowerCase(),
          ) && (
            <section className="panel border-[#f3cbd0] bg-[#fff0f1]/50">
              <h2 className="text-base font-black text-[var(--red)]">
                Cancel Order
              </h2>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                Cancel this order if items cannot be fulfilled.
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  disabled={isBusy}
                  onClick={handleCancelOrder}
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
  );
};

export default OrderDetails;
