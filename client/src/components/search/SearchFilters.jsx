
import { useState } from "react";

const SearchFilters = ({
  filters = {},
  onChange,
  onApply,
  onReset,
  categories = [],
  brands = [],
  priceRange = {
    min: 0,
    max: 100000,
  },
  loading = false,
}) => {
  const getInitialFilters = () => ({
    category: filters.category || "",
    brand: filters.brand || "",
    minPrice: filters.minPrice ?? priceRange.min,
    maxPrice: filters.maxPrice ?? priceRange.max,
    rating: filters.rating || "",
    sort: filters.sort || "",
    ...filters,
  });

  const [localFilters, setLocalFilters] = useState(
    getInitialFilters,
  );

  const updateFilter = (key, value) => {
    setLocalFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onChange?.(localFilters);
    onApply?.(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      category: "",
      brand: "",
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      rating: "",
      sort: "",
    };

    setLocalFilters(resetFilters);

    onChange?.(resetFilters);
    onReset?.(resetFilters);
  };

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Filters
        </h2>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label
              htmlFor="search-category"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Category
            </label>

            <select
              id="search-category"
              value={localFilters.category}
              onChange={(event) =>
                updateFilter(
                  "category",
                  event.target.value,
                )
              }
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">All Categories</option>

              {categories.map((category, index) => {
                const value =
                  typeof category === "string"
                    ? category
                    : category?._id ||
                      category?.id ||
                      category?.slug ||
                      "";

                const label =
                  typeof category === "string"
                    ? category
                    : category?.name ||
                      category?.title ||
                      value;

                return (
                  <option
                    key={value || index}
                    value={value}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Brand */}
        {brands.length > 0 && (
          <div>
            <label
              htmlFor="search-brand"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Brand
            </label>

            <select
              id="search-brand"
              value={localFilters.brand}
              onChange={(event) =>
                updateFilter(
                  "brand",
                  event.target.value,
                )
              }
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">All Brands</option>

              {brands.map((brand, index) => {
                const value =
                  typeof brand === "string"
                    ? brand
                    : brand?._id ||
                      brand?.id ||
                      brand?.slug ||
                      "";

                const label =
                  typeof brand === "string"
                    ? brand
                    : brand?.name ||
                      brand?.title ||
                      value;

                return (
                  <option
                    key={value || index}
                    value={value}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Price */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Price Range
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={priceRange.min}
              max={priceRange.max}
              value={localFilters.minPrice}
              onChange={(event) =>
                updateFilter(
                  "minPrice",
                  event.target.value,
                )
              }
              placeholder="Min"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />

            <input
              type="number"
              min={priceRange.min}
              max={priceRange.max}
              value={localFilters.maxPrice}
              onChange={(event) =>
                updateFilter(
                  "maxPrice",
                  event.target.value,
                )
              }
              placeholder="Max"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label
            htmlFor="search-rating"
            className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Minimum Rating
          </label>

          <select
            id="search-rating"
            value={localFilters.rating}
            onChange={(event) =>
              updateFilter(
                "rating",
                event.target.value,
              )
            }
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Any Rating</option>
            <option value="4">⭐ 4 & above</option>
            <option value="3">⭐ 3 & above</option>
            <option value="2">⭐ 2 & above</option>
            <option value="1">⭐ 1 & above</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label
            htmlFor="search-sort"
            className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Sort By
          </label>

          <select
            id="search-sort"
            value={localFilters.sort}
            onChange={(event) =>
              updateFilter(
                "sort",
                event.target.value,
              )
            }
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Relevance</option>
            <option value="latest">Newest</option>
            <option value="price_asc">
              Price: Low to High
            </option>
            <option value="price_desc">
              Price: High to Low
            </option>
            <option value="rating">
              Highest Rated
            </option>
            <option value="popular">
              Most Popular
            </option>
          </select>
        </div>

        {/* Apply */}
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Applying..." : "Apply Filters"}
        </button>
      </div>
    </aside>
  );
};

export default SearchFilters;
