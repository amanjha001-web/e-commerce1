

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  category: "all",
  vendor: "all",
  stock: "all",
  sort: "newest",
};

const ProductFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  loading = false,
}) => {
  const currentFilters = {
    ...DEFAULT_FILTERS,
    ...filters,
  };

  const handleChange = (key, value) => {
    const updatedFilters = {
      ...currentFilters,
      [key]: value,
    };

    onFilterChange?.(key, value, updatedFilters);
  };

  const handleSearch = (event) => {
    handleChange("search", event.target.value);
  };

  const handleReset = () => {
    onReset?.(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    Boolean(currentFilters.search) ||
    currentFilters.status !== "all" ||
    currentFilters.category !== "all" ||
    currentFilters.vendor !== "all" ||
    currentFilters.stock !== "all" ||
    currentFilters.sort !== "newest";

  return (
    <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Product Filters
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Search and filter products by status, category, vendor and stock.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="self-start rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label
          htmlFor="product-search"
          className="mb-1.5 block text-xs font-medium text-foreground"
        >
          Search
        </label>

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-4-4" />
          </svg>

          <input
            id="product-search"
            type="search"
            value={currentFilters.search}
            onChange={handleSearch}
            disabled={loading}
            placeholder="Search by product name, SKU..."
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Status */}
        <div>
          <label
            htmlFor="product-status"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Status
          </label>

          <select
            id="product-status"
            value={currentFilters.status}
            onChange={(event) => handleChange("status", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="product-category"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Category
          </label>

          <select
            id="product-category"
            value={currentFilters.category}
            onChange={(event) => handleChange("category", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home & Living</option>
            <option value="beauty">Beauty</option>
            <option value="grocery">Grocery</option>
            <option value="sports">Sports</option>
            <option value="books">Books</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Vendor */}
        <div>
          <label
            htmlFor="product-vendor"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Vendor
          </label>

          <select
            id="product-vendor"
            value={currentFilters.vendor}
            onChange={(event) => handleChange("vendor", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Vendors</option>
            <option value="active">Active Vendors</option>
            <option value="pending">Pending Vendors</option>
            <option value="suspended">Suspended Vendors</option>
            <option value="blocked">Blocked Vendors</option>
          </select>
        </div>

        {/* Stock */}
        <div>
          <label
            htmlFor="product-stock"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Stock
          </label>

          <select
            id="product-stock"
            value={currentFilters.stock}
            onChange={(event) => handleChange("stock", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label
            htmlFor="product-sort"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Sort By
          </label>

          <select
            id="product-sort"
            value={currentFilters.sort}
            onChange={(event) => handleChange("sort", event.target.value)}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="price_low">Price Low to High</option>
            <option value="price_high">Price High to Low</option>
            <option value="stock_low">Stock Low to High</option>
            <option value="stock_high">Stock High to Low</option>
          </select>
        </div>
      </div>

      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            ✓
          </span>

          <p className="text-xs text-muted-foreground">
            Filters are currently active.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
