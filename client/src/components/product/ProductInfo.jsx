import ProductBadge from "./ProductBadge";
import ProductPrice from "./ProductPrice";
import ProductRating from "./ProductRating";

const ProductInfo = ({ product, showDescription = true }) => {
  if (!product) {
    return null;
  }

  const name = product.name || product.title || "Product";

  const description = product.description || product.shortDescription || "";

  const category = product.category?.name || product.categoryName;

  const brand = product.brand?.name || product.brandName;

  const sku = product.sku || product.productCode;

  const rating = product.rating ?? product.averageRating ?? 0;

  const reviewCount =
    product.reviewCount ?? product.reviewsCount ?? product.reviews?.length ?? 0;

  const discount = product.discountPercentage ?? product.discount ?? 0;

  const stock = Number(product.stock ?? product.quantity ?? 0);

  const isOutOfStock = product.inStock === false || stock <= 0;

  return (
    <div className="space-y-4">
      {/* Category / Brand */}
      <div className="flex flex-wrap items-center gap-2">
        {category && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {category}
          </span>
        )}

        {brand && (
          <>
            <span className="text-gray-300 dark:text-gray-700">•</span>

            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {brand}
            </span>
          </>
        )}
      </div>

      {/* Product Name */}
      <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl dark:text-white">
        {name}
      </h1>

      {/* Rating */}
      <ProductRating rating={rating} reviewCount={reviewCount} />

      {/* Price */}
      <div className="pt-1">
        <ProductPrice product={product} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {discount > 0 && (
          <ProductBadge type="discount" text={`${discount}% OFF`} />
        )}

        {product.isNew && <ProductBadge type="new" />}

        {product.isFeatured && <ProductBadge type="featured" />}

        {product.isBestSeller && <ProductBadge type="bestseller" />}

        {isOutOfStock && <ProductBadge type="out_of_stock" />}
      </div>

      {/* Description */}
      {showDescription && description && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Description
          </h2>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      )}

      {/* Product Details */}
      <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {brand && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Brand</span>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {brand}
              </p>
            </div>
          )}

          {category && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Category</span>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {category}
              </p>
            </div>
          )}

          {sku && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">SKU</span>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {sku}
              </p>
            </div>
          )}

          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Availability
            </span>

            <p
              className={`mt-1 font-medium ${
                isOutOfStock
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock"
                : stock > 0
                  ? `${stock} available`
                  : "In Stock"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
