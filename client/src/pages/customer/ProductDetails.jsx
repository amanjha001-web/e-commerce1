import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import ProductActions from "../../components/product/ProductActions";
import ProductGallery from "../../components/product/ProductGallery";
import ProductInfo from "../../components/product/ProductInfo";
import ProductPrice from "../../components/product/ProductPrice";
import ProductQuantity from "../../components/product/ProductQuantity";
import ProductRating from "../../components/product/ProductRating";
import ProductReviews from "../../components/product/ProductReviews";
import ProductVariants from "../../components/product/ProductVariants";
import RelatedProducts from "../../components/product/RelatedProducts";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Breadcrumb from "../../components/common/Breadcrumb";

import productService from "../../services/product.service";

import { addCartProduct } from "../../store/slices/cartThunk";
import {
  fetchWishlist,
  addWishlistProduct,
  removeWishlistProduct,
} from "../../store/slices/wishlistThunk";

const getProductFromResponse = (response) => {
  const data = response?.data;

  if (data?._id || data?.id) {
    return data;
  }

  if (data?.product) {
    return data.product;
  }

  if (response?.product) {
    return response.product;
  }

  if (response?._id || response?.id) {
    return response;
  }

  return null;
};

const getProductsFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  return [];
};

const getWishlistProductId = (item) => {
  if (!item) return null;

  const product = item.product || item;

  return product?._id || product?.id || item?.productId || null;
};

