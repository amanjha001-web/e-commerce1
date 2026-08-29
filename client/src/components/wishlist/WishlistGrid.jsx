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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="aspect-square bg-gray-200 dark:bg-gray-800" />

            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />

              <div className="h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />

              <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
