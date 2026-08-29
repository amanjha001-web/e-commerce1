import OrderCard from "./OrderCard";

const OrderList = ({ orders = [], onCancel, onReturn, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              </div>

              <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="mt-4 flex gap-3">
              <div className="h-14 w-14 rounded-lg bg-gray-200 dark:bg-gray-700" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center dark:border-gray-700">
        <div className="text-5xl">📦</div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          No orders found
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your orders will appear here once you place an order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order, index) => (
        <OrderCard
          key={order._id || order.id || index}
          order={order}
          onCancel={onCancel}
          onReturn={onReturn}
        />
      ))}
    </div>
  );
};

export default OrderList;
