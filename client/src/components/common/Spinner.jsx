const Spinner = ({ size = "md", className = "", label = "Loading" }) => {
  const sizes = {
    xs: "h-3 w-3 border-2",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-4",
    xl: "h-10 w-10 border-4",
  };

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <span
        className={`animate-spin rounded-full border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500 ${
          sizes[size] || sizes.md
        }`}
      />

      <span className="sr-only">{label}</span>
    </span>
  );
};

export default Spinner;
