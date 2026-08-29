import { Link } from "react-router-dom";
import OrderStatus from "./OrderStatus";

const TrackOrder = ({ order, trackingNumber, carrier, trackingUrl }) => {
  if (!order) {
    return null;
  }

  const orderId = order._id || order.id;

  const trackingId =
    trackingNumber ||
    order.trackingNumber ||
    order.trackingId ||
    order.shipment?.trackingNumber;

  const shippingCarrier =
    carrier ||
    order.carrier ||
    order.shippingCarrier ||
    order.shipment?.carrier;

  const shipmentStatus = order.shipment?.status || order.status || "pending";

  const externalTrackingUrl =
    trackingUrl || order.trackingUrl || order.shipment?.trackingUrl;

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
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