const ProductDetails = ({
  product: productProp = null,
  relatedProducts: relatedProductsProp = [],
  reviews = [],
  loading: loadingProp = false,
  reviewsLoading = false,
  actionLoading = false,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onSubmitReview,
  onProductSelect,
  onNavigate,
}) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  const wishlistActionLoading = useSelector(
    (state) => state.wishlist?.actionLoading || false,
  );

  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [fetchedRelatedProducts, setFetchedRelatedProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const product = productProp || fetchedProduct;

  const relatedProducts =
    relatedProductsProp.length > 0
      ? relatedProductsProp
      : fetchedRelatedProducts;

  const currentProductId = product?._id || product?.id || productId;

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    if (productProp) {
      setProductLoading(false);
      return;
    }

    if (!productId) {
      setProductLoading(false);
      return;
    }

    const loadProductData = async () => {
      setProductLoading(true);
      setProductError("");

      try {
        const response = await productService.getProductById(productId);
        const resolvedProduct = getProductFromResponse(response);

        if (!isMounted) return;

        if (!resolvedProduct) {
          setProductError("Product not found");
          setFetchedProduct(null);
          return;
        }

        setFetchedProduct(resolvedProduct);

        const categoryId =
          resolvedProduct?.category?._id ||
          resolvedProduct?.category?.id ||
          resolvedProduct?.category;

        if (categoryId) {
          try {
            const relatedResponse =
              await productService.getProductsByCategory(categoryId, {
                limit: 4,
              });

            if (!isMounted) return;

            const relatedList = getProductsFromResponse(relatedResponse).filter(
              (item) => {
                const itemId = item?._id || item?.id;
                const currentId = resolvedProduct?._id || resolvedProduct?.id;
                return itemId !== currentId;
              },
            );

            setFetchedRelatedProducts(relatedList);
          } catch {
            if (isMounted) setFetchedRelatedProducts([]);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setProductError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load product details.",
        );
        setFetchedProduct(null);
      } finally {
        if (isMounted) setProductLoading(false);
      }
    };

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [productId, productProp]);

  const variants = useMemo(() => {
    if (!product?.variants) return [];
    return Array.isArray(product.variants) ? product.variants : [];
  }, [product]);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  const currentPrice = useMemo(() => {
    if (selectedVariant?.price != null) {
      return Number(selectedVariant.price);
    }
    return Number(
      product?.salePrice ??
        product?.discountPrice ??
        product?.finalPrice ??
        product?.price ??
        0,
    );
  }, [product, selectedVariant]);

  const stock = useMemo(() => {
    if (selectedVariant?.stock != null) {
      return Number(selectedVariant.stock);
    }
    return Number(product?.stock ?? product?.quantity ?? 0);
  }, [product, selectedVariant]);

  const isOutOfStock = useMemo(() => {
    return (
      product?.inStock === false ||
      product?.isActive === false ||
      product?.status === "draft" ||
      stock <= 0
    );
  }, [product, stock]);

  const isWishlisted = useMemo(() => {
    if (!currentProductId || !wishlistItems.length) return false;
    return wishlistItems.some((item) => {
      const id = getWishlistProductId(item);
      return id && String(id) === String(currentProductId);
    });
  }, [currentProductId, wishlistItems]);

  const handleQuantityChange = (nextQuantity) => {
    const parsed = Number(nextQuantity);
    if (!Number.isInteger(parsed) || parsed < 1) return;
    const maxStock = stock > 0 ? stock : 1;
    setQuantity(Math.min(parsed, maxStock));
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!currentProductId || isOutOfStock || addingToCart) return;

    if (onAddToCart) {
      onAddToCart(product, quantity, selectedVariant);
      return;
    }

    setAddingToCart(true);
    try {
      await dispatch(addCartProduct(currentProductId, quantity));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!currentProductId || isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product, quantity, selectedVariant);
      return;
    }
    await handleAddToCart();
    navigate("/checkout");
  };

  const handleToggleWishlist = async () => {
    if (!currentProductId || wishlistBusy || wishlistActionLoading) return;
    if (onToggleWishlist) {
      onToggleWishlist(product);
      return;
    }

    setWishlistBusy(true);
    try {
      if (isWishlisted) {
        await dispatch(removeWishlistProduct(currentProductId));
      } else {
        await dispatch(addWishlistProduct(currentProductId));
      }
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleNavigate = (path) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    navigate(path);
  };

  const handleProductSelect = (selectedProduct) => {
    if (onProductSelect) {
      onProductSelect(selectedProduct);
      return;
    }
    const selectedId = selectedProduct?._id || selectedProduct?.id;
    if (selectedId) {
      navigate(`/products/${selectedId}`);
    }
  };

  if (loadingProp || productLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
        <Loader />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
        <EmptyState
          title="Product not found"
          message={
            productError ||
            "The product you're looking for is unavailable or may have been removed."
          }
        />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => handleNavigate("/products")}>
            Browse Products
          </Button>
          <Button variant="outline" onClick={() => navigate(0)}>
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "Collection";

  return (
    <main className="page">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/products" },
          { label: product.name || product.title || "Product details" },
        ]}
      />

      {/* Main Product Detail Grid (.detail from reference) */}
      <section className="detail mt-3">
        {/* Left: Product Visual / Gallery */}
        <div className="min-w-0">
          <ProductGallery product={product} />
        </div>

        {/* Right: Product Information & Purchase Panel */}
        <div className="flex min-w-0 flex-col">
          <span className="pill w-fit">{categoryName}</span>

          <h1 className="my-3 text-3xl font-extrabold tracking-tight text-[var(--text)]">
            {product.name || product.title}
          </h1>

          {/* Rating */}
          <div className="rating">
            ★★★★★{" "}
            <span className="muted">
              {(product.rating ?? product.averageRating ?? 4.8).toFixed(1)} ·{" "}
              {product.reviewCount ??
                product.totalReviews ??
                reviews.length ??
                124}{" "}
              reviews
            </span>
          </div>

          {/* Price */}
          <p className="price my-4 text-[27px]">
            ₹{Number(currentPrice).toLocaleString("en-IN")}
            {(() => {
              const rawOld = Number(
                product.old ||
                  product.oldPrice ||
                  product.originalPrice ||
                  product.mrp ||
                  (product.price > currentPrice ? product.price : 0),
              );
              const fallbackOld =
                currentPrice >= 100
                  ? Math.ceil((currentPrice * 1.3) / 100) * 100 - 1
                  : currentPrice > 0
                    ? Math.round(currentPrice * 1.3)
                    : 0;
              const displayOld = rawOld > currentPrice ? rawOld : fallbackOld;
              return displayOld > currentPrice ? (
                <span className="oldprice">
                  ₹{Number(displayOld).toLocaleString("en-IN")}
                </span>
              ) : null;
            })()}
          </p>

          {/* Description */}
          {(product.shortDescription || product.description) && (
            <p className="muted my-0 text-sm leading-relaxed">
              {product.shortDescription || product.description}
            </p>
          )}

          {/* Trust points */}
          <p className="muted my-3 text-xs">
            ✓ In stock · ✓ Secure checkout · ✓ Easy returns
          </p>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <ProductVariants
                variants={variants}
                selectedVariant={selectedVariant}
                onChange={handleVariantChange}
              />
            </div>
          )}

          {/* Quantity and Actions (matching .qty + primarybtn + outlinebtn in reference) */}
          <div className="my-4 flex items-center gap-3">
            <b className="text-sm text-[var(--text)]">Quantity</b>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || isOutOfStock}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-white font-bold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40"
            >
              −
            </button>
            <b className="min-w-4 text-center text-sm text-[var(--text)]">
              {quantity}
            </b>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isOutOfStock || quantity >= (stock > 0 ? stock : 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-white font-bold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40"
            >
              +
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className="primarybtn disabled:opacity-50"
            >
              {addingToCart ? "Adding..." : "Add to cart"}
            </button>

            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistBusy || wishlistActionLoading}
              className={`outlinebtn ${
                isWishlisted
                  ? "border-[var(--primary)] bg-[var(--soft)] text-[var(--primary)]"
                  : ""
              }`}
            >
              {isWishlisted ? "♥ Wishlist" : "♡ Wishlist"}
            </button>
          </div>

          {isOutOfStock && (
            <p className="mt-3 text-xs font-bold text-[var(--red)]">
              This item is currently out of stock.
            </p>
          )}

          {/* Product Details Panel */}
          <div className="panel mt-5">
            <b className="text-sm text-[var(--text)]">Product details</b>
            <p className="muted mt-1 mb-0 text-xs">
              Quality checked · Secure packaging · Delivered in 3–6 business
              days.
            </p>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="mt-10">
        <div className="sectionhead">
          <div>
            <div className="eyebrow">Customer feedback</div>
            <h2>Reviews & ratings</h2>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="panel flex min-h-[160px] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <ProductReviews
            product={product}
            reviews={reviews}
            onSubmitReview={onSubmitReview}
          />
        )}
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="sectionhead">
            <h2>You may also like</h2>
            <Link
              to="/products"
              className="text-sm font-extrabold text-[var(--primary)] hover:underline"
            >
              View all →
            </Link>
          </div>

          <RelatedProducts
            products={relatedProducts}
            currentProductId={currentProductId}
            onProductSelect={handleProductSelect}
          />
        </section>
      )}
    </main>
  );
};

export default ProductDetails;
