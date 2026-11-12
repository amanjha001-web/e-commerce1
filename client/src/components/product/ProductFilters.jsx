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
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
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
              className="text-xs font-bold text-[var(--primary)] hover:underline"
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
                className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#65565c] hover:text-[var(--primary)]"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(value)}
                  onChange={() =>
                    toggleValue("categories", value, selectedCategories)
                  }
                  className="h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)]"
                />

                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
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
              className="text-xs font-bold text-[var(--primary)] hover:underline"
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
                className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#65565c] hover:text-[var(--primary)]"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(value)}
                  onChange={() => toggleValue("brands", value, selectedBrands)}
                  className="h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)]"
                />

                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text)]">
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
            className="field w-full text-xs"
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
            className="field w-full text-xs"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text)]">
          Availability
        </h3>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#65565c] hover:text-[var(--primary)]">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={(event) =>
              onChange?.({
                ...filters,
                inStock: event.target.checked ? true : undefined,
              })
            }
            className="h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)]"
          />

          <span>In Stock Only</span>
        </label>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="outlinebtn w-full py-2 text-xs"
        >
          Reset Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="panel hidden w-full max-w-xs p-5 lg:block">
        <h2 className="mb-5 text-sm font-black uppercase tracking-wider text-[var(--text)]">
          Filters
        </h2>

        {filterContent}
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="outlinebtn text-xs"
        >
          Filters
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-[#1b0a11]/50 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />

            <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-black text-[var(--text)]">
                  Filters
                </h2>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="btnsm"
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



