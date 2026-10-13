import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ProductGrid from "../../components/product/ProductGrid";
import ProductSort from "../../components/product/ProductSort";
import SearchBar from "../../components/search/SearchBar";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";

import categoryService from "../../services/category.service";

import { fetchProducts } from "../../store/slices/productThunk.js";
import { addCartProduct } from "../../store/slices/cartThunk.js";

import {
  setFilter,
  setPage,
  
} from "../../store/slices/productSlice.js";

import {
  fetchWishlist,
  addWishlistProduct,
  removeWishlistProduct,
} from "../../store/slices/wishlistThunk.js";

const Categories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux product state
  const {
    products = [],
    loading: productsLoading = false,
    error: productsError = null,
    filters = {},
    pagination = {},
  } = useSelector((state) => state.product);

  // Redux wishlist state
  const { items: wishlist = [], actionLoading: wishlistActionLoading = false } =
    useSelector((state) => state.wishlist);

  // Local category API state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [search, setSearch] = useState(filters.search || "");
  const [sort, setSort] = useState(filters.sort || "latest");

  // Fetch categories from API
  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories();

        const categoryList = response?.data?.categories || [];

        if (isMounted) {
          setCategories(
            categoryList
              .filter((category) => category.isActive !== false)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
          );
        }
      } catch (error) {
        if (isMounted) {
          setCategoriesError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load categories.",
          );
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products whenever Redux filters or pagination change
  useEffect(() => {
    dispatch(
      fetchProducts({
        page: pagination.page || pagination.currentPage || 1,
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
    pagination.currentPage,
    pagination.limit,
    filters.search,
    filters.category,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
    filters.rating,
    filters.sort,
  ]);

  // Load wishlist
  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  // Wishlist product IDs
  const wishlistIds = useMemo(() => {
    return wishlist
      .map((item) => {
        const product = item?.product || item;

        return product?._id || product?.id || item?.productId || null;
      })
      .filter(Boolean)
      .map(String);
  }, [wishlist]);

  // Find selected category from Redux filter
  const activeCategory = useMemo(() => {
    if (!filters.category) return null;

    return (
      categories.find(
        (category) =>
          String(category._id) === String(filters.category) ||
          category.slug === filters.category,
      ) || null
    );
  }, [categories, filters.category]);

  // Select category and fetch matching products through Redux
  const handleCategorySelect = (category) => {
    dispatch(
      setFilter({
        name: "category",
        value: category?._id || category?.slug || "",
      }),
    );

    dispatch(setPage(1));
  };

  // Show all products
  const handleShowAll = () => {
    dispatch(
      setFilter({
        name: "category",
        value: "",
      }),
    );

    dispatch(setPage(1));
  };

  // Search
  const handleSearch = (value) => {
    setSearch(value);

    dispatch(
      setFilter({
        name: "search",
        value,
      }),
    );

    dispatch(setPage(1));
  };

  // Sorting
  const handleSort = (value) => {
    setSort(value);

    dispatch(
      setFilter({
        name: "sort",
        value,
      }),
    );

    dispatch(setPage(1));
  };

  // Add product to cart
  const handleAddToCart = async (product) => {
    const productId = product?._id || product?.id;

    if (!productId) {
      console.error("Product ID is missing.");
      return;
    }

    const result = await dispatch(addCartProduct(productId, 1));

    if (!result?.success) {
      console.error(result?.message || "Unable to add product to cart.");
    }
  };

  // Toggle wishlist
  const handleWishlist = (product) => {
    const productId = product?._id || product?.id;

    if (!productId) return;

    if (wishlistIds.includes(String(productId))) {
      dispatch(removeWishlistProduct(productId));
    } else {
      dispatch(addWishlistProduct(productId));
    }
  };

  // Pagination
  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const totalPages =
    pagination.totalPages ||
    pagination.pages ||
    Math.ceil((pagination.total || products.length) / (pagination.limit || 12));

  const currentPage = pagination.currentPage || pagination.page || 1;

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-background px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <p className="text-sm font-medium text-primary">Shop by Category</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Explore Categories
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Discover products from your favorite categories.
        </p>
      </header>

      {/* Category list */}
      <section className="mb-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            All Categories
          </h2>

          <Button variant="outline" onClick={handleShowAll}>
            View All Products
          </Button>
        </div>

        {categoriesLoading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Loader />
          </div>
        ) : categoriesError ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-destructive">{categoriesError}</p>

            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <EmptyState
              title="No categories available"
              description="Active categories will appear here."
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => {
              const id = category._id || category.id;

              const isSelected =
                String(filters.category || "") === String(id) ||
                filters.category === category.slug;

              const imageUrl =
                typeof category.image === "string"
                  ? category.image
                  : category.image?.url || "";

              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleCategorySelect(category)}
                  className={[
                    "group overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:-translate-y-1 hover:border-primary/40",
                  ].join(" ")}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={category.name || "Category"}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-primary">
                        {category.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold capitalize text-foreground">
                      {category.name || "Category"}
                    </h3>

                    {category.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Product listing */}
      <section>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Products</p>

            <h2 className="mt-1 text-xl font-bold capitalize text-foreground">
              {activeCategory?.name || "All Products"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {activeCategory
                ? `Browse products in ${activeCategory.name}.`
                : "Browse products across all categories."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar
              value={search}
              onChange={handleSearch}
              onSearch={handleSearch}
              placeholder="Search products..."
            />

            <ProductSort value={sort} onChange={handleSort} />
          </div>
        </div>

        {productsLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : productsError && products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-destructive">
              {typeof productsError === "string"
                ? productsError
                : "Unable to load products."}
            </p>

            <Button
              className="mt-4"
              onClick={() =>
                dispatch(
                  fetchProducts({
                    page: currentPage,
                    limit: pagination.limit || 12,
                    category: filters.category || "",
                    search: filters.search || "",
                    sortBy: filters.sort || "latest",
                  }),
                )
              }
            >
              Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <EmptyState
              title="No products found"
              description={
                search
                  ? "Try changing your search term."
                  : "No products are available for this category."
              }
            />
          </div>
        ) : (
          <>
            <ProductGrid
              products={products}
              onProductClick={(product) =>
                navigate(`/products/${product._id || product.id}`)
              }
              onAddToCart={handleAddToCart}
              onWishlist={handleWishlist}
              wishlistIds={wishlistIds}
              loading={wishlistActionLoading}
            />

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Back to home */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-10 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Home
      </button>
    </main>
  );
};

export default Categories;
