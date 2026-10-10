import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ProductFilters from "../../components/product/ProductFilters";
import ProductGrid from "../../components/product/ProductGrid";
import ProductSort from "../../components/product/ProductSort";

import SearchBar from "../../components/search/SearchBar";

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

const Products = ({
  categories = [],
  brands = [],
  onProductSelect,
  onAddToCart,
  onNavigate,
}) => {
  const dispatch = useDispatch();

  const handleAddToCart = async (product) => {
    const productId = product?._id || product?.id;

    if (!productId) {
      console.error("Product ID is missing");
      return;
    }

    const result = await dispatch(addCartProduct(productId, 1));

    if (!result?.success) {
      console.error(result?.message || "Failed to add product");
      return;
    }

    console.log("Product added successfully");
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
   *
   * Page open hote hi current wishlist
   * Redux me load ho jayegi.
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
   *
   * ProductCard se complete product milega.
   */
  const handleWishlist = (product) => {
    const productId = product?._id || product?.id || product?.slug;

    if (!productId) {
      return;
    }

    const isWishlisted = wishlistIds.includes(productId);

    if (isWishlisted) {
      dispatch(removeWishlistProduct(productId));
    } else {
      dispatch(addWishlistProduct(productId));
    }
  };

  const totalPages = pagination.totalPages || pagination.pages || 1;

  const currentPage = pagination.currentPage || pagination.page || 1;

  /*
   * Error
   */
  if (error && !loading && products.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">Failed to load products</h2>

          <p className="mt-2 text-sm text-muted-foreground">{error}</p>

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
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Shop</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            All Products
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Discover products from trusted sellers across different categories.
          </p>
        </div>

        <Button variant="outline" onClick={() => onNavigate?.("/categories")}>
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
          {pagination.total || products.length} products
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
          className={[filtersOpen ? "block" : "hidden", "lg:block"].join(" ")}
        >
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>

              <button
                type="button"
                onClick={() => {
                  dispatch(clearFilters());
                  setSearch("");
                  setSort("latest");
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear
              </button>
            </div>

            <ProductFilters
              categories={categories}
              brands={brands}
              onFilter={handleFilter}
            />
          </div>
        </aside>

        {/* Product Content */}
        <section className="min-w-0">
          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {pagination.total || products.length}{" "}
                {(pagination.total || products.length) === 1
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

              <ProductSort value={sort} onChange={handleSort} />
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <ProductGrid
                products={[]}
                loading={true}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
                wishlistIds={wishlistIds}
              />
            </div>
          ) : products.length === 0 ? (
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
              onAddToCart={onAddToCart}
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
