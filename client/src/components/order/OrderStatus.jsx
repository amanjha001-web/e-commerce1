const OrderStatus = ({ status }) => {
  const normalizedStatus = String(status || "pending")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const statusConfig = {
    pending: {
      label: "Pending",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    confirmed: {
      label: "Confirmed",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    processing: {
      label: "Processing",
      className:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    shipped: {
      label: "Shipped",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    delivered: {
      label: "Delivered",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    returned: {
      label: "Returned",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    refunded: {
      label: "Refunded",
      className:
        "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    },
  };

  const config = statusConfig[normalizedStatus] || {
    label: status || "Unknown",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default OrderStatus;
