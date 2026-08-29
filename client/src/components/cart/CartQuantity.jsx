const CartQuantity = ({
  quantity = 1,
  min = 1,
  max,
  onChange,
  loading = false,
  disabled = false,
}) => {
  const isDisabled = loading || disabled;

  const decrease = () => {
    if (quantity <= min || isDisabled) return;

    onChange?.(quantity - 1);
  };

  const increase = () => {
    if ((max && quantity >= max) || isDisabled) return;

    onChange?.(quantity + 1);
  };

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
      <button
        type="button"
        onClick={decrease}
        disabled={isDisabled || quantity <= min}
        className="flex h-9 w-9 items-center justify-center text-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span className="flex h-9 min-w-10 items-center justify-center border-x border-gray-300 px-2 text-sm font-medium text-gray-900 dark:border-gray-700 dark:text-white">
        {quantity}
      </span>

      <button
        type="button"
        onClick={increase}
        disabled={isDisabled || (max !== undefined && quantity >= max)}
        className="flex h-9 w-9 items-center justify-center text-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default CartQuantity;
