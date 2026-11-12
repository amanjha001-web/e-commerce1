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
import Breadcrumb from "../../components/common/Breadcrumb";

import categoryService from "../../services/category.service";

import { fetchProducts } from "../../store/slices/productThunk.js";
import { addCartProduct } from "../../store/slices/cartThunk.js";

import { setFilter, setPage } from "../../store/slices/productSlice.js";

import {
  fetchWishlist,
  addWishlistProduct,
  removeWishlistProduct,
} from "../../store/slices/wishlistThunk.js";

const DEFAULT_CATEGORIES = [
  { name: "Fashion", icon: "👗", slug: "fashion" },
  { name: "Electronics", icon: "🎧", slug: "electronics" },
  { name: "Home & Living", icon: "🏡", slug: "home-living" },
  { name: "Beauty", icon: "🌿", slug: "beauty" },
  { name: "Accessories", icon: "⌚", slug: "accessories" },
  { name: "Lifestyle", icon: "✨", slug: "lifestyle" },
];

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
  const { items: wishlist = [] } = useSelector((state) => state.wishlist);

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
          if (categoryList.length > 0) {
            setCategories(
              categoryList
                .filter((category) => category.isActive !== false)
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
            );
          } else {
            setCategories(DEFAULT_CATEGORIES);
          }
        }
      } catch {
        if (isMounted) {
          setCategories(DEFAULT_CATEGORIES);
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
        sort: filters.sort || "latest",
      }),
    );
  }, [
    dispatch,
    filters.category,
    filters.search,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    pagination.page,
    pagination.currentPage,
    pagination.limit,
  ]);

  // Wishlist item IDs
  const wishlistIds = useMemo(() => {
    return wishlist
      .map((item) => {
        const product = item?.product || item;
        return product?._id || product?.id || item?.productId || null;
      })
      .filter(Boolean);
  }, [wishlist]);

  // Select category
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
    if (!productId) return;
    await dispatch(addCartProduct(productId, 1));
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

  const totalPages =
    pagination.totalPages ||
    pagination.pages ||
    Math.ceil((pagination.total || products.length) / (pagination.limit || 12));

  const currentPage = pagination.currentPage || pagination.page || 1;

  return (
    <main className="page">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Categories" },
        ]}
      />

      {/* Header */}
      <header className="mb-6">
        <div className="eyebrow">Explore</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--text)]">
          All categories
        </h1>
        <p className="muted mt-1 text-sm">
          Browse our collections and find exactly what you're looking for.
        </p>
      </header>

      {/* Categories Grid (matching categories() in reference) */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--text)]">
            Browse collections
          </h2>

          <button
            type="button"
            onClick={handleShowAll}
            className={`btnsm ${!filters.category ? "primary" : ""}`}
          >
            All Categories
          </button>
        </div>

        {categoriesLoading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <div className="categorygrid">
            {categories.map((category, idx) => {
              const id = category._id || category.id || category.slug;
              const isSelected =
                String(filters.category || "") === String(id) ||
                filters.category === category.slug;
              const icon =
                category.icon ||
                ["👗", "🎧", "🏡", "🌿", "⌚", "✨"][idx % 6];

              return (
                <button
                  key={category.name || id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleCategorySelect(category)}
                  className={`category ${
                    isSelected
                      ? "!border-[var(--primary)] !bg-[var(--soft)]"
                      : ""
                  }`}
                >
                  <div style={{ fontSize: "45px" }}>
                    {category.image ? (
                      <img
                        src={
                          typeof category.image === "string"
                            ? category.image
                            : category.image?.url
                        }
                        alt={category.name}
                        className="mx-auto h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      icon
                    )}
                  </div>

                  <b>{category.name}</b>

                  <p className="muted mt-1 mb-0 text-xs">
                    Explore collection →
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Filtered Products Section */}
      <section className="mt-8 border-t border-[var(--line)] pt-8">
        <div className="pagehead">
          <div>
            <div className="eyebrow">Results</div>
            <h1>{filters.category ? "Filtered products" : "All products"}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="pill">
              {pagination.total || products.length} products
            </span>
            <ProductSort value={sort} onChange={handleSort} />
          </div>
        </div>

        {productsLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader />
          </div>
        ) : products.length === 0 ? (
          <div className="panel p-8 text-center">
            <EmptyState
              title="No products in this category"
              message="Try selecting another category or clear your search filters."
              action={handleShowAll}
              actionText="View all products"
            />
          </div>
        ) : (
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            onWishlist={handleWishlist}
            wishlistIds={wishlistIds}
          />
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => dispatch(setPage(page))}
            />
          </div>
        )}
      </section>
    </main>
  );
};

export default Categories;
