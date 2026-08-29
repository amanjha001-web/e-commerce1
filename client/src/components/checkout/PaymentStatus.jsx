const PaymentStatus = ({
  status = "pending",
  orderId,
  amount,
  transactionId,
  message,
  onRetry,
  onContinue,
  onViewOrder,
}) => {
  const normalizedStatus = String(status).toLowerCase();

  const statusConfig = {
    success: {
      icon: "✓",
      title: "Payment Successful",
      defaultMessage: "Your payment has been successfully processed.",
      iconClass:
        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },

    paid: {
      icon: "✓",
      title: "Payment Successful",
      defaultMessage: "Your payment has been successfully processed.",
      iconClass:
        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },

    failed: {
      icon: "✕",
      title: "Payment Failed",
      defaultMessage: "We could not process your payment. Please try again.",
      iconClass: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },

    cancelled: {
      icon: "✕",
      title: "Payment Cancelled",
      defaultMessage: "The payment was cancelled before completion.",
      iconClass: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },

    pending: {
      icon: "⏳",
      title: "Payment Pending",
      defaultMessage: "Your payment is being processed. Please wait.",
      iconClass:
        "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
  };

  const config = statusConfig[normalizedStatus] || statusConfig.pending;

  const formatAmount = (value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const formattedAmount = formatAmount(amount);

  const isSuccess =
    normalizedStatus === "success" || normalizedStatus === "paid";

  const isFailed =
    normalizedStatus === "failed" || normalizedStatus === "cancelled";

  return (
    <div className="flex min-h-[420px] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        {/* Status Icon */}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold ${config.iconClass}`}
        >
          {config.icon}
        </div>

        {/* Title */}
        <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
          {config.title}
        </h2>

        {/* Message */}
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
          {message || config.defaultMessage}
        </p>

        {/* Details */}
        {(orderId || formattedAmount || transactionId) && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left dark:bg-gray-800/60">
            {orderId && (
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Order ID
                </span>

                <span className="max-w-[180px] truncate text-xs font-semibold text-gray-900 dark:text-white">
                  {orderId}
                </span>
              </div>
            )}

            {formattedAmount && (
              <div
                className={`flex items-center justify-between gap-4 ${
                  orderId ? "py-3" : "pb-3"
                } ${
                  transactionId
                    ? "border-b border-gray-200 dark:border-gray-700"
                    : ""
                }`}
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Amount
                </span>

                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formattedAmount}
                </span>
              </div>
            )}

            {transactionId && (
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Transaction ID
                </span>

                <span className="max-w-[180px] truncate text-xs font-semibold text-gray-900 dark:text-white">
                  {transactionId}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Success Actions */}
        {isSuccess && (
          <div className="mt-6 flex flex-col gap-3">
            {onViewOrder && (
              <button
                type="button"
                onClick={onViewOrder}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View Order
              </button>
            )}

            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Continue Shopping
              </button>
            )}
          </div>
        )}

        {/* Failed Actions */}
        {isFailed && (
          <div className="mt-6 flex flex-col gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>
            )}

            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Back to Cart
              </button>
            )}
          </div>
        )}

        {/* Pending */}
        {normalizedStatus === "pending" && (
          <div className="mt-6">
            <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Please do not close this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
