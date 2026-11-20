import { Link } from "react-router-dom";
import OrderStatus from "./OrderStatus";

const TrackOrder = ({ order, tracking, trackingNumber, carrier, trackingUrl }) => {
  if (!order) {
    return null;
  }

  const orderId = order._id || order.id;
  const trackingInfo = tracking || order.tracking || order.trackingInfo || order.shipment || {};

  const trackingId =
    trackingNumber ||
    trackingInfo.trackingNumber ||
    order.trackingNumber ||
    order.trackingId;

  const shippingCarrier =
    carrier ||
    trackingInfo.carrier ||
    trackingInfo.courierPartner ||
    order.carrier ||
    order.shippingCarrier;

  const shipmentStatus =
    trackingInfo.status || order.orderStatus || order.status || "pending";

  const externalTrackingUrl =
    trackingUrl || trackingInfo.trackingUrl || order.trackingUrl;

  const estimatedDelivery =
    trackingInfo.estimatedDeliveryDate ||
    trackingInfo.expectedDeliveryDate ||
    order.estimatedDeliveryDate;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Track Your Order
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Order #{String(orderId).slice(-10)}
          </p>
        </div>

        <OrderStatus status={shipmentStatus} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tracking Number
          </p>

          <p className="mt-1 break-all text-sm font-semibold text-gray-900 dark:text-white">
            {trackingId || "Not available yet"}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Delivery Partner
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {shippingCarrier || "Not assigned yet"}
          </p>
        </div>
      </div>

      {estimatedDelivery && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Estimated Delivery
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
            {Number.isNaN(new Date(estimatedDelivery).getTime())
              ? String(estimatedDelivery)
              : new Date(estimatedDelivery).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
          </p>
        </div>
      )}

      {!trackingId && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-950/20">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Tracking details will be available once your order is shipped.
          </p>
        </div>
      )}

      {trackingId && externalTrackingUrl && (
        <div className="mt-5">
          <a
            href={externalTrackingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary"
          >
            Track Shipment
          </a>
        </div>
      )}

      {!trackingId && (
        <div className="mt-5">
          <Link
            to={`/orders/${orderId}`}
            className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View Order Details
          </Link>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;

