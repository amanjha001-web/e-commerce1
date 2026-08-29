const Badge = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",

    primary: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",

    success:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",

    danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",

    warning:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",

    info: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",

    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",

    orange:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const dotColors = {
    default: "bg-gray-500",
    primary: "bg-blue-500",
    success: "bg-green-500",
    danger: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-cyan-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}

      {children}
    </span>
  );
};

export default Badge;
