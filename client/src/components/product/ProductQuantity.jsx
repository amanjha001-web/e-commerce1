


const ProductQuantity = ({
  value = 1,
  min = 1,
  max = 99,
  stock,
  onChange,
  disabled = false,
}) => {
  const minimum = Number(min) || 1;
  const maximumValue = Number(max) || 99;

  const availableStock =
    Number.isFinite(Number(stock)) && Number(stock) >= 0
      ? Number(stock)
      : maximumValue;

  const maximum = Math.max(
    minimum,
    Math.min(maximumValue, availableStock),
  );

  const getValidQuantity = (inputValue) => {
    const numericValue = Number(inputValue);

    if (!Number.isFinite(numericValue)) {
      return minimum;
    }

    return Math.min(
      maximum,
      Math.max(minimum, numericValue),
    );
  };

  const quantity =
    value === "" ? "" : getValidQuantity(value);

  const updateQuantity = (nextValue) => {
    if (nextValue === "") {
      onChange?.("");
      return;
    }

    const nextQuantity = getValidQuantity(nextValue);

    onChange?.(nextQuantity);
  };

  const decrease = () => {
    if (disabled || quantity === "" || quantity <= minimum) {
      return;
    }

    updateQuantity(quantity - 1);
  };

  const increase = () => {
    if (disabled || quantity === "" || quantity >= maximum) {
      return;
    }

    updateQuantity(quantity + 1);
  };

  const handleInputChange = (event) => {
    const inputValue = event.target.value;

    if (inputValue === "") {
      updateQuantity("");
      return;
    }

    const numericValue = Number(inputValue);

    if (Number.isFinite(numericValue)) {
      updateQuantity(numericValue);
    }
  };

  const handleBlur = () => {
    if (quantity === "") {
      updateQuantity(minimum);
      return;
    }

    updateQuantity(quantity);
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
      {/* Decrease */}
      <button
        type="button"
        onClick={decrease}
        disabled={
          disabled ||
          quantity === "" ||
          quantity <= minimum
        }
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center text-lg font-medium text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        −
      </button>

      {/* Quantity Input */}
      <input
        type="number"
        min={minimum}
        max={maximum}
        value={quantity}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        aria-label="Quantity"
        className="h-10 w-14 border-x border-gray-300 bg-transparent text-center text-sm font-semibold text-gray-900 outline-none dark:border-gray-700 dark:text-black"
      />

      {/* Increase */}
      <button
        type="button"
        onClick={increase}
        disabled={
          disabled ||
          quantity === "" ||
          quantity >= maximum
        }
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center text-lg font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        +
      </button>
    </div>
  );
};



export default ProductQuantity;
