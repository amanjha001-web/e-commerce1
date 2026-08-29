import { forwardRef } from "react";

const Button = forwardRef(
  (
    {
      children,
      type = "button",
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",

      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700",

      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",

      success:
        "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",

      outline:
        "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800",

      ghost:
        "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400 dark:text-gray-200 dark:hover:bg-gray-800",

      link: "bg-transparent text-blue-600 hover:text-blue-700 hover:underline focus:ring-0",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-3 text-base",
      xl: "px-6 py-3.5 text-lg",
    };

    const width = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${width} ${className}`}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}

        {loading ? "Please wait..." : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
