const ProductSort = ({
  value = "latest",
  onChange,
  options = [],
  className = "",
}) => {
  const defaultOptions = [
    {
      value: "latest",
      label: "Newest",
    },
    {
      value: "popular",
      label: "Most Popular",
    },
    {
      value: "price_asc",
      label: "Price: Low to High",
    },
    {
      value: "price_desc",
      label: "Price: High to Low",
    },
    {
      value: "rating",
      label: "Highest Rated",
    },
    {
      value: "name_asc",
      label: "Name: A to Z",
    },
    {
      value: "name_desc",
      label: "Name: Z to A",
    },
  ];

  const sortOptions = options.length > 0 ? options : defaultOptions;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        htmlFor="product-sort"
        className="whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300"
      >
        Sort by:
      </label>

      <select
        id="product-sort"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProductSort;
