import { useState } from "react";

const OrderStatus = ({
  order = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState("");

  if (!open || !order) return null;

  const orderId =
    order?.orderNumber || order?.orderId || order?._id || order?.id || "N/A";

  const currentStatus = String(
    order?.status || order?.orderStatus || "pending",
  ).toLowerCase();

  const customerName =
    order?.user?.fullName ||
    order?.user?.name ||
    order?.customer?.fullName ||
    order?.customer?.name ||
    order?.customerName ||
    "Guest Customer";

  const statuses = [
    {
      value: "pending",
      label: "Pending",
      description: "Order is waiting for confirmation.",
    },
    {
      value: "confirmed",
      label: "Confirmed",
      description: "Order has been confirmed and accepted.",
    },
    {
      value: "processing",
      label: "Processing",
      description: "Order is currently being prepared.",
    },
    {
      value: "shipped",
      label: "Shipped",
      description: "Order has been handed over for delivery.",
    },
    {
      value: "delivered",
      label: "Delivered",
      description: "Order has been successfully delivered.",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      description: "Order has been cancelled.",
    },
    {
      value: "refunded",
      label: "Refunded",
      description: "Payment has been refunded to the customer.",
    },
  ];

  const formatStatus = (value) =>
    String(value)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const getStatusClasses = (value) => {
    switch (value) {
      case "delivered":
        return "bg-green-100 text-green-700";

      case "confirmed":
      case "processing":
      case "shipped":
        return "bg-blue-100 text-blue-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleConfirm = () => {
    if (!status || status === currentStatus) return;

    onConfirm?.(order, status, reason.trim());
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Update Order Status
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Order #{orderId} · {customerName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Current Status */}
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <p className="text-xs font-medium text-muted-foreground">
            Current Status
          </p>

          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
              currentStatus,
            )}`}
          >
            {formatStatus(currentStatus)}
          </span>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-5 sm:px-6">
          <label className="mb-3 block text-sm font-semibold text-foreground">
            Select New Status
          </label>

          <div className="space-y-2">
            {statuses.map((item) => {
              const selected = status === item.value;
              const isCurrent = currentStatus === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatus(item.value)}
                  disabled={loading}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>

                      {isCurrent && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Current
                        </span>
                      )}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reason */}
          <div className="mt-5">
            <label
              htmlFor="order-status-reason"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <textarea
              id="order-status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={loading}
              rows={4}
              maxLength={500}
              placeholder={
                status === "cancelled"
                  ? "Enter the cancellation reason..."
                  : "Add a note about this status change..."
              }
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-1 text-right text-[11px] text-muted-foreground">
              {reason.length}/500
            </div>
          </div>

          {/* Cancellation Warning */}
          {status === "cancelled" && currentStatus !== "cancelled" && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex gap-2">
                <span className="text-sm">⚠️</span>

                <p className="text-xs leading-5 text-red-700">
                  Cancelling an order may trigger stock restoration and refund
                  processing depending on your backend order flow.
                </p>
              </div>
            </div>
          )}

          {/* Refund Warning */}
          {status === "refunded" && currentStatus !== "refunded" && (
            <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-3">
              <div className="flex gap-2">
                <span className="text-sm">💰</span>

                <p className="text-xs leading-5 text-purple-700">
                  Make sure the payment has actually been refunded before
                  marking the order as refunded.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !status || status === currentStatus}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Updating...
              </span>
            ) : (
              "Update Status"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
