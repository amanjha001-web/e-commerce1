const OrderTimeline = ({ status = "pending", events = [] }) => {
  const normalizedStatus = String(status)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const defaultSteps = [
    {
      key: "pending",
      label: "Order Placed",
      description: "Your order has been placed.",
    },
    {
      key: "confirmed",
      label: "Order Confirmed",
      description: "Your order has been confirmed.",
    },
    {
      key: "processing",
      label: "Processing",
      description: "Your order is being prepared.",
    },
    {
      key: "shipped",
      label: "Shipped",
      description: "Your order has been shipped.",
    },
    {
      key: "out_for_delivery",
      label: "Out for Delivery",
      description: "Your order is on the way.",
    },
    {
      key: "delivered",
      label: "Delivered",
      description: "Your order has been delivered.",
    },
  ];

  const statusOrder = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];

  const currentIndex = statusOrder.indexOf(normalizedStatus);

  const steps = events.length
    ? events.map((event) => ({
        key: event.status || event.key || event._id,
        label: event.label || event.title || event.status || "Order Update",
        description: event.description || event.message || "",
        date: event.date || event.createdAt || event.timestamp,
        completed: event.completed ?? event.isCompleted ?? false,
      }))
    : defaultSteps.map((step, index) => ({
        ...step,
        completed: currentIndex >= 0 ? index <= currentIndex : index === 0,
      }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Order Timeline
      </h2>

      <div className="mt-6">
        {steps.map((step, index) => {
          const completed = Boolean(step.completed);

          const isLast = index === steps.length - 1;

          return (
            <div key={step.key || index} className="relative flex gap-4">
              {!isLast && (
                <div
                  className={`absolute left-[9px] top-6 h-full w-0.5 ${
                    completed ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  completed
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                }`}
              >
                {completed && <span className="text-[10px]">✓</span>}
              </div>

              <div className={`min-w-0 pb-7 ${isLast ? "pb-0" : ""}`}>
                <h3
                  className={`text-sm font-semibold ${
                    completed
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </h3>

                {step.description && (
                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                )}

                {step.date && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    {new Date(step.date).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
