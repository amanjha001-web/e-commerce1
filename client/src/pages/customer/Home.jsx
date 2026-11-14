import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import ProductGrid from "../../components/product/ProductGrid";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import useAuth from "../../hooks/useAuth";

import { fetchProducts } from "../../store/slices/productThunk.js";
import { addCartProduct } from "../../store/slices/cartThunk.js";
import {
  fetchWishlist,
  addWishlistProduct,
  removeWishlistProduct,
} from "../../store/slices/wishlistThunk.js";

import productService from "../../services/product.service";
import categoryService from "../../services/category.service";

const DEFAULT_CATEGORIES = [
  { name: "Fashion", icon: "👗", slug: "fashion" },
  { name: "Electronics", icon: "🎧", slug: "electronics" },
  { name: "Home & Living", icon: "🏡", slug: "home-living" },
  { name: "Beauty", icon: "🌿", slug: "beauty" },
  { name: "Accessories", icon: "⌚", slug: "accessories" },
  { name: "Lifestyle", icon: "✨", slug: "lifestyle" },
];

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
  const { user: authUser, isAuthenticated } = useAuth();
  const currentUser = user || authUser;

  const rawRole =
    currentUser?.role?.name ||
    currentUser?.role?.roleName ||
    currentUser?.role ||
    currentUser?.userRole ||
    "";
  const role = String(rawRole).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const isAdmin = ["admin", "superadmin", "super_admin"].includes(role);
  const isVendor = ["vendor", "seller"].includes(role);
  const isCustomer = ["customer", "user"].includes(role) || (!isAdmin && !isVendor);

  // =========================
  // Redux Wishlist State
  // =========================

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const wishlistIds = useMemo(() => {
    return wishlistItems
      .map((item) => {
        const prod = item?.product || item;
        return prod?._id || prod?.id || item?.productId || null;
      })
      .filter(Boolean);
  }, [wishlistItems]);

  useEffect(() => {
    if (isAuthenticated && isCustomer) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated, isCustomer]);

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
  // Live Categories State & Fetch
  // =========================

  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        const data =
          response?.data?.categories ||
          (Array.isArray(response?.data) ? response.data : []) ||
          (Array.isArray(response) ? response : []);

        if (isMounted && data.length > 0) {
          setCategoriesList(data.filter((c) => c.isActive !== false));
        }
      } catch (err) {
        console.warn("Could not load categories for home page:", err);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // =========================
  // Add Product To Cart
  // =========================

  const handleAddToCart = async (product) => {
    const productId = product?._id || product?.id;

    if (!productId) {
      toast.error("Product information is missing");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please sign in as a customer to add items to cart");
      navigate("/login");
      return;
    }

    if (!isCustomer || isAdmin || isVendor) {
      toast.error("Shopping cart is only available for customer accounts");
      return;
    }

    try {
      const result = await dispatch(addCartProduct(productId, 1));

      if (!result?.success) {
        toast.error(result?.message || "Unable to add product to cart");
        return;
      }

      toast.success("Added to cart");
    } catch (error) {
      console.error("Add to Cart failed:", error);
      toast.error("Unable to add product to cart");
    }
  };

  // =========================
  // Wishlist Toggle
  // =========================

  const handleWishlist = (product) => {
    if (onToggleWishlist) {
      onToggleWishlist(product);
      return;
    }

    const productId = product?._id || product?.id || product?.slug;
    if (!productId) return;

    if (!isAuthenticated) {
      toast.error("Please sign in as a customer to manage your wishlist");
      navigate("/login");
      return;
    }

    if (!isCustomer || isAdmin || isVendor) {
      toast.error("Wishlist is only available for customer accounts");
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
        setSectionsError(`Unable to load: ${failedSections.join(", ")}.`);
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
  // Featured & Latest Products
  // =========================

  const featuredProducts = products.filter(
    (product) => product?.featured === true,
  );

  const latestProducts = [...products].sort((a, b) => {
    return (
      new Date(b?.createdAt || 0).getTime() -
      new Date(a?.createdAt || 0).getTime()
    );
  });

  const productsToShow =
    featuredProducts.length > 0 ? featuredProducts : latestProducts;

  const sectionTitle =
    featuredProducts.length > 0 ? "Featured products" : "Curated collection";

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

  const handleCopyCoupon = () => {
    navigator.clipboard?.writeText("WELCOME10");
    toast.success("Coupon code WELCOME10 copied!");
  };

  const activeBanner = banners?.[0] || null;

  const categoryIconMap = {
    fashion: "👗",
    electronics: "🎧",
    "home-living": "🏡",
    "home & living": "🏡",
    beauty: "🌿",
    accessories: "⌚",
    lifestyle: "✨",
  };

  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    if (categoriesList && categoriesList.length > 0) {
      return categoriesList.map((cat, idx) => {
        const slug =
          cat.slug ||
          String(cat.name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
        return {
          _id: cat._id,
          name: cat.name,
          slug: slug,
          image: cat.image,
          icon:
            cat.icon ||
            categoryIconMap[slug] ||
            categoryIconMap[String(cat.name).toLowerCase()] ||
            ["👗", "🎧", "🏡", "🌿", "⌚", "✨"][idx % 6],
        };
      });
    }
    return DEFAULT_CATEGORIES;
  }, [categories, categoriesList]);

  const productSections = [
    {
      eyebrow: "Handpicked for you",
      title: sectionTitle,
      products: productsToShow,
      loading: productsLoading,
      error: productsError,
    },
    {
      eyebrow: "Limited-time offers",
      title: "Flash Sale",
      products: homeSections.flashSale,
      loading: sectionsLoading,
      error: null,
    },
    {
      eyebrow: "Customer favourites",
      title: "Trending Products",
      products: homeSections.trending,
      loading: sectionsLoading,
      error: null,
    },
    {
      eyebrow: "Top rated pieces",
      title: "Best Sellers",
      products: homeSections.bestSellers,
      loading: sectionsLoading,
      error: null,
    },
    {
      eyebrow: "Fresh in store",
      title: "New Arrivals",
      products: homeSections.newArrivals,
      loading: sectionsLoading,
      error: null,
    },
  ];

  return (
    <main className="page">
      {/* =========================
          Hero Section (Exact Reference .hero + .heroart)
      ========================= */}
      <section className="hero">
        <div>
          <div className="eyebrow">
            {activeBanner?.subtitle || "The curated collection · 2026"}
          </div>

          <h1>
            {activeBanner?.title || (
              <>
                Find your next
                <br />
                favourite thing.
              </>
            )}
          </h1>

          <p>
            {activeBanner?.description ||
              "Discover thoughtful essentials, elevated everyday style and pieces made to make life feel a little more special."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleShopNow}
              className="primarybtn goldbtn text-xs sm:text-sm !py-2 !px-3.5 sm:!py-2.5 sm:!px-4"
            >
              {activeBanner?.buttonText || "Explore collection →"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/products?deals=true")}
              className="outlinebtn text-xs sm:text-sm !py-2 !px-3.5 sm:!py-2.5 sm:!px-4"
              style={{
                background: "#ffffff16",
                color: "#ffffff",
                borderColor: "#ffffff55",
              }}
            >
              View offers
            </button>
          </div>
        </div>

        {/* Right Hero Artwork (.heroart from reference) */}
        <div className="heroart">
          {activeBanner?.image ? (
            <img
              src={
                typeof activeBanner.image === "string"
                  ? activeBanner.image
                  : activeBanner.image?.url
              }
              alt={activeBanner?.title || "Curated collection"}
              className="h-full w-full object-cover"
            />
          ) : (
            "🛍️"
          )}
        </div>
      </section>

      {/* =========================
          Categories Section (.sectionhead + .categorygrid + .category)
      ========================= */}
      <div className="sectionhead">
        <div>
          <div className="eyebrow">Browse by style</div>
          <h2>Shop categories</h2>
        </div>

        <Link
          to="/categories"
          className="text-sm font-extrabold text-[var(--primary)] hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="categorygrid">
        {displayCategories.slice(0, 6).map((cat, idx) => {
          const name = cat.name || cat;
          const icon =
            cat.icon || ["👗", "🎧", "🏡", "🌿", "⌚", "✨"][idx % 6];

          return (
            <div
              key={cat._id || cat.slug || name}
              onClick={() => {
                if (onCategoryClick) onCategoryClick(cat);
                else {
                  const target = cat.slug || cat._id || cat.name;
                  navigate(
                    `/products?category=${encodeURIComponent(target)}`,
                  );
                }
              }}
              className="category"
            >
              <div style={{ fontSize: "30px" }}>
                {cat.image ? (
                  <img
                    src={
                      typeof cat.image === "string"
                        ? cat.image
                        : cat.image?.url
                    }
                    alt={name}
                    className="mx-auto h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  icon
                )}
              </div>
              <b>{name}</b>
            </div>
          );
        })}
      </div>

      {/* =========================
          Product Sections (Featured, Flash Sale, Trending, Best Sellers, New Arrivals)
      ========================= */}
      {productSections.map((sec) => {
        if (!sec.loading && sec.products.length === 0) return null;

        return (
          <section key={sec.title}>
            <div className="sectionhead">
              <div>
                <div className="eyebrow">{sec.eyebrow}</div>
                <h2>{sec.title}</h2>
              </div>

              <Link
                to="/products"
                className="text-sm font-extrabold text-[var(--primary)] hover:underline"
              >
                Shop all →
              </Link>
            </div>

            {sec.loading ? (
              <div className="flex min-h-[180px] items-center justify-center">
                <Loader />
              </div>
            ) : sec.error ? (
              <div className="panel text-center text-xs text-[var(--red)]">
                {typeof sec.error === "string"
                  ? sec.error
                  : "Unable to load products."}
              </div>
            ) : (
              <ProductGrid
                products={sec.products.slice(0, 4)}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
                wishlistIds={wishlistIds}
              />
            )}
          </section>
        );
      })}

      {/* =========================
          Promo Offer Panel
      ========================= */}
      <div
        className="panel mt-7 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "var(--soft)" }}
      >
        <div>
          <div className="eyebrow">A little something extra</div>
          <h2 className="my-1 text-xl font-extrabold text-[var(--text)]">
            Enjoy 10% off your first order
          </h2>
          <p className="muted m-0 text-sm">
            Use code <b className="text-[var(--primary)]">WELCOME10</b> at
            checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCoupon}
          className="primarybtn shrink-0"
        >
          Copy offer
        </button>
      </div>
    </main>
  );
};

export default Home;
