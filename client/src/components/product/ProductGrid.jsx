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
      <div className="product-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="product animate-pulse">
            <div className="productvisual opacity-60" />

            <div className="productbody space-y-2.5">
              <div className="h-3 w-1/3 rounded bg-[var(--soft)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--soft)]" />
              <div className="h-5 w-1/2 rounded bg-[var(--soft)]" />
              <div className="mt-3 flex gap-2">
                <div className="h-9 flex-1 rounded-xl bg-[var(--soft)]" />
                <div className="h-9 flex-1 rounded-xl bg-[var(--soft)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="panel py-14 text-center text-[var(--muted)]">
        <div className="text-5xl">🛍️</div>

        <b className="mt-2 block text-lg font-bold text-[var(--text)]">
          No products found.
        </b>

        <p className="mt-1 text-sm text-[var(--muted)]">
          Try changing your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => {
        const productId = product._id || product.id || product.slug;

        const isWishlisted = wishlistIds.some(
          (id) => String(id) === String(productId),
        );

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
