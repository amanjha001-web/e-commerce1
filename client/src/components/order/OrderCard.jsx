import { Link } from "react-router-dom";
import OrderStatus from "./OrderStatus";

const OrderCard = ({ order, onCancel, onReturn }) => {
  if (!order) {
    return null;
  }

  const orderId = order._id || order.id;

  const items = order.items || order.orderItems || [];

  const total = order.totalAmount ?? order.total ?? 0;

  const createdAt = order.createdAt || order.orderDate;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>

          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            #{String(orderId).slice(-10)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {createdAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}

          <OrderStatus status={order.status} />
        </div>
      </div>

      <div className="py-4">
        {items.slice(0, 3).map((item, index) => {
          const product = item.product || item;

          const productName = product.name || item.productName || "Product";

          const image = product.image || product.thumbnail || item.image;

          const quantity = item.quantity || 1;

          return (
            <div
              key={item._id || item.id || index}
              className="flex items-center gap-3 py-2"
            >
              {image ? (
                <img
                  src={image}
                  alt={productName}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-xl dark:bg-gray-800">
                  📦
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {productName}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Qty: {quantity}
                </p>
              </div>
            </div>
          );
        })}

        {items.length > 3 && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            + {items.length - 3} more items
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total Amount
          </span>

          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ₹{Number(total).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/orders/${orderId}`}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View Details
          </Link>

          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              className="rounded-lg border border-red-500 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Cancel
            </button>
          )}

          {onReturn && (
            <button
              type="button"
              onClick={() => onReturn(order)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
