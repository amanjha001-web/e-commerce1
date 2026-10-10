import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const isWishlisted = wishlistItems.some(
    (item) =>
      String(getWishlistProductId(item) || "") ===
      String(currentProductId || ""),
  );

  // Load product details from the API.
  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      if (!productId) {
        setFetchedProduct(null);
        setProductError("Product ID is missing.");
        setProductLoading(false);
        return;
      }

      setProductLoading(true);
      setProductError("");
      setFetchedProduct(null);
      setFetchedRelatedProducts([]);
      setSelectedVariant(null);
      setQuantity(1);

      try {
        const response = await productService.getProductById(productId);

        const fetched = getProductFromResponse(response);

        if (!fetched) {
          throw new Error(
            response?.message || "Product details could not be loaded.",
          );
        }

        if (cancelled) return;

        setFetchedProduct(fetched);

        setSelectedVariant(
          fetched.selectedVariant || fetched.variants?.[0] || null,
        );

        try {
          const relatedResponse =
            await productService.getRelatedProducts(productId);

          if (!cancelled) {
            setFetchedRelatedProducts(getProductsFromResponse(relatedResponse));
          }
        } catch (error) {
          console.error("Failed to load related products:", error);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchedProduct(null);
          setProductError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load this product.",
          );
        }
      } finally {
        if (!cancelled) {
          setProductLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Fetch the current user's wishlist from the backend.
  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const variants = product?.variants || [];

  const currentPrice = useMemo(() => {
    if (selectedVariant?.price != null) {
      return selectedVariant.price;
    }

    return product?.discountPrice ?? product?.salePrice ?? product?.price ?? 0;
  }, [product, selectedVariant]);

  const stock = Number(
    selectedVariant?.stock ?? product?.stock ?? product?.quantity ?? 0,
  );

  const isOutOfStock =
    product?.inStock === false ||
    product?.available === false ||
    product?.isActive === false ||
    product?.status === "draft" ||
    stock <= 0;

  const handleNavigate = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleQuantityChange = (value) => {
    const nextQuantity = Math.max(
      1,
      Math.min(Number(value) || 1, stock > 0 ? stock : 1),
    );

    setQuantity(nextQuantity);
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  // Add to cart.
  const handleAddToCart = async (payload) => {
    if (!product || !currentProductId || isOutOfStock) {
      return;
    }

    const requestedQuantity = Number(payload?.quantity || quantity);

    setAddingToCart(true);

    try {
      if (onAddToCart) {
        await onAddToCart({
          product,
          variant: selectedVariant,
          quantity: requestedQuantity,
        });
      } else {
        const result = await dispatch(
          addCartProduct(currentProductId, requestedQuantity),
        );

        if (!result?.success) {
          console.error(
            "Add to cart failed:",
            result?.message || "Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  // Toggle wishlist using the existing Redux thunks.
  const handleToggleWishlist = async (selectedProduct) => {
    const targetProduct = selectedProduct || product;

    const targetId =
      targetProduct?._id || targetProduct?.id || targetProduct?.productId;

    if (!targetId || wishlistBusy) {
      return;
    }

    setWishlistBusy(true);

    try {
      // Preserve a callback if a parent explicitly supplies one.
      if (onToggleWishlist) {
        await onToggleWishlist(targetProduct);
        return;
      }

      const alreadyWishlisted = wishlistItems.some(
        (item) => String(getWishlistProductId(item) || "") === String(targetId),
      );

      if (alreadyWishlisted) {
        const result = await dispatch(removeWishlistProduct(targetId));

        if (!result?.success) {
          console.error(
            "Remove from wishlist failed:",
            result?.message || "Please try again.",
          );
        }
      } else {
        const result = await dispatch(addWishlistProduct(targetId));

        if (!result?.success) {
          console.error(
            "Add to wishlist failed:",
            result?.message || "Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Wishlist action failed:", error);
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleBuyNow = () => {
    onBuyNow?.({
      product,
      variant: selectedVariant,
      quantity,
    });
  };

  const handleProductSelect = (selectedProduct) => {
    if (onProductSelect) {
      onProductSelect(selectedProduct);
      return;
    }

    const selectedId =
      selectedProduct?._id || selectedProduct?.id || selectedProduct?.productId;

    if (selectedId) {
      navigate(`/products/${selectedId}`);
    }
  };

  if (loadingProp || productLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <Loader />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 py-10">
        <EmptyState
          title="Product not found"
          description={
            productError ||
            "The product you're looking for is unavailable or may have been removed."
          }
        />

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => handleNavigate("/products")}>
            Browse Products
          </Button>

          <Button onClick={() => navigate(0)}>Try Again</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => handleNavigate("/products")}
        className="mb-6 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Products
      </button>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          <ProductGallery product={product} />
        </div>

        <div className="flex min-w-0 flex-col">
          <ProductInfo product={product} />

          <div className="mt-4">
            <ProductRating
              rating={product.rating ?? product.averageRating ?? 0}
              reviewCount={
                product.reviewCount ??
                product.totalReviews ??
                product.reviewsCount ??
                reviews.length
              }
            />
          </div>

          <div className="mt-5">
            <ProductPrice product={product} price={currentPrice} />
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          {product.description && (
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="font-semibold">Description</h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}

          {variants.length > 0 && (
            <div className="mt-6 border-t border-border pt-6">
              <ProductVariants
                variants={variants}
                selectedVariant={selectedVariant}
                onChange={handleVariantChange}
              />
            </div>
          )}

          <div className="mt-6 border-t border-border pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProductQuantity
                quantity={quantity}
                value={quantity}
                min={1}
                max={stock > 0 ? stock : 1}
                onChange={handleQuantityChange}
                disabled={isOutOfStock || actionLoading || addingToCart}
              />

              <div className="flex flex-1 flex-wrap gap-3">
                <ProductActions
                  product={product}
                  quantity={quantity}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onWishlist={handleToggleWishlist}
                  isWishlisted={isWishlisted}
                  loading={
                    actionLoading ||
                    addingToCart ||
                    wishlistBusy ||
                    wishlistActionLoading
                  }
                  disabled={isOutOfStock}
                />
              </div>
            </div>

            {isOutOfStock && (
              <p className="mt-4 text-sm font-medium text-destructive">
                This product is currently unavailable for purchase.
              </p>
            )}
          </div>

          {(product.brand ||
            product.category ||
            product.vendor ||
            product.seller) && (
            <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
              {product.brand && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Brand</p>

                  <p className="mt-1 text-sm font-medium">
                    {product.brand?.name || product.brand}
                  </p>
                </div>
              )}

              {product.category && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Category</p>

                  <p className="mt-1 text-sm font-medium">
                    {product.category?.name || product.category}
                  </p>
                </div>
              )}

              {(product.vendor || product.seller) && (
                <div className="rounded-xl bg-muted/50 p-4 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Sold By</p>

                  <p className="mt-1 text-sm font-medium">
                    {product.vendor?.storeName ||
                      product.vendor?.fullName ||
                      product.vendor?.name ||
                      product.seller?.storeName ||
                      product.seller?.name ||
                      (typeof product.vendor === "string"
                        ? product.vendor
                        : "") ||
                      (typeof product.seller === "string"
                        ? product.seller
                        : "") ||
                      "Seller"}
                  </p>
                </div>
              )}
            </div>
          )}

          {product.sku && (
            <p className="mt-4 text-xs text-muted-foreground">
              SKU: {product.sku}
            </p>
          )}

          {product.stock != null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Available stock: {product.stock}
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold sm:text-2xl">Customer Reviews</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            See what customers are saying about this product.
          </p>
        </div>

        {reviewsLoading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-border bg-card">
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

      {relatedProducts.length > 0 && (
        <section className="mt-12 border-t border-border pt-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold sm:text-2xl">Related Products</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              You may also like these products.
            </p>
          </div>

          <RelatedProducts
            products={relatedProducts}
            onProductSelect={handleProductSelect}
          />
        </section>
      )}
    </main>
  );
};

export default ProductDetails;
