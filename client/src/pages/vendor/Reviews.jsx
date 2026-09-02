
import { useMemo, useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import RatingStars from "../../components/review/RatingStars";
import RatingSummary from "../../components/review/RatingSummary";
import ReviewList from "../../components/review/ReviewList";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const Reviews = ({
  user = null,
  reviews = [],
  loading = false,
  notificationCount = 0,

  onViewReview,
  onReplyReview,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const reviewText = String(
        review?.comment ||
          review?.review ||
          review?.content ||
          ""
      ).toLowerCase();

      const customerName = String(
        review?.user?.fullName ||
          review?.user?.name ||
          review?.customer?.fullName ||
          review?.customer?.name ||
          ""
      ).toLowerCase();

      const productName = String(
        review?.product?.name ||
          ""
      ).toLowerCase();

      const reviewRating = Number(
        review?.rating || 0
      );

      const matchesSearch =
        !keyword ||
        reviewText.includes(keyword) ||
        customerName.includes(keyword) ||
        productName.includes(keyword);

      const matchesRating =
        rating === "all" ||
        reviewRating === Number(rating);

      return (
        matchesSearch &&
        matchesRating
      );
    });
  }, [reviews, search, rating]);

  const ratingCounts = {
    5: reviews.filter(
      (review) =>
        Number(review?.rating) === 5
    ).length,
    4: reviews.filter(
      (review) =>
        Number(review?.rating) === 4
    ).length,
    3: reviews.filter(
      (review) =>
        Number(review?.rating) === 3
    ).length,
    2: reviews.filter(
      (review) =>
        Number(review?.rating) === 2
    ).length,
    1: reviews.filter(
      (review) =>
        Number(review?.rating) === 1
    ).length,
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (total, review) =>
            total +
            Number(
              review?.rating || 0
            ),
          0
        ) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorSidebar
        activeItem="reviews"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="lg:pl-64">
        <VendorHeader
          title="Reviews"
          subtitle="Monitor customer feedback and product ratings"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={onLogout}
          onProfileClick={() =>
            handleNavigate("profile")
          }
          onNotificationsClick={() =>
            handleNavigate("notifications")
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                Customer Reviews
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                See what customers are saying about your products.
              </p>
            </div>

            {/* Rating Overview */}
            <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Overall Rating
                  </p>

                  <p className="mt-2 text-5xl font-bold text-foreground">
                    {averageRating.toFixed(
                      1
                    )}
                  </p>

                  <div className="mt-3 flex justify-center">
                    <RatingStars
                      rating={averageRating}
                    />
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    Based on {reviews.length}{" "}
                    review
                    {reviews.length !==
                    1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <RatingSummary
                  averageRating={
                    averageRating
                  }
                  totalReviews={
                    reviews.length
                  }
                  ratingCounts={
                    ratingCounts
                  }
                />
              </div>
            </section>

            {/* Filters */}
            <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search reviews, customers or products..."
                />

                <Select
                  value={rating}
                  onChange={(event) =>
                    setRating(
                      event.target.value
                    )
                  }
                  options={[
                    {
                      label: "All Ratings",
                      value: "all",
                    },
                    {
                      label: "5 Stars",
                      value: "5",
                    },
                    {
                      label: "4 Stars",
                      value: "4",
                    },
                    {
                      label: "3 Stars",
                      value: "3",
                    },
                    {
                      label: "2 Stars",
                      value: "2",
                    },
                    {
                      label: "1 Star",
                      value: "1",
                    },
                  ]}
                />
              </div>
            </section>

            {/* Reviews */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Reviews
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {filteredReviews.length}{" "}
                      review
                      {filteredReviews.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      found
                    </p>
                  </div>

                  {onViewReview && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        onViewReview?.(
                          filteredReviews
                        )
                      }
                    >
                      View All
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader />
                </div>
              ) : filteredReviews.length ===
                0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No reviews found"
                    description={
                      search ||
                      rating !== "all"
                        ? "Try changing your search or rating filter."
                        : "Customer reviews will appear here once customers review your products."
                    }
                  />
                </div>
              ) : (
                <div className="p-4 sm:p-6">
                  <ReviewList
                    reviews={
                      filteredReviews
                    }
                    onReplyReview={
                      onReplyReview
                    }
                    onViewReview={
                      onViewReview
                    }
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reviews;