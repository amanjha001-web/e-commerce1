import RatingStars from "./RatingStars";

const ReviewCard = ({ review, onHelpful, onReport }) => {
  if (!review) {
    return null;
  }

  const reviewer =
    review.user?.fullName ||
    review.user?.name ||
    review.userName ||
    review.name ||
    "Anonymous";

  const rating = Math.min(
    5,
    Math.max(0, Number(review.rating ?? review.stars ?? 0)),
  );

  const comment = review.comment || review.content || review.review || "";

  const createdAt = review.createdAt || review.date;

  const avatar =
    review.user?.avatar || review.user?.profileImage || review.avatar;

  const helpfulCount = Number(review.helpfulCount ?? review.helpful ?? 0) || 0;

  const isVerified =
    review.verifiedPurchase === true || review.isVerifiedPurchase === true;

  return (
    <article className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={reviewer}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {reviewer.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {reviewer}
            </h3>

            {createdAt && (
              <p className="text-xs text-gray-400">
                {new Date(createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <RatingStars rating={rating} size="sm" />
      </div>

      {/* Verified Purchase */}
      {isVerified && (
        <div className="mt-3">
          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ✓ Verified Purchase
          </span>
        </div>
      )}

      {/* Review */}
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

      {/* Images */}
      {review.images?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.images.map((image, index) => {
            const imageUrl =
              typeof image === "string" ? image : image?.url || image?.src;

            if (!imageUrl) {
              return null;
            }

            return (
              <img
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={`Review ${index + 1}`}
                loading="lazy"
                className="h-20 w-20 rounded-lg object-cover"
              />
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
        <button
          type="button"
          onClick={() => onHelpful?.(review)}
          className="text-xs font-medium text-gray-500 transition hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          👍 Helpful
          {helpfulCount > 0 && ` (${helpfulCount})`}
        </button>

        {onReport && (
          <button
            type="button"
            onClick={() => onReport(review)}
            className="text-xs font-medium text-gray-400 transition hover:text-red-500"
          >
            Report
          </button>
        )}
      </div>
    </article>
  );
};

export default ReviewCard;
