
import { useMemo, useState } from "react";

import ProductFilters from "../../components/product/ProductFilters";
import ProductGrid from "../../components/product/ProductGrid";
import ProductSort from "../../components/product/ProductSort";

import SearchBar from "../../components/search/SearchBar";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";

const Products = ({
  products = [],
  categories = [],
  brands = [],
  loading = false,
  pagination = {},
  onFilter,
  onSort,
  onSearch,
  onPageChange,
  onProductSelect,
  onAddToCart,
  onToggleWishlist,
  onNavigate,
}) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter((product) => {
      const name = product?.name || product?.title || "";
      const brand =
        product?.brand?.name || product?.brand || "";
      const category =
        product?.category?.name ||
        product?.category ||
        "";

      return (
        String(name).toLowerCase().includes(keyword) ||
        String(brand).toLowerCase().includes(keyword) ||
        String(category).toLowerCase().includes(keyword)
      );
    });
  }, [products, search]);

  const handleSearch = (value) => {
    setSearch(value);
    onSearch?.(value);
  };

  const handleSort = (value) => {
    setSort(value);
    onSort?.(value);
  };

  const totalPages =
    pagination?.totalPages ||
    pagination?.pages ||
    1;

  const currentPage =
    pagination?.currentPage ||
    pagination?.page ||
    1;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Shop
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            All Products
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Discover products from trusted sellers across
            different categories.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => onNavigate?.("/categories")}
        >
          Browse Categories
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={handleSearch}
          onSearch={handleSearch}
          placeholder="Search products..."
        />
      </div>

      {/* Mobile Filter Button */}
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} products
        </p>

        <Button
          variant="outline"
          onClick={() => setFiltersOpen((value) => !value)}
        >
          {filtersOpen ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Filters */}
        <aside
          className={[
            filtersOpen ? "block" : "hidden",
            "lg:block",
          ].join(" ")}
        >
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">
                Filters
              </h2>

              <button
                type="button"
                onClick={() => onFilter?.({})}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear
              </button>
            </div>

            <ProductFilters
              categories={categories}
              brands={brands}
              onFilter={onFilter}
            />
          </div>
        </aside>

        {/* Product Content */}
        <section className="min-w-0">
          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "Product"
                  : "Products"}
              </p>

              {search && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Search results for "{search}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:block">
                Sort by
              </span>

              <ProductSort
                value={sort}
                onChange={handleSort}
              />
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-border bg-card">
              <Loader />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <EmptyState
                title="No products found"
                description={
                  search
                    ? "Try a different search term or change your filters."
                    : "There are no products available for the selected filters."
                }
              />

              <div className="mt-5 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSort("default");
                    onFilter?.({});
                    onSearch?.("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
              onProductSelect={onProductSelect}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          )}

          {/* Pagination */}
          {!loading &&
            filteredProducts.length > 0 &&
            totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            )}
        </section>
      </div>

      {/* Back */}
      <button
        type="button"
        onClick={() => onNavigate?.("/")}
        className="mt-8 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Home
      </button>
    </main>
  );
};

export default Products;
