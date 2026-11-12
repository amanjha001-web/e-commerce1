import DataTable from "./DataTable";

const OrderTable = ({
  orders = [],
  loading = false,
  onView,
  onUpdateStatus,
  onCancel,
}) => {
  const getOrderId = (order) =>
    order?._id || order?.id || order?.orderNumber || "—";

  const getCustomerName = (order) =>
    order?.user?.fullName ||
    order?.user?.name ||
    order?.customer?.fullName ||
    order?.customer?.name ||
    order?.customerName ||
    "Guest";

  const getStatus = (order) => order?.status || order?.orderStatus || "pending";

  const getStatusClass = (status) => {
    const normalized = String(status).toLowerCase();

    if (["delivered", "completed", "paid"].includes(normalized)) {
      return "status-badge green";
    }

    if (["cancelled", "canceled", "failed", "rejected"].includes(normalized)) {
      return "status-badge red";
    }

    if (["shipped", "processing", "confirmed"].includes(normalized)) {
      return "status-badge";
    }

    return "status-badge amber";
  };

  const getTotal = (order) =>
    Number(order?.totalAmount ?? order?.total ?? order?.grandTotal ?? 0);

  const getItemsCount = (order) => {
    if (Array.isArray(order?.items)) {
      return order.items.reduce(
        (total, item) => total + Number(item?.quantity || 1),
        0,
      );
    }

    return Number(order?.itemsCount || order?.totalItems || 0);
  };

  const columns = [
    {
      key: "orderId",
      label: "Order",
      sortable: false,
      render: (order) => {
        const id = getOrderId(order);

        return (
          <div>
            <p className="text-xs font-black text-[var(--text)] dark:text-foreground">
              #{String(id).slice(-8)}
            </p>

            {order?.createdAt && (
              <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "customer",
      label: "Customer",
      sortable: false,
      render: (order) => (
        <div>
          <p className="text-xs font-bold text-[var(--text)] dark:text-foreground">
            {getCustomerName(order)}
          </p>

          {(order?.user?.email || order?.customer?.email || order?.email) && (
            <p className="mt-0.5 max-w-[180px] truncate text-[11px] font-medium text-[var(--muted)]">
              {order?.user?.email || order?.customer?.email || order?.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      sortable: false,
      render: (order) => (
        <span className="text-xs font-medium text-[var(--muted)]">
          {getItemsCount(order)} {getItemsCount(order) === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (order) => (
        <span className="text-xs font-black text-[var(--primary)]">
          ₹{getTotal(order).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (order) => {
        const status = getStatus(order);

        return (
          <span className={getStatusClass(status)}>
            {String(status).replace(/_/g, " ")}
          </span>
        );
      },
    },
  ];

  const actions = (order) => (
    <div className="flex items-center justify-end gap-1.5">
      {onView && (
        <button
          type="button"
          onClick={() => onView(order)}
          className="btnsm primary"
        >
          View
        </button>
      )}

      {onUpdateStatus && (
        <button
          type="button"
          onClick={() => onUpdateStatus(order)}
          className="btnsm"
        >
          Status
        </button>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={() => onCancel(order)}
          className="btnsm text-[var(--red)] border-[#f3cbd0] hover:bg-[#fff0f1]"
        >
          Cancel
        </button>
      )}
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={orders}
      loading={loading}
      emptyMessage="No orders found."
      actions={onView || onUpdateStatus || onCancel ? actions : undefined}
    />
  );
};

export default OrderTable;


