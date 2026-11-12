import DataTable from "./DataTable";

const PayoutTable = ({ payouts = [], loading = false, onView, onRetry }) => {
  const getStatusClass = (status) => {
    const normalized = String(status).toLowerCase();

    if (["paid", "completed", "success", "successful"].includes(normalized)) {
      return "status-badge green";
    }

    if (["failed", "cancelled", "canceled", "rejected"].includes(normalized)) {
      return "status-badge red";
    }

    return "status-badge amber";
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
        <span className="text-xs font-black text-[var(--text)] dark:text-foreground">
          #{String(getPayoutId(payout)).slice(-8)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (payout) => (
        <span className="text-xs font-black text-[var(--primary)]">
          ₹{getAmount(payout).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      label: "Method",
      sortable: false,
      render: (payout) => (
        <span className="text-xs font-medium capitalize text-[var(--muted)]">
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

        return (
          <span className="text-xs font-medium text-[var(--muted)]">
            {new Date(date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (payout) => {
        const status = getStatus(payout);

        return (
          <span className={getStatusClass(status)}>
            {String(status).replace(/_/g, " ")}
          </span>
        );
      },
    },
  ];

  const actions = (payout) => {
    const status = String(getStatus(payout)).toLowerCase();

    return (
      <div className="flex items-center justify-end gap-1.5">
        {onView && (
          <button
            type="button"
            onClick={() => onView(payout)}
            className="btnsm primary"
          >
            View
          </button>
        )}

        {onRetry && ["failed", "rejected"].includes(status) && (
          <button
            type="button"
            onClick={() => onRetry(payout)}
            className="btnsm"
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


