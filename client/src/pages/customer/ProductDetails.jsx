
import { useMemo, useState } from "react";

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

const ProductDetails = ({
  product = null,
  relatedProducts = [],
  reviews = [],
  loading = false,
  reviewsLoading = false,
  actionLoading = false,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onSubmitReview,
  onProductSelect,
  onNavigate,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product?.selectedVariant || product?.variants?.[0] || null
  );

  const variants = product?.variants || [];

  const currentPrice = useMemo(() => {
    if (selectedVariant?.price != null) {
      return selectedVariant.price;
    }

    return (
      product?.discountPrice ??
      product?.salePrice ??
      product?.price ??
      0
    );
  }, [product, selectedVariant]);

  const stock = Number(
    selectedVariant?.stock ??
      product?.stock ??
      product?.quantity ??
      0
  );

  const isOutOfStock =
    product?.inStock === false ||
    product?.available === false ||
    stock <= 0;

  const handleQuantityChange = (value) => {
    const nextQuantity = Math.max(
      1,
      Math.min(Number(value) || 1, stock > 0 ? stock : 1)
    );

    setQuantity(nextQuantity);
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    onAddToCart?.({
      product,
      variant: selectedVariant,
      quantity,
    });
  };

  const handleBuyNow = () => {
    onBuyNow?.({
      product,
      variant: selectedVariant,
      quantity,
    });
  };

  if (loading) {
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
          description="The product you're looking for is unavailable or may have been removed."
        />

        <div className="mt-6">
          <Button onClick={() => onNavigate?.("/products")}>
            Browse Products
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => onNavigate?.("/products")}
        className="mb-6 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Products
      </button>

      {/* Product */}
      <section className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="min-w-0">
          <ProductGallery product={product} />
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-col">
          <ProductInfo product={product} />

          <div className="mt-4">
            <ProductRating
              rating={
                product?.rating ??
                product?.averageRating ??
                0
              }
              reviewCount={
                product?.reviewCount ??
                product?.reviewsCount ??
                reviews.length
              }
            />
          </div>

          <div className="mt-5">
            <ProductPrice
              product={product}
              price={currentPrice}
            />
          </div>

          {product?.description && (
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="font-semibold">
                Description
              </h2>

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
                disabled={isOutOfStock || actionLoading}
              />

              <div className="flex flex-1 flex-wrap gap-3">
                <ProductActions
                  product={product}
                  variant={selectedVariant}
                  quantity={quantity}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onToggleWishlist={onToggleWishlist}
                  loading={actionLoading}
                  disabled={isOutOfStock}
                />
              </div>
            </div>

            {isOutOfStock && (
              <p className="mt-4 text-sm font-medium text-destructive">
                This product is currently out of stock.
              </p>
            )}
          </div>

          {(product?.brand ||
            product?.category ||
            product?.vendor ||
            product?.seller) && (
            <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
              {product?.brand && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Brand
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {product.brand?.name || product.brand}
                  </p>
                </div>
              )}

              {product?.category && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {product.category?.name ||
                      product.category}
                  </p>
                </div>
              )}

              {(product?.vendor || product?.seller) && (
                <div className="rounded-xl bg-muted/50 p-4 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Sold By
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {product?.vendor?.storeName ||
                      product?.vendor?.name ||
                      product?.seller?.storeName ||
                      product?.seller?.name ||
                      product?.vendor ||
                      product?.seller}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-12 border-t border-border pt-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold sm:text-2xl">
            Customer Reviews
          </h2>

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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 border-t border-border pt-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold sm:text-2xl">
              Related Products
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              You may also like these products.
            </p>
          </div>

          <RelatedProducts
            products={relatedProducts}
            onProductSelect={onProductSelect}
          />
        </section>
      )}
    </main>
  );
};

export default ProductDetails;
