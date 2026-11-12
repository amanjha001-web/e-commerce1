import WishlistItem from "./WishlistItem";

const WishlistGrid = ({
  items = [],
  loading = false,
  onRemove,
  onAddToCart,
  onProductClick,
}) => {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="product animate-pulse">
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

  if (!items.length) {
    return null;
  }

  return (
    <div className="product-grid">
      {items.map((item, index) => {
        const product = item?.product || item;

        const key =
          item?._id || item?.id || product?._id || product?.id || index;

        return (
          <WishlistItem
            key={key}
            item={item}
            product={product}
            onRemove={onRemove}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
          />
        );
      })}
    </div>
  );
};

export default WishlistGrid;
