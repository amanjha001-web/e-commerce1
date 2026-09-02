import { useState } from "react";

const OrderDetails = ({
  order = null,
  open = false,
  loading = false,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!open || !order) return null;

  const getOrderId = () =>
    order?.orderNumber || order?.orderId || order?._id || order?.id || "N/A";

  const getCustomerName = () =>
    order?.user?.fullName ||
    order?.user?.name ||
    order?.customer?.fullName ||
    order?.customer?.name ||
    order?.customerName ||
    "Guest Customer";

  const getCustomerEmail = () =>
    order?.user?.email ||
    order?.customer?.email ||
    order?.customerEmail ||
    "N/A";

  const getCustomerPhone = () =>
    order?.user?.phone ||
    order?.user?.phoneNumber ||
    order?.customer?.phone ||
    order?.customerPhone ||
    "N/A";

  const getStatus = () =>
    String(order?.status || order?.orderStatus || "pending").toLowerCase();

  const getPaymentStatus = () =>
    String(
      order?.paymentStatus || order?.payment?.status || "pending",
    ).toLowerCase();

  const getPaymentMethod = () =>
    order?.payment?.method || order?.paymentMethod || "N/A";

  const getItems = () => {
    if (Array.isArray(order?.items)) {
      return order.items;
    }

    if (Array.isArray(order?.products)) {
      return order.products;
    }

    return [];
  };

  const getItemName = (item) =>
    item?.product?.name ||
    item?.product?.title ||
    item?.productName ||
    item?.name ||
    item?.title ||
    "Product";

  const getItemImage = (item) =>
    item?.product?.thumbnail ||
    item?.product?.image ||
    item?.product?.images?.[0]?.url ||
    item?.product?.images?.[0] ||
    item?.image ||
    item?.thumbnail ||
    null;

  const getItemPrice = (item) =>
    item?.price ??
    item?.sellingPrice ??
    item?.unitPrice ??
    item?.product?.sellingPrice ??
    item?.product?.price ??
    0;

  const getItemQuantity = (item) =>
    item?.quantity ?? item?.qty ?? item?.count ?? 1;

  const getSubtotal = () =>
    order?.subtotal ?? order?.subTotal ?? order?.pricing?.subtotal ?? 0;

  const getDiscount = () =>
    order?.discount ?? order?.discountAmount ?? order?.pricing?.discount ?? 0;

  const getShipping = () =>
    order?.shippingCharge ??
    order?.shippingCharges ??
    order?.shipping ??
    order?.pricing?.shipping ??
    0;

  const getTax = () =>
    order?.tax ?? order?.taxAmount ?? order?.pricing?.tax ?? 0;

  const getTotal = () =>
    order?.totalAmount ??
    order?.grandTotal ??
    order?.total ??
    order?.pricing?.total ??
    0;

  const getAddress = () =>
    order?.shippingAddress ||
    order?.deliveryAddress ||
    order?.address ||
    order?.user?.address ||
    null;

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDateTime = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) =>
    String(status)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

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

  const getInitials = () =>
    getCustomerName()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  const address = getAddress();
  const items = getItems();
  const status = getStatus();
  const paymentStatus = getPaymentStatus();

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Order #{getOrderId()}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                  status,
                )}`}
              >
                {formatStatus(status)}
              </span>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Placed on {formatDateTime(order?.createdAt || order?.orderDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-5 sm:px-6">
          <div className="flex gap-6 overflow-x-auto">
            {[
              ["overview", "Overview"],
              ["items", "Items"],
              ["payment", "Payment"],
              ["timeline", "Timeline"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition ${
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="space-y-5">
              <div className="h-32 animate-pulse rounded-2xl bg-muted" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Customer + Address */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-foreground">
                        Customer Information
                      </h3>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {getCustomerName()}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {getCustomerEmail()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground">Phone</p>

                        <p className="mt-1 text-sm text-foreground">
                          {getCustomerPhone()}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-foreground">
                        Delivery Address
                      </h3>

                      {address ? (
                        <div className="mt-4 text-sm leading-6 text-muted-foreground">
                          <p className="font-medium text-foreground">
                            {address?.fullName ||
                              address?.name ||
                              getCustomerName()}
                          </p>

                          {address?.phone && <p>{address.phone}</p>}

                          <p>
                            {address?.addressLine1 ||
                              address?.street ||
                              address?.address ||
                              ""}
                          </p>

                          {address?.addressLine2 && (
                            <p>{address.addressLine2}</p>
                          )}

                          <p>
                            {[
                              address?.city,
                              address?.state,
                              address?.postalCode ||
                                address?.pincode ||
                                address?.zipCode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>

                          {address?.country && <p>{address.country}</p>}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                          No delivery address available.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      Order Summary
                    </h3>

                    <div className="rounded-2xl border border-border">
                      <div className="flex items-center justify-between border-b border-border px-5 py-3">
                        <span className="text-sm text-muted-foreground">
                          Subtotal
                        </span>

                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(getSubtotal())}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border px-5 py-3">
                        <span className="text-sm text-muted-foreground">
                          Discount
                        </span>

                        <span className="text-sm font-medium text-green-600">
                          - {formatCurrency(getDiscount())}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border px-5 py-3">
                        <span className="text-sm text-muted-foreground">
                          Shipping
                        </span>

                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(getShipping())}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border px-5 py-3">
                        <span className="text-sm text-muted-foreground">
                          Tax
                        </span>

                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(getTax())}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-5 py-4">
                        <span className="text-sm font-semibold text-foreground">
                          Total
                        </span>

                        <span className="text-lg font-bold text-foreground">
                          {formatCurrency(getTotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              {activeTab === "items" && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      Order Items
                    </h3>

                    <span className="text-xs text-muted-foreground">
                      {items.length} item
                      {items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {items.length ? (
                    <div className="overflow-hidden rounded-2xl border border-border">
                      {items.map((item, index) => {
                        const image = getItemImage(item);
                        const quantity = Number(getItemQuantity(item) || 1);
                        const price = Number(getItemPrice(item) || 0);

                        return (
                          <div
                            key={
                              item?._id ||
                              item?.id ||
                              `${index}-${getItemName(item)}`
                            }
                            className="flex items-center gap-4 border-b border-border p-4 last:border-0"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={getItemName(item)}
                                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                                📦
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {getItemName(item)}
                              </p>

                              {item?.sku && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  SKU: {item.sku}
                                </p>
                              )}

                              <p className="mt-1 text-xs text-muted-foreground">
                                Qty: {quantity}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground">
                                {formatCurrency(price * quantity)}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatCurrency(price)} each
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                      <div className="text-3xl">📦</div>

                      <p className="mt-3 text-sm font-medium text-foreground">
                        No items found
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment */}
              {activeTab === "payment" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Payment Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentClasses(
                          paymentStatus,
                        )}`}
                      >
                        {formatStatus(paymentStatus)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Payment Method
                      </p>

                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {String(getPaymentMethod()).toUpperCase()}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Amount</p>

                      <p className="mt-2 text-lg font-bold text-foreground">
                        {formatCurrency(getTotal())}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Transaction ID
                      </p>

                      <p className="mt-2 truncate text-sm font-medium text-foreground">
                        {order?.payment?.transactionId ||
                          order?.payment?.paymentId ||
                          order?.transactionId ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      Payment Details
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Payment ID
                        </p>

                        <p className="mt-1 break-all text-sm text-foreground">
                          {order?.payment?.paymentId ||
                            order?.paymentId ||
                            "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Order Payment ID
                        </p>

                        <p className="mt-1 break-all text-sm text-foreground">
                          {order?.payment?.orderId ||
                            order?.razorpayOrderId ||
                            "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Paid At</p>

                        <p className="mt-1 text-sm text-foreground">
                          {formatDateTime(order?.payment?.paidAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Currency
                        </p>

                        <p className="mt-1 text-sm text-foreground">
                          {order?.currency || "INR"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {activeTab === "timeline" && (
                <div>
                  <h3 className="mb-5 text-sm font-semibold text-foreground">
                    Order Timeline
                  </h3>

                  <div className="relative ml-3 border-l border-border pl-6">
                    <div className="relative pb-7">
                      <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />

                      <p className="text-sm font-medium text-foreground">
                        Order Placed
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(
                          order?.createdAt ||
                            order?.orderDate ||
                            order?.placedAt,
                        )}
                      </p>
                    </div>

                    {order?.confirmedAt && (
                      <div className="relative pb-7">
                        <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />

                        <p className="text-sm font-medium text-foreground">
                          Order Confirmed
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(order.confirmedAt)}
                        </p>
                      </div>
                    )}

                    {order?.shippedAt && (
                      <div className="relative pb-7">
                        <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />

                        <p className="text-sm font-medium text-foreground">
                          Order Shipped
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(order.shippedAt)}
                        </p>
                      </div>
                    )}

                    {order?.deliveredAt && (
                      <div className="relative pb-7">
                        <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-4 ring-background" />

                        <p className="text-sm font-medium text-foreground">
                          Order Delivered
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(order.deliveredAt)}
                        </p>
                      </div>
                    )}

                    {order?.cancelledAt && (
                      <div className="relative">
                        <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-4 ring-background" />

                        <p className="text-sm font-medium text-foreground">
                          Order Cancelled
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(order.cancelledAt)}
                        </p>

                        {order?.cancellationReason && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Reason: {order.cancellationReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Close
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => onEdit?.(order)}
              className="rounded-xl border border-primary px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              Edit Order
            </button>

            <button
              type="button"
              onClick={() => onStatusChange?.(order)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Change Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
