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
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }

    if (["cancelled", "canceled", "failed", "rejected"].includes(normalized)) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }

    if (["shipped", "processing", "confirmed"].includes(normalized)) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }

    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
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
            <p className="font-semibold text-gray-900 dark:text-white">
              #{String(id).slice(-8)}
            </p>

            {order?.createdAt && (
              <p className="mt-1 text-xs text-gray-400">
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
          <p className="font-medium text-gray-900 dark:text-white">
            {getCustomerName(order)}
          </p>

          {(order?.user?.email || order?.customer?.email || order?.email) && (
            <p className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
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
      render: (order) =>
        `${getItemsCount(order)} ${
          getItemsCount(order) === 1 ? "item" : "items"
        }`,
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (order) => (
        <span className="font-semibold text-gray-900 dark:text-white">
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

  const actions = (order) => (
    <div className="flex items-center justify-end gap-2">
      {onView && (
        <button
          type="button"
          onClick={() => onView(order)}
          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          View
        </button>
      )}

      {onUpdateStatus && (
        <button
          type="button"
          onClick={() => onUpdateStatus(order)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Status
        </button>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={() => onCancel(order)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
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
