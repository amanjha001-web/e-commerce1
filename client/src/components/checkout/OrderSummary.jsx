const OrderSummary = ({
  items = [],
  subtotal,
  discount = 0,
  shipping = 0,
  tax = 0,
  total,
  coupon,
  loading = false,
  onPlaceOrder,
  buttonText = "Place Order",
}) => {
  const getProduct = (item) => item?.product || item;

  const getQuantity = (item) => Number(item?.quantity ?? item?.qty ?? 1);

  const getPrice = (item) => {
    const product = getProduct(item);

    return Number(
      item?.price ??
        item?.unitPrice ??
        product?.price ??
        product?.sellingPrice ??
        0,
    );
  };

  const calculatedSubtotal = items.reduce(
    (sum, item) => sum + getPrice(item) * getQuantity(item),
    0,
  );

  const finalSubtotal =
    subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;

  const finalDiscount = Number(discount) || 0;

  const finalShipping = Number(shipping) || 0;

  const finalTax = Number(tax) || 0;

  const calculatedTotal =
    finalSubtotal - finalDiscount + finalShipping + finalTax;

  const finalTotal = total !== undefined ? Number(total) : calculatedTotal;

  const formatPrice = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />

          {Array.from({
            length: 3,
          }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <div className="h-14 w-14 rounded-lg bg-gray-200 dark:bg-gray-800" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}

          <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Order Summary
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {items.length} {items.length === 1 ? "item" : "items"} in your order
        </p>
      </div>

      {/* Items */}
      <div className="max-h-[360px] space-y-4 overflow-y-auto p-5">
        {items.length > 0 ? (
          items.map((item, index) => {
            const product = getProduct(item);

            const name = product?.name || product?.title || "Product";

            const image =
              product?.images?.[0]?.url ||
              product?.images?.[0] ||
              product?.image ||
              product?.thumbnail;

            const quantity = getQuantity(item);

            const price = getPrice(item);

            return (
              <div
                key={
                  item?._id || item?.id || product?._id || product?.id || index
                }
                className="flex gap-3"
              >
                {/* Image */}
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl dark:bg-gray-800">
                    📦
                  </div>
                )}

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatPrice(price)} × {quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPrice(price * quantity)}
                </p>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No items in your order.
          </div>
        )}
      </div>

      {/* Coupon */}
      {coupon && (
        <div className="mx-5 rounded-lg bg-green-50 px-3 py-2.5 dark:bg-green-900/20">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Coupon applied
            </span>

            <span className="text-xs font-bold uppercase text-green-700 dark:text-green-400">
              {coupon.code || coupon.couponCode || coupon}
            </span>
          </div>
        </div>
      )}

      {/* Price Details */}
      <div className="mt-4 border-t border-gray-200 px-5 pt-4 dark:border-gray-800">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatPrice(finalSubtotal)}</span>
          </div>

          {finalDiscount > 0 && (
            <div className="flex justify-between gap-4 text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span>- {formatPrice(finalDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
            <span>Shipping</span>

            <span>
              {finalShipping === 0 ? "FREE" : formatPrice(finalShipping)}
            </span>
          </div>

          {finalTax > 0 && (
            <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
              <span>Tax</span>
              <span>{formatPrice(finalTax)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="mx-5 mt-4 flex items-center justify-between border-t border-gray-200 py-4 dark:border-gray-800">
        <span className="font-bold text-gray-900 dark:text-white">Total</span>

        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {formatPrice(finalTotal)}
        </span>
      </div>

      {/* Place Order */}
      {onPlaceOrder && (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={loading || items.length === 0}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonText}
          </button>
        </div>
      )}

      {/* Secure Checkout */}
      <div className="border-t border-gray-100 px-5 py-3 text-center dark:border-gray-800">
        <p className="text-xs text-gray-400">🔒 Secure checkout</p>
      </div>
    </div>
  );
};

export default OrderSummary;
