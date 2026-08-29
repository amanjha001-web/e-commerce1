import ProductCard from "./ProductCard";

const RelatedProducts = ({
  products = [],
  currentProductId,
  title = "Related Products",
  onAddToCart,
  onWishlist,
  wishlistIds = [],
  loading = false,
}) => {
  const filteredProducts = products.filter((product) => {
    const productId = product?._id || product?.id || product?.slug;

    return productId && productId !== currentProductId;
  });

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="mb-5 text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
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
      </section>
    );
  }

  if (!filteredProducts.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You may also like these products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredProducts.map((product, index) => {
          const productId = product._id || product.id || product.slug;

          const isWishlisted = wishlistIds.includes(productId);

          return (
            <ProductCard
              key={productId || index}
              product={product}
              onAddToCart={onAddToCart}
              onWishlist={onWishlist}
              wishlistIds={wishlistIds}
              isWishlisted={isWishlisted}
            />
          );
        })}
      </div>
    </section>
  );
};

export default RelatedProducts;
