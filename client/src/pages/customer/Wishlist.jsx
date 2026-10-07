import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import WishlistGrid from "../../components/wishlist/WishlistGrid";
import WishlistEmpty from "../../components/wishlist/WishlistEmpty";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

import {
  fetchWishlist,
  removeWishlistProduct,
  clearWishlistProducts,
} from "../../store/slices/wishlistThunk.js";

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const {
    items: wishlist,
    loading,
    actionLoading,
  } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const filteredWishlist = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return wishlist;
    }

    return wishlist.filter((item) => {
      const product = item?.product || item;

      const name = product?.name || product?.title || "";

      const brand = product?.brand?.name || product?.brand || "";

      const category = product?.category?.name || product?.category || "";

      return (
        String(name).toLowerCase().includes(keyword) ||
        String(brand).toLowerCase().includes(keyword) ||
        String(category).toLowerCase().includes(keyword)
      );
    });
  }, [wishlist, search]);

  // =========================
  // Remove Wishlist Product
  // =========================

  const handleRemove = (item) => {
    const product = item?.product || item;

    const productId = product?._id || product?.id || item?.productId;

    if (!productId) {
      return;
    }

    dispatch(removeWishlistProduct(productId));
  };

  // =========================
  // Clear Entire Wishlist
  // =========================

  const handleClearWishlist = () => {
    if (!wishlist.length || actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear your entire wishlist?",
    );

    if (!confirmed) {
      return;
    }

    dispatch(clearWishlistProducts());
  };

  // =========================
  // Product Details
  // =========================

  const handleProductClick = (product) => {
    const productId = product?._id || product?.id || product?.slug;

    if (!productId) {
      return;
    }

    navigate(`/products/${productId}`);
  };

  // =========================
  // Add To Cart
  // =========================
  // Cart API integration baad me connect karenge.

  const handleAddToCart = (product) => {
    console.log("Add to cart:", product);
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Account</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Wishlist
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Save your favorite products and come back to them anytime.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/products")}
            className="border-gray-300 bg-white px-5 py-2.5 text-gray-900 shadow-sm hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            Continue Shopping
          </Button>

          {wishlist.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearWishlist}
              disabled={actionLoading}
              className="border-red-300 bg-red-50 px-5 py-2.5 text-red-600 shadow-sm hover:bg-red-100 hover:text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              {actionLoading ? "Clearing..." : "Clear Wishlist"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Saved Products</p>

          <p className="mt-2 text-2xl font-bold">{wishlist.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Showing</p>

          <p className="mt-2 text-2xl font-bold text-primary">
            {filteredWishlist.length}
          </p>
        </div>
      </div>

      {/* Search */}
      {wishlist.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-md">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search wishlist..."
              />
            </div>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="self-start text-sm font-medium text-primary hover:underline sm:self-auto"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}

      {/* Wishlist */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <Loader />
          </div>
        ) : wishlist.length === 0 ? (
          <WishlistEmpty onContinueShopping={() => navigate("/products")} />
        ) : filteredWishlist.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="No products found"
              description="No wishlist products match your search."
            />

            <div className="mt-5 flex justify-center">
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            </div>
          </div>
        ) : (
          <WishlistGrid
            items={filteredWishlist}
            loading={actionLoading}
            onRemove={handleRemove}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClick}
          />
        )}
      </section>

      {/* Bottom Navigation */}
      <div className="mt-8 flex flex-wrap justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Home
        </button>

        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          My Orders →
        </button>
      </div>
    </main>
  );
};

export default Wishlist;
