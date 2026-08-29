const OrderItem = ({ item, onClick }) => {
  if (!item) {
    return null;
  }

  const product = item.product || {};

  const productId = product._id || product.id || item.productId;

  const productName = product.name || item.productName || "Product";

  const image = product.image || product.thumbnail || item.image || "";

  const quantity = Number(item.quantity) || 1;

  const price = Number(item.price ?? item.unitPrice ?? product.price ?? 0);

  const total = Number(item.total ?? item.subtotal ?? price * quantity);

  return (
    <div
      onClick={() => onClick?.(item)}
      className={`flex gap-4 border-b border-gray-200 py-4 last:border-b-0 dark:border-gray-800 ${
        onClick
          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
          : ""
      }`}
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        {image ? (
          <img
            src={image}
            alt={productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            📦
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
              {productName}
            </h3>

            {productId && (
              <p className="mt-1 text-xs text-gray-400">
                Product ID: {String(productId).slice(-8)}
              </p>
            )}
          </div>

          <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Price: ₹{price.toLocaleString("en-IN")}</span>

          <span>Quantity: {quantity}</span>

          {item.variant && (
            <span>
              Variant:{" "}
              {typeof item.variant === "string"
                ? item.variant
                : item.variant.name || "Selected"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
