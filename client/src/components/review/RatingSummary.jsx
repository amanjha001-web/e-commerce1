import RatingStars from "./RatingStars";

const RatingSummary = ({
  rating = 0,
  totalReviews = 0,
  distribution = {},
  loading = false,
}) => {
  const numericRating = Math.min(5, Math.max(0, Number(rating) || 0));

  const total = Number(totalReviews) || 0;

  const getCount = (star) => {
    return Number(distribution?.[star]) || 0;
  };

  const getPercentage = (star) => {
    if (!total) return 0;

    return Math.round((getCount(star) / total) * 100);
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 p-5 dark:border-gray-800">
        <div className="grid gap-6 md:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3">
                <div className="h-3 w-8 rounded bg-gray-200 dark:bg-gray-700" />

                <div className="h-2 flex-1 rounded bg-gray-200 dark:bg-gray-700" />

                <div className="h-3 w-6 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center border-b pb-5 md:border-b-0 md:border-r md:pb-0 dark:border-gray-800">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {numericRating.toFixed(1)}
          </span>

          <RatingStars rating={numericRating} size="md" />

          <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {total.toLocaleString("en-IN")} {total === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = getCount(star);

            const percentage = getPercentage(star);

            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-10 shrink-0 font-medium text-gray-600 dark:text-gray-400">
                  {star} ★
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingSummary;
