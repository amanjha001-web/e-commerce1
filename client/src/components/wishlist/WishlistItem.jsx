const WishlistItem = ({
  item,
  product: productProp,
  onRemove,
  onAddToCart,
  onProductClick,
}) => {
  const product = productProp || item?.product || item;

  const productId = product?._id || product?.id;

  const name = product?.name || product?.title || "Unnamed Product";

  const image =
    product?.images?.[0]?.url ||
    product?.images?.[0] ||
    product?.image ||
    product?.thumbnail;

  const price = Number(
    product?.price ?? product?.sellingPrice ?? product?.salePrice ?? 0,
  );

  const originalPrice = Number(
    product?.originalPrice ?? product?.mrp ?? product?.compareAtPrice ?? 0,
  );

  const discount =
    originalPrice > price && price > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const stock = Number(
    product?.stock ?? product?.quantity ?? product?.inventory?.stock ?? 0,
  );

  const isOutOfStock =
    product?.isOutOfStock || product?.inStock === false || stock <= 0;

  const handleProductClick = () => {
    onProductClick?.(product);
  };

  const handleRemove = (event) => {
    event.stopPropagation();
    onRemove?.(item || product);
  };

  const handleAddToCart = (event) => {
    event.stopPropagation();

    if (!isOutOfStock) {
      onAddToCart?.(product);
    }
  };

  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      {/* Image */}
      <div
        onClick={handleProductClick}
        className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            📦
          </div>
        )}

        {/* Discount */}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
            {discount}% OFF
          </span>
        )}

        {/* Remove */}
        {onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label={`Remove ${name} from wishlist`}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg text-red-500 shadow-sm transition hover:bg-red-50 dark:bg-gray-900/95 dark:hover:bg-red-900/20"
          >
            ♥
          </button>
        )}

        {/* Out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-600">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <button
          type="button"
          onClick={handleProductClick}
          className="block w-full text-left"
        >
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {name}
          </h3>
        </button>

        {/* Price */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            ₹{price.toLocaleString("en-IN")}
          </span>

          {originalPrice > price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Stock */}
        {!isOutOfStock && stock > 0 && stock <= 10 && (
          <p className="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400">
            Only {stock} left
          </p>
        )}

        {/* Add to cart */}
        {onAddToCart && (
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        )}

        {/* Product ID for debugging/dev */}
        {productId && <span className="sr-only">Product ID: {productId}</span>}
      </div>
    </article>
  );
};

export default WishlistItem;
