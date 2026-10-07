import { Link } from "react-router-dom";

import ProductBadge from "./ProductBadge";
import ProductPrice from "./ProductPrice";
import ProductRating from "./ProductRating";

const ProductCard = ({
  product,
  onAddToCart,
  onWishlist,
  isWishlisted = false,
  loading = false,
}) => {
  if (!product) {
    return null;
  }

  const productId = product._id || product.id || product.slug;
  const productName = product.name || product.title || "Product";

  // Product image
  const image =
    product.thumbnail?.url ||
    product.image ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    "";

  // Category
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "";

  // Brand
  const brandName =
    typeof product.brand === "object"
      ? product.brand?.name
      : product.brand || "";

  // Short description
  const shortDescription =
    product.shortDescription || product.description || "";

  // Pricing
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);

  const hasDiscount = price > 0 && discountPrice > 0 && discountPrice < price;

  const discountPercentage = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : Number(product.discountPercentage ?? product.discount ?? 0);

  // Stock
  const stock = Number(product.stock ?? product.quantity ?? 0);

  const isOutOfStock = product.inStock === false || stock <= 0;

  // Rating
  const rating = Number(product.averageRating ?? product.rating ?? 0);

  const reviewCount = Number(
    product.totalReviews ?? product.reviewCount ?? product.reviewsCount ?? 0,
  );

  // Product badges
  const badges = [];

  if (product.bestSeller) {
    badges.push({
      type: "best_seller",
      text: "Best Seller",
    });
  }

  if (product.newArrival) {
    badges.push({
      type: "new_arrival",
      text: "New",
    });
  }

  if (product.trending) {
    badges.push({
      type: "trending",
      text: "Trending",
    });
  }

  if (product.flashSale) {
    badges.push({
      type: "flash_sale",
      text: "Flash Sale",
    });
  }

  if (product.featured && badges.length === 0) {
    badges.push({
      type: "featured",
      text: "Featured",
    });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      {/* =========================
          IMAGE
      ========================== */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Link
          to={`/products/${productId}`}
          className="block h-full w-full"
          aria-label={`View ${productName}`}
        >
          {image ? (
            <img
              src={image}
              alt={productName}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-4xl"
              aria-label="No product image available"
            >
              🛍️
            </div>
          )}
        </Link>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute left-3 top-3">
            <ProductBadge type="discount" text={`${discountPercentage}% OFF`} />
          </div>
        )}

        {/* Product Badges */}
        {badges.length > 0 && (
          <div className="absolute bottom-3 left-3 flex max-w-[70%] flex-wrap gap-1.5">
            {badges.slice(0, 2).map((badge) => (
              <ProductBadge
                key={badge.type}
                type={badge.type}
                text={badge.text}
              />
            ))}
          </div>
        )}

        {/* Out of Stock */}
        {isOutOfStock && (
          <div className="absolute right-3 top-3">
            <ProductBadge type="out_of_stock" />
          </div>
        )}

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => onWishlist?.(product)}
          disabled={loading}
          aria-label={
            isWishlisted
              ? `Remove ${productName} from wishlist`
              : `Add ${productName} to wishlist`
          }
          aria-pressed={isWishlisted}
          className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 ${
            isWishlisted
              ? "text-red-500"
              : "text-gray-500 hover:text-red-500 dark:text-gray-300"
          }`}
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {isWishlisted ? "♥" : "♡"}
          </span>
        </button>
      </div>

      {/* =========================
          CONTENT
      ========================== */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category & Brand */}
        {(categoryName || brandName) && (
          <div className="flex items-center justify-between gap-2">
            {categoryName ? (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {categoryName}
              </p>
            ) : (
              <span />
            )}

            {brandName && (
              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                {brandName}
              </p>
            )}
          </div>
        )}

        {/* Product Name */}
        <Link to={`/products/${productId}`} className="mt-1">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {productName}
          </h3>
        </Link>

        {/* Short Description */}
        {shortDescription && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {shortDescription}
          </p>
        )}

        {/* Rating */}
        <div className="mt-2">
          <ProductRating rating={rating} reviewCount={reviewCount} />
        </div>

        {/* Price */}
        <div className="mt-3">
          <ProductPrice product={product} />
        </div>

        {/* Stock Status */}
        <div className="mt-2 min-h-5">
          {isOutOfStock ? (
            <p className="text-xs font-medium text-red-500">Out of stock</p>
          ) : stock <= 5 ? (
            <p className="text-xs font-medium text-orange-500">
              Only {stock} left in stock
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">In stock</p>
          )}
        </div>

        {/* Add To Cart */}
        <button
          type="button"
          onClick={() => onAddToCart?.(product)}
          disabled={loading || isOutOfStock}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
        >
          {loading
            ? "Adding..."
            : isOutOfStock
              ? "Out of Stock"
              : "Add to Cart"}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
