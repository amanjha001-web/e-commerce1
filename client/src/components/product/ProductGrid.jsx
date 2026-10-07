import ProductCard from "./ProductCard";

const ProductGrid = ({
  products = [],
  onAddToCart,
  onWishlist,
  wishlistIds = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="aspect-square bg-gray-200 dark:bg-gray-800" />

            <div className="space-y-3 p-4">
              <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />

              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />

              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />

              <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />

              <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
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
          Try changing your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => {
        const productId = product._id || product.id || product.slug;

        const isWishlisted = wishlistIds.includes(productId);

        return (
          <ProductCard
            key={productId || index}
            product={product}
            onAddToCart={onAddToCart}
            onWishlist={onWishlist}
            isWishlisted={isWishlisted}
            loading={loading}
          />
        );
      })}
    </div>
  );
};

export default ProductGrid;
