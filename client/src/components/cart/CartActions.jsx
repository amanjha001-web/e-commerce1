import { Link } from "react-router-dom";

const CartActions = ({
  onClearCart,
  onContinueShopping,
  checkoutPath = "/checkout",
  loading = false,
}) => {
  const handleClearCart = () => {
    if (loading) return;

    onClearCart?.();
  };

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-3">
        {onContinueShopping ? (
          <button
            type="button"
            onClick={onContinueShopping}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ← Continue Shopping
          </button>
        ) : (
          <Link
            to="/products"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ← Continue Shopping
          </Link>
        )}

        {onClearCart && (
          <button
            type="button"
            onClick={handleClearCart}
            disabled={loading}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {loading ? "Clearing..." : "Clear Cart"}
          </button>
        )}
      </div>

      <Link
        to={checkoutPath}
        className={`rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700 ${
          loading ? "pointer-events-none opacity-50" : ""
        }`}
      >
        Proceed to Checkout
      </Link>
    </div>
  );
};

export default CartActions;
