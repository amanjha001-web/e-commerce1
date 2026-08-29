

const ProductList = ({
  products = [],
  onAddToCart,
  onWishlist,
  wishlistIds = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex animate-pulse gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="h-32 w-32 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />

            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center dark:border-gray-700">
        <div className="text-5xl">🛍️</div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          No products found
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product, index) => {
        const productId = product._id || product.id || product.slug;

        const image =
          product.thumbnail ||
          product.image ||
          product.images?.[0]?.url ||
          product.images?.[0] ||
          "";

        const name = product.name || product.title || "Product";

        const price = Number(product.price ?? product.salePrice ?? 0);

        const stock = Number(product.stock ?? product.quantity ?? 0);

        const isOutOfStock = product.inStock === false || stock <= 0;

        const isWishlisted = wishlistIds.includes(productId);

        return (
          <div
            key={productId || index}
            className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md sm:flex-row dark:border-gray-800 dark:bg-gray-900"
          >
            {/* Image */}
            <div className="relative h-56 w-full shrink-0 bg-gray-100 sm:h-40 sm:w-40 dark:bg-gray-800">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">
                  🛍️
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {product.category?.name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.category.name}
                    </p>
                  )}

                  <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">
                    {name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onWishlist?.(product)}
                  className={`shrink-0 text-xl ${
                    isWishlisted
                      ? "text-red-500"
                      : "text-gray-400 hover:text-red-500"
                  }`}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  {isWishlisted ? "♥" : "♡"}
                </button>
              </div>

              {/* Rating */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ⭐{" "}
                  {Number(product.rating ?? product.averageRating ?? 0).toFixed(
                    1,
                  )}
                </span>

                <span className="text-xs text-gray-400">
                  ({product.reviewCount ?? product.reviewsCount ?? 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mt-3">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ₹{price.toLocaleString("en-IN")}
                </span>

                {product.originalPrice &&
                  Number(product.originalPrice) > price && (
                    <span className="ml-2 text-sm text-gray-400 line-through">
                      ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                    </span>
                  )}
              </div>

              {/* Actions */}
              <div className="mt-auto flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => onAddToCart?.(product)}
                  disabled={loading || isOutOfStock}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>

                <a
                  href={`/products/${productId}`}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  View Details
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;
