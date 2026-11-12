import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import ProductFilters from "../../components/product/ProductFilters";
import ProductGrid from "../../components/product/ProductGrid";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";

import { fetchProducts } from "../../store/slices/productThunk.js";
import { addCartProduct } from "../../store/slices/cartThunk.js";

import {
  setFilter,
  setPage,
  clearFilters,
} from "../../store/slices/productSlice.js";

import {
  fetchWishlist,
  addWishlistProduct,
  removeWishlistProduct,
} from "../../store/slices/wishlistThunk.js";

const DEFAULT_CATEGORIES = [
  "Fashion",
  "Electronics",
  "Home & Living",
  "Beauty",
  "Accessories",
];

const Products = ({
  categories = [],
  brands = [],
  onProductSelect,
  onAddToCart,
  onNavigate,
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDealsView = searchParams.get("deals") === "true";

  const handleAddToCart = async (product) => {
    const productId = product?._id || product?.id;

    if (!productId) {
      console.error("Product ID is missing");
      return;
    }

    if (onAddToCart) {
      await onAddToCart(product);
      return;
    }

    const result = await dispatch(addCartProduct(productId, 1));

    if (!result?.success) {
      console.error(result?.message || "Failed to add product");
      return;
    }

    toast.success("Added to cart");
  };

  const {
    products = [],
    loading = false,
    error = null,
    filters = {},
    pagination = {},
  } = useSelector((state) => state.product);

  const { items: wishlist = [], actionLoading: wishlistActionLoading = false } =
    useSelector((state) => state.wishlist);

  const [search, setSearch] = useState(filters.search || "");
  const [sort, setSort] = useState(filters.sort || "latest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /*
   * Wishlist Product IDs
   */
  const wishlistIds = useMemo(() => {
    return wishlist
      .map((item) => {
        const product = item?.product || item;

        return product?._id || product?.id || item?.productId || null;
      })
      .filter(Boolean);
  }, [wishlist]);

  /*
   * Sync category query param if present
   */
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory && urlCategory !== filters.category) {
      dispatch(setFilter({ name: "category", value: urlCategory }));
    }
  }, [searchParams, dispatch, filters.category]);

  /*
   * Fetch Products
   */
  useEffect(() => {
    dispatch(
      fetchProducts({
        page: pagination.page || 1,
        limit: pagination.limit || 12,

        search: filters.search || "",
        category: filters.category || "",
        brand: filters.brand || "",

        minPrice: filters.minPrice || "",
        maxPrice: filters.maxPrice || "",

        rating: filters.rating || "",

        sortBy: filters.sort || "latest",
      }),
    );
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters.search,
    filters.category,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
    filters.rating,
    filters.sort,
  ]);

  /*
   * Fetch Wishlist
   */
  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  /*
   * Search
   */
  const handleSearch = (value) => {
    setSearch(value);

    dispatch(
      setFilter({
        name: "search",
        value,
      }),
    );
  };

  /*
   * Category Filter
   */
  const handleCategoryChange = (value) => {
    const normalized = value === "All" ? "" : value;
    dispatch(
      setFilter({
        name: "category",
        value: normalized,
      }),
    );
    if (!normalized && searchParams.has("category")) {
      const next = new URLSearchParams(searchParams);
      next.delete("category");
      setSearchParams(next);
    }
  };

  /*
   * Sort
   */
  const handleSort = (value) => {
    setSort(value);

    dispatch(
      setFilter({
        name: "sort",
        value,
      }),
    );
  };

  /*
   * Filters
   */
  const handleFilter = (filterData) => {
    if (!filterData || Object.keys(filterData).length === 0) {
      dispatch(clearFilters());

      setSearch("");
      setSort("latest");

      return;
    }

    Object.entries(filterData).forEach(([name, value]) => {
      dispatch(
        setFilter({
          name,
          value,
        }),
      );
    });
  };

  /*
   * Pagination
   */
  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  /*
   * Wishlist
   */
  const handleWishlist = (product) => {
    const productId = product?._id || product?.id || product?.slug;

    if (!productId) {
      return;
    }

    const isWishlisted = wishlistIds.some(
      (id) => String(id) === String(productId),
    );

    if (isWishlisted) {
      dispatch(removeWishlistProduct(productId));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addWishlistProduct(productId));
      toast.success("Added to wishlist");
    }
  };

  const totalPages = pagination.totalPages || pagination.pages || 1;
  const currentPage = pagination.currentPage || pagination.page || 1;
  const hasProductsError = error && !loading && products.length === 0;

  const categoryOptions = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((cat) => ({
        label: cat.name || cat.label || cat,
        value: cat._id || cat.slug || cat.name || cat,
      }));
    }
    return DEFAULT_CATEGORIES.map((name) => ({ label: name, value: name }));
  }, [categories]);

  /*
   * Error
   */
  if (hasProductsError) {
    return (
      <main className="page">
        <div className="panel py-14 text-center">
          <h2 className="text-xl font-bold text-[var(--text)]">
            Failed to load products
          </h2>

          <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>

          <Button
            className="mt-5"
            onClick={() =>
              dispatch(
                fetchProducts({
                  page: 1,
                  limit: 12,
                }),
              )
            }
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      {/* Deals Hero (when ?deals=true, matching deals() in reference) */}
      {isDealsView ? (
        <section className="hero mb-6">
          <div>
            <div className="eyebrow">Limited-time offers</div>
            <h1>
              Little luxuries.
              <br />
              Better prices.
            </h1>
            <p>Discover special prices on customer favourites.</p>
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("deals");
                setSearchParams(next);
              }}
              className="primarybtn goldbtn mt-2"
            >
              Shop offers
            </button>
          </div>
          <div className="heroart">🏷️</div>
        </section>
      ) : (
        <>
          {/* Breadcrumbs */}
          <div className="mb-3.5 text-xs text-[var(--muted)]">
            <Link to="/" className="hover:text-[var(--primary)]">
              Home
            </Link>{" "}
            / <span>Shop</span>
          </div>

          {/* Page Header (matching shop() in reference) */}
          <div className="pagehead">
            <div>
              <div className="eyebrow">The collection</div>
              <h1>Shop all products</h1>
              <p className="muted m-0 mt-1 text-sm">
                Find pieces you'll love, curated for everyday living.
              </p>
            </div>

            <span className="pill">
              {pagination.total || products.length} products
            </span>
          </div>
        </>
      )}

      {/* Reference Toolbar: Search + Category + Sort + More Filters */}
      <div className="toolbar">
        <input
          type="text"
          className="field"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <select
          className="field"
          value={filters.category || "All"}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="All">All</option>
          {categoryOptions.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
        >
          <option value="latest">Sort: Featured</option>
          <option value="price_asc">Price: Low to high</option>
          <option value="price_desc">Price: High to low</option>
          <option value="rating">Customer Rating</option>
        </select>

        <button
          type="button"
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="outlinebtn"
        >
          {filtersOpen ? "Hide filters" : "More filters"}
        </button>

        {(filters.search ||
          filters.category ||
          filters.brand ||
          filters.minPrice ||
          filters.maxPrice ||
          filters.rating) && (
          <button
            type="button"
            onClick={() => {
              dispatch(clearFilters());
              setSearch("");
              setSort("latest");
            }}
            className="btnsm"
          >
            Reset
          </button>
        )}
      </div>

      {/* Collapsible Advanced Filters Panel */}
      {filtersOpen && (
        <div className="panel mb-5">
          <ProductFilters
            categories={categories}
            brands={brands}
            onFilter={handleFilter}
          />
        </div>
      )}

      {/* Full-width 4-column Product Grid matching reference */}
      <section className="min-w-0">
        {loading ? (
          <ProductGrid
            products={[]}
            loading={true}
            onAddToCart={handleAddToCart}
            onWishlist={handleWishlist}
            wishlistIds={wishlistIds}
          />
        ) : products.length === 0 ? (
          <div className="panel py-12 text-center">
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
                  dispatch(clearFilters());
                  setSearch("");
                  setSort("latest");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <ProductGrid
            products={products}
            onProductSelect={onProductSelect}
            onAddToCart={handleAddToCart}
            onWishlist={handleWishlist}
            wishlistIds={wishlistIds}
            loading={wishlistActionLoading}
          />
        )}

        {/* Pagination */}
        {!loading && products.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </section>
    </main>
  );
};

export default Products;
