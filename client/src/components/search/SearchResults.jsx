import ProductCard from "../product/ProductCard";
import ProductList from "../product/ProductList";

const SearchResults = ({
  products = [],
  loading = false,
  view = "grid",
  query = "",
  total = products.length,
  onAddToCart,
  onWishlist,
  wishlistIds = [],
  onLoadMore,
  hasMore = false,
}) => {
  if (loading && !products.length) {
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
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center dark:border-gray-700">
        <div className="text-5xl">🔎</div>

        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
          No products found
        </h2>

        <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {query
            ? `We couldn't find any products matching "${query}".`
            : "Try searching for another product."}
        </p>
      </div>
    );
  }

  return (
    <section className="w-full">
      {/* Results Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {query ? `Search results for "${query}"` : "Search Results"}
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {Number(total).toLocaleString("en-IN")}{" "}
            {Number(total) === 1 ? "product" : "products"} found
          </p>
        </div>

        {loading && (
          <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            Loading...
          </span>
        )}
      </div>

      {/* Products */}
      {view === "list" ? (
        <ProductList
          products={products}
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
          wishlistIds={wishlistIds}
          loading={false}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => {
            const productId = product?._id || product?.id || product?.slug;

            return (
              <ProductCard
                key={productId || index}
                product={product}
                onAddToCart={onAddToCart}
                onWishlist={onWishlist}
                wishlistIds={wishlistIds}
                isWishlisted={wishlistIds.includes(productId)}
              />
            );
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </section>
  );
};

export default SearchResults;
