import { useState } from "react";

const InfoItem = ({ label, value, mono = false }) => (
  <div>
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>

    <p
      className={`mt-1 break-words text-sm text-foreground ${
        mono ? "font-mono text-xs" : ""
      }`}
    >
      {value || "N/A"}
    </p>
  </div>
);

const PaymentDetails = ({
  payment = null,
  open = false,
  loading = false,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!open || !payment) {
    return null;
  }

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    return String(value)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const paymentId =
    payment?.paymentId ||
    payment?.transactionId ||
    payment?.razorpayPaymentId ||
    payment?._id ||
    payment?.id ||
    "N/A";

  const orderId =
    payment?.order?.orderNumber ||
    payment?.order?.orderId ||
    payment?.orderNumber ||
    payment?.orderId ||
    payment?.order?._id ||
    "N/A";

  const status = String(
    payment?.status ||
      payment?.paymentStatus ||
      payment?.transactionStatus ||
      "pending",
  ).toLowerCase();

  const method =
    payment?.method || payment?.paymentMethod || payment?.mode || "N/A";

  const amount =
    payment?.amount ??
    payment?.totalAmount ??
    payment?.order?.totalAmount ??
    payment?.order?.total ??
    0;

  const currency = payment?.currency || "INR";

  const customer = payment?.user || payment?.customer || payment?.buyer || {};

  const customerName =
    customer?.fullName ||
    customer?.name ||
    payment?.customerName ||
    "Guest Customer";

  const customerEmail = customer?.email || payment?.customerEmail || "N/A";

  const customerPhone =
    customer?.phone || customer?.phoneNumber || payment?.customerPhone || "N/A";

  const createdAt = payment?.createdAt || payment?.initiatedAt;

  const paidAt = payment?.paidAt || payment?.completedAt;

  const updatedAt = payment?.updatedAt;

  const gateway =
    payment?.gateway || payment?.provider || payment?.paymentGateway || "N/A";

  const gatewayOrderId =
    payment?.razorpayOrderId ||
    payment?.gatewayOrderId ||
    payment?.providerOrderId ||
    "N/A";

  const gatewayPaymentId =
    payment?.razorpayPaymentId ||
    payment?.gatewayPaymentId ||
    payment?.providerPaymentId ||
    payment?.transactionId ||
    "N/A";

  const getStatusClasses = (value) => {
    switch (value) {
      case "success":
      case "successful":
      case "paid":
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

  const tabs = [
    {
      key: "overview",
      label: "Overview",
    },
    {
      key: "customer",
      label: "Customer",
    },
    {
      key: "transaction",
      label: "Transaction",
    },
    {
      key: "timeline",
      label: "Timeline",
    },
  ];

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  const customerInitials =
    customerName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "GU";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
                Payment Details
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                  status,
                )}`}
              >
                {formatValue(status)}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              Transaction: {paymentId}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="overflow-x-auto border-b border-border">
          <div className="flex min-w-max px-5 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition first:pl-0 ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Amount */}
              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <p className="text-xs text-muted-foreground">Payment Amount</p>

                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(amount)}
                  </p>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Payment Information
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem label="Payment ID" value={paymentId} mono />

                  <InfoItem label="Order ID" value={`#${orderId}`} />

                  <InfoItem
                    label="Payment Method"
                    value={formatValue(method)}
                  />

                  <InfoItem
                    label="Payment Gateway"
                    value={formatValue(gateway)}
                  />

                  <InfoItem label="Status" value={formatValue(status)} />

                  <InfoItem label="Currency" value={currency} />
                </div>
              </div>

              {/* Amount Breakdown */}
              {(payment?.subtotal !== undefined ||
                payment?.tax !== undefined ||
                payment?.shippingCharge !== undefined ||
                payment?.discount !== undefined) && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Amount Breakdown
                  </h3>

                  <div className="mt-3 rounded-xl border border-border">
                    {payment?.subtotal !== undefined && (
                      <div className="flex justify-between border-b border-border px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Subtotal</span>

                        <span className="font-medium text-foreground">
                          {formatCurrency(payment.subtotal)}
                        </span>
                      </div>
                    )}

                    {payment?.discount !== undefined && (
                      <div className="flex justify-between border-b border-border px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Discount</span>

                        <span className="font-medium text-green-600">
                          - {formatCurrency(payment.discount)}
                        </span>
                      </div>
                    )}

                    {payment?.shippingCharge !== undefined && (
                      <div className="flex justify-between border-b border-border px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Shipping</span>

                        <span className="font-medium text-foreground">
                          {formatCurrency(payment.shippingCharge)}
                        </span>
                      </div>
                    )}

                    {payment?.tax !== undefined && (
                      <div className="flex justify-between border-b border-border px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Tax</span>

                        <span className="font-medium text-foreground">
                          {formatCurrency(payment.tax)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between px-4 py-3 text-sm font-semibold">
                      <span className="text-foreground">Total</span>

                      <span className="text-foreground">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer */}
          {activeTab === "customer" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {customerInitials}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {customerName}
                    </h3>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {customerEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Customer Information
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem label="Full Name" value={customerName} />

                  <InfoItem label="Email" value={customerEmail} />

                  <InfoItem label="Phone" value={customerPhone} />

                  <InfoItem
                    label="Customer ID"
                    value={
                      customer?._id || customer?.id || payment?.userId || "N/A"
                    }
                    mono
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Order Reference
                </h3>

                <div className="mt-3 rounded-xl border border-border p-4">
                  <InfoItem label="Order" value={`#${orderId}`} />
                </div>
              </div>
            </div>
          )}

          {/* Transaction */}
          {activeTab === "transaction" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Gateway Information
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                  <InfoItem label="Gateway" value={formatValue(gateway)} />

                  <InfoItem
                    label="Gateway Order ID"
                    value={gatewayOrderId}
                    mono
                  />

                  <InfoItem
                    label="Gateway Payment ID"
                    value={gatewayPaymentId}
                    mono
                  />

                  <InfoItem
                    label="Transaction ID"
                    value={payment?.transactionId || "N/A"}
                    mono
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Additional Details
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem
                    label="Payment Method"
                    value={formatValue(method)}
                  />

                  <InfoItem label="Currency" value={currency} />

                  <InfoItem label="Amount" value={formatCurrency(amount)} />

                  <InfoItem label="Status" value={formatValue(status)} />

                  <InfoItem
                    label="Failure Reason"
                    value={
                      payment?.failureReason || payment?.errorMessage || "N/A"
                    }
                  />

                  <InfoItem
                    label="Refund Amount"
                    value={
                      payment?.refundAmount !== undefined
                        ? formatCurrency(payment.refundAmount)
                        : "N/A"
                    }
                  />
                </div>
              </div>

              {payment?.metadata && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Metadata
                  </h3>

                  <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted/20 p-4 text-xs text-foreground">
                    {JSON.stringify(payment.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Payment Timeline
              </h3>

              <div className="mt-5 space-y-5">
                {[
                  {
                    label: "Payment Created",
                    date: createdAt,
                    description: "Payment transaction was created.",
                  },
                  {
                    label: "Payment Completed",
                    date: paidAt,
                    description: "Payment was successfully processed.",
                  },
                  {
                    label: "Last Updated",
                    date: updatedAt,
                    description: "Payment record was last updated.",
                  },
                ].map((item, index) => (
                  <div key={item.label} className="relative flex gap-4">
                    {index < 2 && (
                      <span className="absolute left-[7px] top-5 h-full w-px bg-border" />
                    )}

                    <span className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background" />

                    <div className="min-w-0 pb-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.date ? formatDate(item.date) : "Not available"}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
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
            Close
          </button>

          <button
            type="button"
            onClick={() => onStatusChange?.(payment)}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Change Status
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(payment)}
            disabled={loading}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
