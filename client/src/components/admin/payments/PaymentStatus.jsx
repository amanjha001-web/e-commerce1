import { useState } from "react";

const PaymentStatus = ({
  payment = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState("");

  if (!open || !payment) {
    return null;
  }

  const paymentId =
    payment?.paymentId ||
    payment?.transactionId ||
    payment?.razorpayPaymentId ||
    payment?._id ||
    payment?.id ||
    "N/A";

  const currentStatus = String(
    payment?.status ||
      payment?.paymentStatus ||
      payment?.transactionStatus ||
      "pending",
  ).toLowerCase();

  const amount =
    payment?.amount ?? payment?.totalAmount ?? payment?.order?.totalAmount ?? 0;

  const customer = payment?.user || payment?.customer || payment?.buyer || {};

  const customerName =
    customer?.fullName ||
    customer?.name ||
    payment?.customerName ||
    "Guest Customer";

  const statuses = [
    {
      value: "pending",
      label: "Pending",
      description: "Payment is awaiting confirmation.",
    },
    {
      value: "processing",
      label: "Processing",
      description: "Payment is currently being processed.",
    },
    {
      value: "paid",
      label: "Paid",
      description: "Payment has been successfully received.",
    },
    {
      value: "failed",
      label: "Failed",
      description: "Payment processing was unsuccessful.",
    },
    {
      value: "refunded",
      label: "Refunded",
      description: "The payment amount has been refunded.",
    },
    {
      value: "partially_refunded",
      label: "Partially Refunded",
      description: "Only part of the payment amount has been refunded.",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      description: "Payment transaction has been cancelled.",
    },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatStatus = (value) => {
    return String(value)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusClasses = (value) => {
    switch (value) {
      case "paid":
      case "success":
      case "successful":
      case "completed":
        return "bg-green-100 text-green-700";

      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
      case "failure":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-purple-100 text-purple-700";

      case "partially_refunded":
        return "bg-indigo-100 text-indigo-700";

      case "cancelled":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleConfirm = () => {
    if (!status || status === currentStatus) {
      return;
    }

    onConfirm?.(payment, status, reason.trim());
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  const isRefundStatus =
    status === "refunded" || status === "partially_refunded";

  const isDangerousChange =
    status === "failed" || status === "cancelled" || isRefundStatus;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Update Payment Status
            </h2>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {paymentId} · {customerName}
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

        {/* Payment Summary */}
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Payment Amount</p>

              <p className="mt-1 text-lg font-bold text-foreground">
                {formatCurrency(amount)}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                currentStatus,
              )}`}
            >
              {formatStatus(currentStatus)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6">
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
              htmlFor="payment-status-reason"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <textarea
              id="payment-status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={loading}
              rows={4}
              maxLength={500}
              placeholder={
                status === "failed"
                  ? "Enter the payment failure reason..."
                  : status === "refunded" || status === "partially_refunded"
                    ? "Enter the refund reason..."
                    : "Add a note about this status change..."
              }
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-1 text-right text-[11px] text-muted-foreground">
              {reason.length}/500
            </div>
          </div>

          {/* Warning */}
          {isDangerousChange && status !== currentStatus && (
            <div
              className={`mt-4 rounded-xl border p-3 ${
                isRefundStatus
                  ? "border-purple-200 bg-purple-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex gap-2">
                <span className="text-sm">{isRefundStatus ? "💰" : "⚠️"}</span>

                <p
                  className={`text-xs leading-5 ${
                    isRefundStatus ? "text-purple-700" : "text-red-700"
                  }`}
                >
                  {isRefundStatus
                    ? "Only mark a payment as refunded after confirming that the refund has actually been processed through the payment gateway."
                    : "Changing a payment to this status may affect the related order and payment records. Make sure the change is valid before continuing."}
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

export default PaymentStatus;
