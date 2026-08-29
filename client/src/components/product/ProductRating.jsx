const ProductRating = ({
  rating = 0,
  reviewCount = 0,
  showCount = true,
  size = "md",
  className = "",
}) => {
  const numericRating = Math.min(5, Math.max(0, Number(rating) || 0));

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      aria-label={`Rating ${numericRating.toFixed(1)} out of 5`}
    >
      <div
        className={`flex items-center gap-0.5 ${starSize}`}
        aria-hidden="true"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fillPercentage = Math.min(
            100,
            Math.max(0, (numericRating - (star - 1)) * 100),
          );

          return (
            <span key={star} className="relative inline-block leading-none">
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

      <span
        className={`font-medium text-gray-700 dark:text-gray-300 ${starSize}`}
      >
        {numericRating.toFixed(1)}
      </span>

      {showCount && (
        <span className="text-xs text-gray-400">
          ({Number(reviewCount) || 0} reviews)
        </span>
      )}
    </div>
  );
};

export default ProductRating;
