import ReviewCard from "./ReviewCard";

const ReviewList = ({
  reviews = [],
  loading = false,
  onHelpful,
  onReport,
  onWriteReview,
  emptyMessage = "No reviews found.",
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-xl border border-gray-200 p-5 dark:border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-2 w-20 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            <div className="mt-4 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />

            <div className="mt-2 h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Reviews
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
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

      {/* Review List */}
      {!reviews.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center dark:border-gray-700">
          <div className="text-4xl">⭐</div>

          <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
            No reviews yet
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </p>

          {onWriteReview && (
            <button
              type="button"
              onClick={onWriteReview}
              className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Be the first to review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review?._id || review?.id || index}
              review={review}
              onHelpful={onHelpful}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ReviewList;
