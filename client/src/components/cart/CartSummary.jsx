import { Link } from "react-router-dom";

const CartSummary = ({
  subtotal = 0,
  discount = 0,
  shipping = 0,
  tax = 0,
  total = 0,
  itemCount = 0,
  checkoutPath = "/checkout",
  showCheckout = true,
  loading = false,
}) => {
  const formatPrice = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Order Summary
      </h2>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Subtotal ({itemCount} items)
          </span>

          <span className="font-medium text-gray-900 dark:text-white">
            {formatPrice(subtotal)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Discount</span>

            <span className="font-medium text-green-600">
              - {formatPrice(discount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Shipping</span>

          <span className="font-medium text-gray-900 dark:text-white">
            {shipping === 0 ? "FREE" : formatPrice(shipping)}
          </span>
        </div>

        {tax > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tax</span>

            <span className="font-medium text-gray-900 dark:text-white">
              {formatPrice(tax)}
            </span>
          </div>
        )}
      </div>

      <div className="my-5 border-t border-gray-200 dark:border-gray-800" />

      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900 dark:text-white">
          Total
        </span>

        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {formatPrice(total)}
        </span>
      </div>

      {showCheckout && (
        <Link
          to={checkoutPath}
          className={`mt-5 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {loading ? "Processing..." : "Proceed to Checkout"}
        </Link>
      )}
    </div>
  );
};

export default CartSummary;
