const ProductBadge = ({ type, text, className = "" }) => {
  const normalizedType = String(type || "").toLowerCase();

  const badgeConfig = {
    sale: {
      label: "Sale",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    discount: {
      label: "Discount",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    new: {
      label: "New",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    featured: {
      label: "Featured",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    bestseller: {
      label: "Bestseller",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500",
    },
    out_of_stock: {
      label: "Out of Stock",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    limited: {
      label: "Limited",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
  };

  const config = badgeConfig[normalizedType];

  if (!config && !text) {
    return null;
  }

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        config?.className ||
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      } ${className}`}
    >
      {text || config.label}
    </span>
  );
};

export default ProductBadge;
