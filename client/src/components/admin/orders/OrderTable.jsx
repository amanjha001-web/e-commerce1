

const OrderTable = ({
  orders = [],
  loading = false,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
}) => {
  const getOrderId = (order) =>
    order?.orderNumber || order?.orderId || order?._id || order?.id || "N/A";

  const getCustomerName = (order) =>
    order?.user?.fullName ||
    order?.user?.name ||
    order?.customer?.fullName ||
    order?.customer?.name ||
    order?.customerName ||
    "Guest Customer";

  const getCustomerEmail = (order) =>
    order?.user?.email ||
    order?.customer?.email ||
    order?.customerEmail ||
    "N/A";

  const getTotal = (order) =>
    order?.totalAmount ??
    order?.total ??
    order?.grandTotal ??
    order?.amount ??
    0;

  const getItemsCount = (order) => {
    if (Array.isArray(order?.items)) {
      return order.items.reduce(
        (total, item) => total + Number(item?.quantity || item?.qty || 1),
        0,
      );
    }

    return order?.itemsCount ?? order?.itemCount ?? order?.totalItems ?? 0;
  };

  const getStatus = (order) =>
    String(order?.status || order?.orderStatus || "pending").toLowerCase();

  const getPaymentStatus = (order) =>
    String(
      order?.paymentStatus || order?.payment?.status || "pending",
    ).toLowerCase();

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status) =>
    status.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const getStatusClasses = (status) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-700";

      case "confirmed":
      case "processing":
      case "shipped":
        return "bg-blue-100 text-blue-700";

      case "pending":
      case "placed":
        return "bg-yellow-100 text-yellow-700";

      case "cancelled":
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentClasses = (status) => {
    switch (status) {
      case "paid":
      case "success":
      case "completed":
        return "bg-green-100 text-green-700";

      case "pending":
      case "created":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Order",
                  "Customer",
                  "Items",
                  "Total",
                  "Payment",
                  "Status",
                  "Date",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4">
                      <div
                        className={`h-3 animate-pulse rounded bg-muted ${
                          cellIndex === 1
                            ? "w-32"
                            : cellIndex === 3
                              ? "w-20"
                              : "w-16"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-border bg-background px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          🛍️
        </div>

        <h3 className="mt-4 text-base font-semibold text-foreground">
          No orders found
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          There are no orders available to display.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Order
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Items
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const status = getStatus(order);
              const paymentStatus = getPaymentStatus(order);

              return (
                <tr
                  key={order?._id || order?.id || getOrderId(order)}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                >
                  {/* Order */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onViewOrder?.(order)}
                      className="text-sm font-semibold text-foreground transition hover:text-primary"
                    >
                      #{getOrderId(order)}
                    </button>

                    {order?.payment?.method && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(order.payment.method).toUpperCase()}
                      </p>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-4">
                    <div>
                      <p className="max-w-[190px] truncate text-sm font-medium text-foreground">
                        {getCustomerName(order)}
                      </p>

                      <p className="mt-1 max-w-[190px] truncate text-xs text-muted-foreground">
                        {getCustomerEmail(order)}
                      </p>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {getItemsCount(order)}
                  </td>

                  {/* Total */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(getTotal(order))}
                    </span>
                  </td>

                  {/* Payment */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentClasses(
                        paymentStatus,
                      )}`}
                    >
                      {formatStatus(paymentStatus)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        status,
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {formatDate(
                      order?.createdAt || order?.orderDate || order?.placedAt,
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewOrder?.(order)}
                        title="View order"
                        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                          />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditOrder?.(order)}
                        title="Edit order"
                        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 20h9"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => onStatusChange?.(order)}
                        title="Change status"
                        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v12"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12h12"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteOrder?.(order)}
                        title="Delete order"
                        className="rounded-lg border border-border p-2 text-red-500 transition hover:border-red-500 hover:bg-red-50"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 6h18"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 6V4h8v2m-9 0l1 14h8l1-14M10 11v5m4-5v5"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {orders.map((order) => {
          const status = getStatus(order);
          const paymentStatus = getPaymentStatus(order);

          return (
            <div
              key={order?._id || order?.id || getOrderId(order)}
              className="rounded-xl border border-border p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => onViewOrder?.(order)}
                    className="text-sm font-semibold text-foreground hover:text-primary"
                  >
                    #{getOrderId(order)}
                  </button>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(
                      order?.createdAt || order?.orderDate || order?.placedAt,
                    )}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                    status,
                  )}`}
                >
                  {formatStatus(status)}
                </span>
              </div>

              {/* Customer */}
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Customer</p>

                <p className="mt-1 truncate text-sm font-medium text-foreground">
                  {getCustomerName(order)}
                </p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {getCustomerEmail(order)}
                </p>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Items</p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {getItemsCount(order)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Total</p>

                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatCurrency(getTotal(order))}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getPaymentClasses(
                      paymentStatus,
                    )}`}
                  >
                    {formatStatus(paymentStatus)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Method</p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {order?.payment?.method
                      ? String(order.payment.method).toUpperCase()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => onViewOrder?.(order)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => onEditOrder?.(order)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onStatusChange?.(order)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-primary transition hover:bg-primary/5"
                >
                  Status
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteOrder?.(order)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-red-500 transition hover:border-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTable;
