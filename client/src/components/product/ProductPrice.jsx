const ProductPrice = ({
  product,
  price,
  originalPrice,
  currency = "₹",
  className = "",
}) => {
  if (!product && price == null) {
    return null;
  }

  const currentPrice = Number(
    price ??
      product?.salePrice ??
      product?.discountedPrice ??
      product?.price ??
      0,
  );

  const oldPrice = Number(
    originalPrice ??
      product?.originalPrice ??
      product?.mrp ??
      product?.regularPrice ??
      0,
  );

  const hasDiscount = oldPrice > currentPrice && currentPrice >= 0;

  const discountPercentage =
    hasDiscount && oldPrice > 0
      ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
      : 0;

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span className="text-lg font-bold text-gray-900 dark:text-white">
        {currency}
        {currentPrice.toLocaleString("en-IN")}
      </span>

      {hasDiscount && (
        <>
          <span className="text-sm text-gray-400 line-through">
            {currency}
            {oldPrice.toLocaleString("en-IN")}
          </span>

          {discountPercentage > 0 && (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              {discountPercentage}% off
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default ProductPrice;
