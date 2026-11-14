import { Link } from "react-router-dom";
import OrderStatus from "./OrderStatus";

const OrderCard = ({ order, onCancel, onReturn }) => {
  if (!order) {
    return null;
  }

  const orderId = order._id || order.id;
  const orderNumber = order.orderNumber || (orderId ? String(orderId).slice(-10) : "");
  const items = order.items || order.orderItems || [];
  const total = order.totalAmount ?? order.total ?? 0;
  const createdAt = order.createdAt || order.orderDate;
  const status = order.orderStatus || order.status || "pending";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 transition-all duration-200 hover:shadow-xs dark:border-gray-800 dark:bg-card">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <p className="text-xs text-[var(--muted)]">Order ID</p>

          <p className="mt-0.5 text-sm font-extrabold text-[var(--text)] dark:text-white">
            #{orderNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {createdAt && (
            <span className="text-xs font-medium text-[var(--muted)]">
              {new Date(createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}

          <OrderStatus status={status} />
        </div>
      </div>

      <div className="py-4">
        {items.slice(0, 3).map((item, index) => {
          const product = item.product || item;
          const productName =
            item.name || product?.name || item.productName || "Product";
          const image =
            item.image ||
            product?.images?.[0]?.url ||
            product?.image ||
            product?.thumbnail ||
            "";
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
                  className="h-14 w-14 rounded-xl object-cover border border-[var(--line)]/50"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--soft)] text-xl border border-[var(--line)]/50">
                  📦
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--text)] dark:text-white">
                  {productName}
                </p>

                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Qty: {quantity} · ₹{Number(item.price || product?.price || 0).toLocaleString("en-IN")}
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

      <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <span className="text-xs text-[var(--muted)]">
            Total Amount
          </span>

          <p className="text-base font-black text-[var(--primary)] dark:text-white">
            ₹{Number(total).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/orders/${orderId}`}
            className="btnsm !text-xs !py-1.5 !px-3"
          >
            View Details →
          </Link>

          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              className="rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 cursor-pointer dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              Cancel
            </button>
          )}

          {onReturn && (
            <button
              type="button"
              onClick={() => onReturn(order)}
              className="primarybtn !py-1.5 !px-3 !text-xs !rounded-xl"
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

