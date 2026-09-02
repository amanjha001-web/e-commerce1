

const PaymentTable = ({
  payments = [],
  loading = false,
  onViewPayment,
  onEditPayment,
  onDeletePayment,
  onStatusChange,
}) => {
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

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (value) => {
    if (!value) return "Unknown";

    return String(value)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getPaymentStatus = (payment) =>
    String(
      payment?.status ||
        payment?.paymentStatus ||
        payment?.transactionStatus ||
        "pending",
    ).toLowerCase();

  const getMethod = (payment) =>
    payment?.method || payment?.paymentMethod || payment?.mode || "N/A";

  const getPaymentId = (payment) =>
    payment?.paymentId ||
    payment?.transactionId ||
    payment?.razorpayPaymentId ||
    payment?._id ||
    payment?.id ||
    "N/A";

  const getOrderId = (payment) =>
    payment?.order?.orderNumber ||
    payment?.order?.orderId ||
    payment?.orderNumber ||
    payment?.orderId ||
    payment?.order?._id ||
    payment?.order?._id ||
    "N/A";

  const getCustomer = (payment) => {
    const customer = payment?.user || payment?.customer || payment?.buyer;

    return {
      name:
        customer?.fullName ||
        customer?.name ||
        payment?.customerName ||
        "Guest Customer",
      email: customer?.email || payment?.customerEmail || "N/A",
    };
  };

  const getAmount = (payment) =>
    payment?.amount ??
    payment?.totalAmount ??
    payment?.order?.totalAmount ??
    payment?.order?.total ??
    0;

  const getStatusClasses = (status) => {
    switch (status) {
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

  const getMethodLabel = (method) => {
    const normalized = String(method).toLowerCase().replace(/[_-]/g, " ");

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Payment",
                  "Order",
                  "Customer",
                  "Amount",
                  "Method",
                  "Status",
                  "Date",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground"
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
                  {Array.from({
                    length: 8,
                  }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4">
                      <div className="h-4 w-full max-w-[130px] animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="rounded-2xl border border-border bg-background p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
          💳
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          No payments found
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          Payment transactions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Payment
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Order
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Customer
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Amount
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Method
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Date
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment, index) => {
              const status = getPaymentStatus(payment);

              const customer = getCustomer(payment);

              const paymentId = getPaymentId(payment);

              const orderId = getOrderId(payment);

              const amount = getAmount(payment);

              const method = getMethod(payment);

              const date =
                payment?.createdAt || payment?.paidAt || payment?.updatedAt;

              return (
                <tr
                  key={payment?._id || payment?.id || paymentId || index}
                  className="border-b border-border transition last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onViewPayment?.(payment)}
                      className="max-w-[160px] truncate text-left text-sm font-medium text-primary hover:underline"
                      title={paymentId}
                    >
                      {paymentId}
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-sm text-foreground">#{orderId}</span>
                  </td>

                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {customer.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(amount)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-sm text-foreground">
                      {getMethodLabel(method)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        status,
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(date)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewPayment?.(payment)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="View payment"
                      >
                        👁️
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditPayment?.(payment)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Edit payment"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => onStatusChange?.(payment)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Change status"
                      >
                        🔄
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeletePayment?.(payment)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                        title="Delete payment"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 p-4 md:hidden">
        {payments.map((payment, index) => {
          const status = getPaymentStatus(payment);

          const customer = getCustomer(payment);

          const paymentId = getPaymentId(payment);

          const orderId = getOrderId(payment);

          const amount = getAmount(payment);

          const method = getMethod(payment);

          const date =
            payment?.createdAt || payment?.paidAt || payment?.updatedAt;

          return (
            <div
              key={payment?._id || payment?.id || paymentId || index}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onViewPayment?.(payment)}
                    className="max-w-[200px] truncate text-left text-sm font-semibold text-primary"
                  >
                    {paymentId}
                  </button>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Order #{orderId}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                    status,
                  )}`}
                >
                  {formatStatus(status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Customer</p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {customer.name}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Amount</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatCurrency(amount)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Method</p>
                  <p className="mt-1 text-sm text-foreground">
                    {getMethodLabel(method)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Date</p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(date)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => onViewPayment?.(payment)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => onEditPayment?.(payment)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onStatusChange?.(payment)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Status
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePayment?.(payment)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
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

export default PaymentTable;
