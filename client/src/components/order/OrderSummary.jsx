const OrderSummary = ({
  order,
  subtotal,
  discount,
  shippingCharge,
  tax,
  total,
}) => {
  const items = order?.items || order?.orderItems || [];

  const calculatedSubtotal =
    subtotal ??
    order?.subtotal ??
    items.reduce((sum, item) => {
      const price = Number(
        item.price ?? item.unitPrice ?? item.product?.price ?? 0,
      );

      const quantity = Number(item.quantity) || 1;

      return sum + price * quantity;
    }, 0);

  const calculatedDiscount =
    discount ?? order?.discount ?? order?.discountAmount ?? 0;

  const calculatedShipping =
    shippingCharge ?? order?.shippingCharge ?? order?.shipping ?? 0;

  const calculatedTax = tax ?? order?.tax ?? order?.taxAmount ?? 0;

  const calculatedTotal =
    total ??
    order?.totalAmount ??
    order?.total ??
    calculatedSubtotal -
      calculatedDiscount +
      calculatedShipping +
      calculatedTax;

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Order Summary
      </h2>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Subtotal</span>

          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(calculatedSubtotal)}
          </span>
        </div>

        {calculatedDiscount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Discount</span>

            <span className="font-medium text-green-600 dark:text-green-400">
              - {formatCurrency(calculatedDiscount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Shipping</span>

          <span className="font-medium text-gray-900 dark:text-white">
            {calculatedShipping === 0
              ? "Free"
              : formatCurrency(calculatedShipping)}
          </span>
        </div>

        {calculatedTax > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Tax</span>

            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(calculatedTax)}
            </span>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-gray-200 dark:border-gray-800" />

      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900 dark:text-white">
          Total
        </span>

        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(calculatedTotal)}
        </span>
      </div>
    </div>
  );
};

export default OrderSummary;
