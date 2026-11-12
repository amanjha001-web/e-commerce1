import ProductCard from "./ProductCard";

const RelatedProducts = ({
  products = [],
  currentProductId,
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
      <div className="product-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="product animate-pulse">
            <div className="productvisual opacity-60" />

            <div className="productbody space-y-2.5">
              <div className="h-3 w-1/3 rounded bg-[var(--soft)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--soft)]" />
              <div className="h-5 w-1/2 rounded bg-[var(--soft)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredProducts.length) {
    return null;
  }

  return (
    <div className="product-grid">
      {filteredProducts.slice(0, 4).map((product, index) => {
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
            wishlistIds={wishlistIds}
            isWishlisted={isWishlisted}
          />
        );
      })}
    </div>
  );
};

export default RelatedProducts;
