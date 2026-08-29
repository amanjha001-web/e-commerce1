import CartItem from "./CartItem";
import CartEmpty from "./CartEmpty";

const CartList = ({
  items = [],
  onQuantityChange,
  onRemove,
  loading = false,
}) => {
  if (!items.length) {
    return <CartEmpty />;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 py-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Shopping Cart
        </h2>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div>
        {items.map((item, index) => (
          <CartItem
            key={item._id || item.id || item.productId || index}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
};

export default CartList;
