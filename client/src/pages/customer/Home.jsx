
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import ProductGrid from "../../components/product/ProductGrid";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

import { fetchProducts } from "../../store/slices/productThunk.js";
import { addCartProduct } from "../../store/slices/cartThunk.js";

import productService from "../../services/product.service";

const Home = ({
  user = null,
  banners = [],
  categories = [],
  onCategoryClick,
  onToggleWishlist,
  onShopNow,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // =========================
  // Redux Product State
  // =========================

  const {
    products = [],
    loading: productsLoading = false,
    error: productsError = null,
  } = useSelector((state) => state.product || {});

  // =========================
  // Home Product Sections
  // =========================

  const [homeSections, setHomeSections] = useState({
    flashSale: [],
    trending: [],
    bestSellers: [],
    newArrivals: [],
  });

  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState("");

  // =========================
  // Add Product To Cart
  // =========================

  const handleAddToCart = async (product) => {
    const productId = product?._id || product?.id;

    if (!productId) {
      console.error("Add to Cart failed: Product ID is missing");
      return;
    }

    try {
      const result = await dispatch(addCartProduct(productId, 1));

      if (!result?.success) {
        console.error(
          "Add to Cart failed:",
          result?.message || "Unable to add product to cart",
        );
        return;
      }

      console.log("Product added to cart successfully");
    } catch (error) {
      console.error("Add to Cart failed:", error);
    }
  };

  // =========================
  // Normalize API Response
  // =========================

  const getProductsArray = (response) => {
    const candidates = [
      response?.data?.products,
      response?.data?.data?.products,
      response?.data?.data,
      response?.data,
      response?.products,
      response?.results,
    ];

    return candidates.find(Array.isArray) || [];
  };

  // =========================
  // Fetch Home Product Sections
  // =========================

  useEffect(() => {
    let isMounted = true;

    const loadHomeSections = async () => {
      setSectionsLoading(true);
      setSectionsError("");

      const requests = await Promise.allSettled([
        productService.getFlashSaleProducts(),
        productService.getTrendingProducts(),
        productService.getBestSellerProducts(),
        productService.getNewArrivalProducts(),
      ]);

      if (!isMounted) return;

      const [flashSale, trending, bestSellers, newArrivals] = requests;

      const sectionResults = {
        flashSale,
        trending,
        bestSellers,
        newArrivals,
      };

      setHomeSections({
        flashSale:
          flashSale.status === "fulfilled"
            ? getProductsArray(flashSale.value)
            : [],
        trending:
          trending.status === "fulfilled"
            ? getProductsArray(trending.value)
            : [],
        bestSellers:
          bestSellers.status === "fulfilled"
            ? getProductsArray(bestSellers.value)
            : [],
        newArrivals:
          newArrivals.status === "fulfilled"
            ? getProductsArray(newArrivals.value)
            : [],
      });

      const failedSections = Object.entries(sectionResults)
        .filter(([, result]) => result.status === "rejected")
        .map(([name]) => {
          const names = {
            flashSale: "Flash Sale",
            trending: "Trending Products",
            bestSellers: "Best Sellers",
            newArrivals: "New Arrivals",
          };

          return names[name];
        });

      if (failedSections.length > 0) {
        setSectionsError(
          `Unable to load: ${failedSections.join(", ")}.`,
        );
      }

      setSectionsLoading(false);
    };

    loadHomeSections();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================
  // Fetch Main Products
  // =========================

  useEffect(() => {
    dispatch(
      fetchProducts({
        page: 1,
        limit: 12,
        sort: "latest",
      }),
    );
  }, [dispatch]);

  // =========================
  // Featured Products
  // =========================

  const featuredProducts = products.filter(
    (product) => product?.featured === true,
  );

  // =========================
  // Latest Products
  // =========================

  const latestProducts = [...products].sort((a, b) => {
    return (
      new Date(b?.createdAt || 0).getTime() -
      new Date(a?.createdAt || 0).getTime()
    );
  });

  // =========================
  // Products To Display
  // =========================

  const productsToShow =
    featuredProducts.length > 0
      ? featuredProducts
      : latestProducts;

  const sectionTitle =
    featuredProducts.length > 0
      ? "Featured Products"
      : "Latest Products";

  // =========================
  // Navigation Handlers
  // =========================

  const handleShopNow = () => {
    if (onShopNow) {
      onShopNow();
      return;
    }

    navigate("/products");
  };

  const handleCategories = () => {
    navigate("/categories");
  };

  const handleProducts = () => {
    navigate("/products");
  };

  // =========================
  // Active Hero Banner
  // =========================

  const activeBanner = banners?.[0] || null;

  // =========================
  // Product Sections
  // =========================

  const productSections = [
    {
      title: sectionTitle,
      products: productsToShow,
      loading: productsLoading,
      error: productsError,
    },
    {
      title: "Flash Sale",
      products: homeSections.flashSale,
      loading: sectionsLoading,
      error: null,
    },
    {
      title: "Trending Products",
      products: homeSections.trending,
      loading: sectionsLoading,
      error: null,
    },
    {
      title: "Best Sellers",
      products: homeSections.bestSellers,
      loading: sectionsLoading,
      error: null,
    },
    {
      title: "New Arrivals",
      products: homeSections.newArrivals,
      loading: sectionsLoading,
      error: null,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* =========================
          Hero Section
      ========================= */}

      <section className="relative overflow-hidden border-b border-border">
        {activeBanner ? (
          <div className="relative min-h-[420px] sm:min-h-[500px]">
            {activeBanner.image && (
              <img
                src={activeBanner.image}
                alt={activeBanner.title || "ShopSphere"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-16 sm:min-h-[500px] sm:px-6 lg:px-8">
              <div className="max-w-2xl text-white">
                {activeBanner.subtitle && (
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wider">
                    {activeBanner.subtitle}
                  </p>
                )}

                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  {activeBanner.title ||
                    "Everything You Need, All in One Place"}
                </h1>

                {activeBanner.description && (
                  <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                    {activeBanner.description}
                  </p>
                )}

                <div className="mt-8">
                  <Button onClick={handleShopNow}>
                    {activeBanner.buttonText || "Shop Now"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-16 sm:min-h-[500px] sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Welcome to ShopSphere
              </p>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Shop smarter.
                <br />
                Live better.
              </h1>

              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Discover quality products from trusted sellers, all in one
                marketplace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={handleShopNow}>Shop Now</Button>

                <Button variant="outline" onClick={handleCategories}>
                  Explore Categories
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================
          Categories Section
      ========================= */}

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Explore</p>

              <h2 className="mt-1 text-2xl font-bold">
                Shop by Category
              </h2>
            </div>

            <button
              type="button"
              onClick={handleCategories}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.slice(0, 6).map((category, index) => {
              const id = category?._id || category?.id || category?.name || index;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onCategoryClick?.(category)}
                  className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {category?.image ? (
                      <img
                        src={category.image}
                        alt={category.name || "Category"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
                        {category?.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">
                      {category?.name || "Category"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================
          Home Product Sections
      ========================= */}

      {productSections.map((section) => (
        <section
          key={section.title}
          className="border-b border-border bg-muted/30"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">
                  ShopSphere Picks
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {section.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleProducts}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View All
              </button>
            </div>

            {section.loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader />
              </div>
            ) : section.error ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-destructive">
                  {typeof section.error === "string"
                    ? section.error
                    : "Unable to load products. Please try again."}
                </p>
              </div>
            ) : section.products.length > 0 ? (
              <ProductGrid
                products={section.products.slice(0, 8)}
                onAddToCart={handleAddToCart}
                onWishlist={onToggleWishlist}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No products available in this section right now.
                </p>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* =========================
          Home Sections API Error
      ========================= */}

      {sectionsError && (
        <div
          role="status"
          className="mx-auto max-w-7xl px-4 py-4 text-sm text-muted-foreground sm:px-6 lg:px-8"
        >
          {sectionsError}
        </div>
      )}

      {/* =========================
          CTA Section
      ========================= */}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-xl sm:px-10 lg:px-16">
          <p className="text-sm font-semibold uppercase tracking-wider opacity-80">
            {user?.fullName
              ? `Welcome back, ${user.fullName}`
              : "ShopSphere Marketplace"}
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Find something you'll love today.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm opacity-80 sm:text-base">
            Explore thousands of products from trusted vendors and enjoy a
            simple shopping experience.
          </p>

          <div className="mt-7">
            <Button variant="secondary" onClick={handleShopNow}>
              Start Shopping
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
