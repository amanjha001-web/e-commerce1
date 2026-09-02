
import { useMemo, useState } from "react";

import WishlistGrid from "../../components/wishlist/WishlistGrid";
import WishlistEmpty from "../../components/wishlist/WishlistEmpty";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const Wishlist = ({
  wishlist = [],
  loading = false,
  actionLoading = false,
  onRemove,
  onAddToCart,
  onProductSelect,
  onNavigate,
}) => {
  const [search, setSearch] = useState("");

  const filteredWishlist = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return wishlist;

    return wishlist.filter((item) => {
      const product = item?.product || item;

      const name =
        product?.name ||
        product?.title ||
        "";

      const brand =
        product?.brand?.name ||
        product?.brand ||
        "";

      const category =
        product?.category?.name ||
        product?.category ||
        "";

      return (
        String(name)
          .toLowerCase()
          .includes(keyword) ||
        String(brand)
          .toLowerCase()
          .includes(keyword) ||
        String(category)
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [wishlist, search]);

  const handleRemove = (item) => {
    onRemove?.(item);
  };

  const handleAddToCart = (item) => {
    onAddToCart?.(item);
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Wishlist
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Save your favorite products and come back to them anytime.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => onNavigate?.("/products")}
        >
          Continue Shopping
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Saved Products
          </p>

          <p className="mt-2 text-2xl font-bold">
            {wishlist.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Showing
          </p>

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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
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
          <WishlistEmpty
            onShopNow={() => onNavigate?.("/products")}
          />
        ) : filteredWishlist.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="No products found"
              description="No wishlist products match your search."
            />

            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            </div>
          </div>
        ) : (
          <WishlistGrid
            wishlist={filteredWishlist}
            products={filteredWishlist}
            loading={actionLoading}
            onRemove={handleRemove}
            onAddToCart={handleAddToCart}
            onProductSelect={onProductSelect}
          />
        )}
      </section>

      {/* Bottom Navigation */}
      <div className="mt-8 flex flex-wrap justify-between gap-4">
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

export default Wishlist;
