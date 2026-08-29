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

  const image =
    product.thumbnail ||
    product.image ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    "";

  const stock = Number(product.stock ?? product.quantity ?? 0);

  const isOutOfStock = product.inStock === false || stock <= 0;

  const discount = product.discountPercentage ?? product.discount ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Link to={`/products/${productId}`} className="block h-full w-full">
          {image ? (
            <img
              src={image}
              alt={productName}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              🛍️
            </div>
          )}
        </Link>

        {discount > 0 && (
          <div className="absolute left-3 top-3">
            <ProductBadge type="discount" text={`${discount}% OFF`} />
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute right-3 top-3">
            <ProductBadge type="out_of_stock" />
          </div>
        )}

        <button
          type="button"
          onClick={() => onWishlist?.(product)}
          disabled={loading}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105 disabled:opacity-50 dark:bg-gray-900 ${
            isWishlisted ? "text-red-500" : "text-gray-500 dark:text-gray-300"
          }`}
        >
          {isWishlisted ? "♥" : "♡"}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {product.category.name}
          </p>
        )}

        <Link to={`/products/${productId}`} className="mt-1">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
            {productName}
          </h3>
        </Link>

        <div className="mt-2">
          <ProductRating
            rating={product.rating ?? product.averageRating ?? 0}
            reviewCount={
              product.reviewCount ??
              product.reviewsCount ??
              product.reviews?.length ??
              0
            }
          />
        </div>

        <div className="mt-3">
          <ProductPrice product={product} />
        </div>

        <button
          type="button"
          onClick={() => onAddToCart?.(product)}
          disabled={loading || isOutOfStock}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
