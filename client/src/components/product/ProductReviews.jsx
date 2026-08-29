import { useMemo } from "react";

const ProductReviews = ({ reviews = [], loading = false, onWriteReview }) => {
  const reviewStats = useMemo(() => {
    const total = reviews.length;

    if (!total) {
      return {
        total: 0,
        average: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRating = 0;

    reviews.forEach((review) => {
      const rating = Math.min(
        5,
        Math.max(1, Math.round(Number(review.rating ?? review.stars ?? 0))),
      );

      if (distribution[rating] !== undefined) {
        distribution[rating] += 1;
      }

      totalRating += rating;
    });

    return {
      total,
      average: totalRating / total,
      distribution,
    };
  }, [reviews]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-xl border border-gray-200 p-4 dark:border-gray-800"
          >
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Customer Reviews
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {reviewStats.total} {reviewStats.total === 1 ? "review" : "reviews"}
          </p>
        </div>

        {onWriteReview && (
          <button
            type="button"
            onClick={onWriteReview}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="grid gap-6 rounded-xl border border-gray-200 p-5 md:grid-cols-[180px_1fr] dark:border-gray-800">
        <div className="flex flex-col items-center justify-center border-b pb-5 md:border-b-0 md:border-r md:pb-0 dark:border-gray-800">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {reviewStats.average.toFixed(1)}
          </span>

          <div className="mt-2 text-lg tracking-wide text-yellow-400">
            {"★".repeat(Math.round(reviewStats.average))}
            <span className="text-gray-300 dark:text-gray-700">
              {"★".repeat(5 - Math.round(reviewStats.average))}
            </span>
          </div>

          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Based on {reviewStats.total} reviews
          </span>
        </div>

        {/* Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviewStats.distribution[rating];

            const percentage =
              reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <span className="w-10 text-gray-600 dark:text-gray-400">
                  {rating} ★
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <span className="w-8 text-right text-xs text-gray-500 dark:text-gray-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews */}
      {!reviews.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <div className="text-4xl">⭐</div>

          <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
            No reviews yet
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Be the first customer to review this product.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => {
            const reviewRating = Math.min(
              5,
              Math.max(0, Number(review.rating ?? review.stars ?? 0)),
            );

            const reviewer =
              review.user?.fullName ||
              review.user?.name ||
              review.userName ||
              review.name ||
              "Anonymous";

            const comment =
              review.comment || review.content || review.review || "";

            const date = review.createdAt || review.date;

            return (
              <article
                key={review._id || review.id || index}
                className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {reviewer.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {reviewer}
                      </h3>

                      {date && (
                        <p className="text-xs text-gray-400">
                          {new Date(date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm tracking-wide text-yellow-400">
                    {"★".repeat(Math.round(reviewRating))}
                    <span className="text-gray-300 dark:text-gray-700">
                      {"★".repeat(5 - Math.round(reviewRating))}
                    </span>
                  </div>
                </div>

                {review.title && (
                  <h4 className="mt-4 font-semibold text-gray-900 dark:text-white">
                    {review.title}
                  </h4>
                )}

                {comment && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {comment}
                  </p>
                )}

                {review.verifiedPurchase && (
                  <span className="mt-3 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    ✓ Verified Purchase
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
