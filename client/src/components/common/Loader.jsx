const Loader = ({
  size = "md",
  text = "Loading...",
  fullScreen = false,
  showText = true,
  className = "",
}) => {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
    xl: "h-16 w-16 border-4",
  };

  const loader = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div
        className={`animate-spin rounded-full border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500 ${
          sizes[size] || sizes.md
        }`}
      />

      {showText && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;
