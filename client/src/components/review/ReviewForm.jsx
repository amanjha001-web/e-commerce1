import { useState } from "react";
import RatingStars from "./RatingStars";

const ReviewForm = ({ onSubmit, loading = false, initialData = {} }) => {
  const [rating, setRating] = useState(Number(initialData.rating) || 0);

  const [title, setTitle] = useState(initialData.title || "");

  const [comment, setComment] = useState(
    initialData.comment || initialData.content || "",
  );

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (rating < 1) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    const reviewData = {
      rating,
      title: title.trim(),
      comment: comment.trim(),
    };

    try {
      await onSubmit?.(reviewData);
    } catch (submitError) {
      setError(submitError?.message || "Failed to submit review.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Write a Review
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Share your experience with this product.
        </p>
      </div>

      {/* Rating */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Your Rating
        </label>

        <RatingStars
          rating={rating}
          interactive
          size="lg"
          onChange={setRating}
        />

        {rating > 0 && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You selected {rating} {rating === 1 ? "star" : "stars"}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="review-title"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Review Title
        </label>

        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="review-comment"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Your Review
        </label>

        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What did you like or dislike about this product?"
          rows={5}
          maxLength={1000}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />

        <div className="mt-1 text-right text-xs text-gray-400">
          {comment.length}/1000
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
};

export default ReviewForm;
