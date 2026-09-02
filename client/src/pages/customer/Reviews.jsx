
import { useMemo, useState } from "react";

import RatingSummary from "../../components/review/RatingSummary";
import RatingStars from "../../components/review/RatingStars";
import ReviewList from "../../components/review/ReviewList";
import ReviewForm from "../../components/review/ReviewForm";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const Reviews = ({
  reviews = [],
  products = [],
  loading = false,
  submitting = false,
  onSubmitReview,
  onDeleteReview,
  onEditReview,
  onProductSelect,
  onNavigate,
}) => {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const rating = Number(
        review?.rating ||
          review?.stars ||
          0
      );

      const productName =
        review?.product?.name ||
        review?.product?.title ||
        review?.productName ||
        "";

      const reviewText =
        review?.comment ||
        review?.review ||
        review?.content ||
        "";

      const matchesRating =
        ratingFilter === "all" ||
        rating === Number(ratingFilter);

      const matchesSearch =
        !keyword ||
        String(productName)
          .toLowerCase()
          .includes(keyword) ||
        String(reviewText)
          .toLowerCase()
          .includes(keyword);

      return matchesRating && matchesSearch;
    });
  }, [reviews, search, ratingFilter]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;

    const total = reviews.reduce(
      (sum, review) =>
        sum +
        Number(
          review?.rating ||
            review?.stars ||
            0
        ),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const handleSubmit = (data) => {
    onSubmitReview?.(data);
    setShowForm(false);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Reviews
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage your product reviews and share your experience.
          </p>
        </div>

        <Button
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? "Close Review Form" : "Write a Review"}
        </Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">
            Write a Review
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Share your experience with a product you purchased.
          </p>

          <div className="mt-5">
            <ReviewForm
              products={products}
              onSubmit={handleSubmit}
              loading={submitting}
            />
          </div>
        </section>
      )}

      {/* Rating Overview */}
      <section className="mb-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Overall Rating
          </p>

          <p className="mt-2 text-4xl font-bold">
            {averageRating.toFixed(1)}
          </p>

          <div className="mt-3 flex justify-center">
            <RatingStars rating={averageRating} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Based on {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <RatingSummary
            reviews={reviews}
            rating={averageRating}
          />
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search your reviews..."
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setRatingFilter("all")}
              className={[
                "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition",
                ratingFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              All
            </button>

            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() =>
                  setRatingFilter(String(rating))
                }
                className={[
                  "flex shrink-0 items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition",
                  ratingFilter === String(rating)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span>{rating}</span>
                <span>★</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <Loader />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={
                search || ratingFilter !== "all"
                  ? "No matching reviews"
                  : "No reviews yet"
              }
              description={
                search || ratingFilter !== "all"
                  ? "Try changing your search or rating filter."
                  : "Your product reviews will appear here."
              }
            />

            {!search && ratingFilter === "all" && (
              <div className="mt-5 flex justify-center">
                <Button
                  onClick={() => setShowForm(true)}
                >
                  Write Your First Review
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <ReviewList
              reviews={filteredReviews}
              onDelete={onDeleteReview}
              onEdit={onEditReview}
              onProductSelect={onProductSelect}
            />
          </div>
        )}
      </section>

      {/* Footer Navigation */}
      <div className="mt-8 flex justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate?.("/")}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Home
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.("/orders")}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          My Orders →
        </button>
      </div>
    </main>
  );
};

export default Reviews;
