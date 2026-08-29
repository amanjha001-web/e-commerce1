import { Link } from "react-router-dom";

const CartItem = ({ item, onQuantityChange, onRemove, loading = false }) => {
  if (!item) {
    return null;
  }

  const product = item.product || item;

  const productId = product._id || product.id || item.productId;

  const image =
    product.images?.[0]?.url ||
    product.images?.[0] ||
    product.image ||
    "/images/placeholder.png";

  const name = product.name || product.title || "Product";

  const price = item.price ?? product.price ?? 0;

  const quantity = item.quantity || 1;

  const subtotal = price * quantity;

  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange?.(quantity - 1, item);
    }
  };

  const handleIncrease = () => {
    onQuantityChange?.(quantity + 1, item);
  };

  return (
    <div className="flex gap-4 border-b border-gray-200 py-5 dark:border-gray-800">
      <Link
        to={`/products/${productId}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
      >
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = "/images/placeholder.png";
          }}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/products/${productId}`}
              className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
            >
              {name}
            </Link>

            {item.variant && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {item.variant}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove?.(item)}
            disabled={loading}
            className="shrink-0 text-sm text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1 || loading}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span className="min-w-10 border-x border-gray-300 px-3 py-1.5 text-center text-sm dark:border-gray-700">
              {quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={loading}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ₹{price.toLocaleString("en-IN")} each
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              ₹{subtotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
