
import { useMemo, useState } from "react";

import ProductGrid from "../../components/product/ProductGrid";
import ProductSort from "../../components/product/ProductSort";
import SearchBar from "../../components/search/SearchBar";

import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";

const Categories = ({
  categories = [],
  products = [],
  selectedCategory = null,
  loading = false,
  productsLoading = false,
  pagination = {},
  sort = "latest",
  search = "",
  onCategorySelect,
  onSearch,
  onSortChange,
  onPageChange,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  onNavigate,
}) => {
  const [activeCategory, setActiveCategory] =
    useState(selectedCategory);

  const currentCategoryId =
    activeCategory?._id || activeCategory?.id;

  const filteredProducts = useMemo(() => {
    if (!currentCategoryId) return products;

    return products.filter((product) => {
      const category =
        product.category || product.categoryId;

      const categoryId =
        typeof category === "object"
          ? category?._id || category?.id
          : category;

      return String(categoryId) === String(currentCategoryId);
    });
  }, [products, currentCategoryId]);

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    onCategorySelect?.(category);
  };

  const totalPages =
    pagination?.totalPages ||
    Math.ceil(
      (pagination?.total || filteredProducts.length) /
        (pagination?.limit || 12)
    );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Shop by Category
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Categories
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Explore products from your favorite categories.
        </p>
      </div>

      {/* Categories */}
      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <Loader />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8">
          <EmptyState
            title="No categories available"
            description="Categories will appear here once they are added."
          />
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category) => {
            const id = category._id || category.id;

            const active =
              String(id) === String(currentCategoryId);

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className={[
                  "group overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition",
                  active
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:-translate-y-0.5 hover:border-primary/40",
                ].join(" ")}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name || "Category"}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
                      {category.name
                        ?.charAt(0)
                        ?.toUpperCase() || "C"}
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="truncate text-sm font-semibold">
                    {category.name || "Category"}
                  </p>

                  {category.productCount !== undefined && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.productCount} products
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Category */}
      <section>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {activeCategory?.name || "All Products"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {activeCategory
                ? `Browse products in ${activeCategory.name}.`
                : "Browse all available products."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar
              value={search}
              onChange={onSearch}
              placeholder="Search products..."
            />

            <ProductSort
              value={sort}
              onChange={onSortChange}
            />
          </div>
        </div>

        {/* Products */}
        {productsLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <EmptyState
              title="No products found"
              description={
                search
                  ? "Try changing your search term."
                  : "There are no products in this category yet."
              }
            />
          </div>
        ) : (
          <>
            <ProductGrid
              products={filteredProducts}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={pagination?.page || 1}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Back */}
      <button
        type="button"
        onClick={() => onNavigate?.("/")}
        className="mt-10 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Home
      </button>
    </main>
  );
};

export default Categories;