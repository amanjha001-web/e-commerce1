import { useState } from "react";

const ProductFilters = ({
  filters = {},
  categories = [],
  brands = [],
  onChange,
  onReset,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedCategories = filters.categories || [];

  const selectedBrands = filters.brands || [];

  const minPrice = filters.minPrice ?? "";

  const maxPrice = filters.maxPrice ?? "";

  const toggleValue = (key, value, currentValues) => {
    const exists = currentValues.includes(value);

    const nextValues = exists
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    onChange?.({
      ...filters,
      [key]: nextValues,
    });
  };

  const filterContent = (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Categories
          </h3>

          {selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange?.({
                  ...filters,
                  categories: [],
                })
              }
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-2">
          {categories.map((category) => {
            const value =
              category._id || category.id || category.slug || category.value;

            const label =
              category.name || category.title || category.label || "Category";

            return (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(value)}
                  onChange={() =>
                    toggleValue("categories", value, selectedCategories)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Brands
          </h3>

          {selectedBrands.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange?.({
                  ...filters,
                  brands: [],
                })
              }
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear
            </button>
          )}
        </div>

        <div className="max-h-48 space-y-2 overflow-y-auto">
          {brands.map((brand) => {
            const value = brand._id || brand.id || brand.slug || brand.value;

            const label = brand.name || brand.title || brand.label || "Brand";

            return (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(value)}
                  onChange={() => toggleValue("brands", value, selectedBrands)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Price Range
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) =>
              onChange?.({
                ...filters,
                minPrice: event.target.value,
              })
            }
            placeholder="Min"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) =>
              onChange?.({
                ...filters,
                maxPrice: event.target.value,
              })
            }
            placeholder="Max"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Availability
        </h3>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={(event) =>
              onChange?.({
                ...filters,
                inStock: event.target.checked ? true : undefined,
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />

          <span>In Stock Only</span>
        </label>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Reset Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden w-full max-w-xs rounded-xl border border-gray-200 bg-white p-5 lg:block dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">
          Filters
        </h2>

        {filterContent}
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        >
          Filters
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />

            <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white p-5 dark:bg-gray-900">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filters
                </h2>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>

              {filterContent}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductFilters;
