const RatingStars = ({
  rating = 0,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false,
  className = "",
}) => {
  const numericRating = Math.min(maxRating, Math.max(0, Number(rating) || 0));

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  const handleClick = (value) => {
    if (!interactive) return;

    onChange?.(value);
  };

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role={interactive ? "radiogroup" : undefined}
      aria-label={`Rating ${numericRating} out of ${maxRating}`}
    >
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;

          const fillPercentage = Math.min(
            100,
            Math.max(0, (numericRating - index) * 100),
          );

          if (interactive) {
            return (
              <button
                key={starValue}
                type="button"
                onClick={() => handleClick(starValue)}
                role="radio"
                aria-checked={numericRating === starValue}
                aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                className={`relative ${starSize} leading-none transition hover:scale-110`}
              >
                <span className="text-gray-300 dark:text-gray-700">★</span>

                {fillPercentage > 0 && (
                  <span
                    className="absolute left-0 top-0 overflow-hidden whitespace-nowrap"
                    style={{
                      width: `${fillPercentage}%`,
                    }}
                  >
                    <span className="text-yellow-400">★</span>
                  </span>
                )}
              </button>
            );
          }

          return (
            <span
              key={starValue}
              className={`relative ${starSize} leading-none`}
              aria-hidden="true"
            >
              <span className="text-gray-300 dark:text-gray-700">★</span>

              {fillPercentage > 0 && (
                <span
                  className="absolute left-0 top-0 overflow-hidden whitespace-nowrap"
                  style={{
                    width: `${fillPercentage}%`,
                  }}
                >
                  <span className="text-yellow-400">★</span>
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {numericRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
