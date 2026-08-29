import DataTable from "./DataTable";

const PayoutTable = ({ payouts = [], loading = false, onView, onRetry }) => {
  const getStatusClass = (status) => {
    const normalized = String(status).toLowerCase();

    if (["paid", "completed", "success", "successful"].includes(normalized)) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }

    if (["failed", "cancelled", "canceled", "rejected"].includes(normalized)) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }

    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  const getStatus = (payout) =>
    payout?.status || payout?.payoutStatus || "pending";

  const getAmount = (payout) =>
    Number(payout?.amount ?? payout?.payoutAmount ?? payout?.totalAmount ?? 0);

  const getPayoutId = (payout) =>
    payout?._id || payout?.id || payout?.payoutId || "—";

  const getPaymentMethod = (payout) =>
    payout?.paymentMethod || payout?.method || payout?.bankName || "—";

  const columns = [
    {
      key: "payoutId",
      label: "Payout ID",
      sortable: false,
      render: (payout) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          #{String(getPayoutId(payout)).slice(-8)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (payout) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          ₹{getAmount(payout).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      label: "Method",
      sortable: false,
      render: (payout) => (
        <span className="capitalize">
          {String(getPaymentMethod(payout)).replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (payout) => {
        const date = payout?.createdAt || payout?.requestedAt || payout?.date;

        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (payout) => {
        const status = getStatus(payout);

        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(
              status,
            )}`}
          >
            {String(status).replace(/_/g, " ")}
          </span>
        );
      },
    },
  ];

  const actions = (payout) => {
    const status = String(getStatus(payout)).toLowerCase();

    return (
      <div className="flex items-center justify-end gap-2">
        {onView && (
          <button
            type="button"
            onClick={() => onView(payout)}
            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            View
          </button>
        )}

        {onRetry && ["failed", "rejected"].includes(status) && (
          <button
            type="button"
            onClick={() => onRetry(payout)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Retry
          </button>
        )}
      </div>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={payouts}
      loading={loading}
      emptyMessage="No payout records found."
      actions={onView || onRetry ? actions : undefined}
    />
  );
};

export default PayoutTable;
