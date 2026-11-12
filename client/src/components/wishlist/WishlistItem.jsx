import { useState } from "react";

const WishlistItem = ({
  item,
  product: productProp,
  onRemove,
  onAddToCart,
  onProductClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const product = productProp || item?.product || item;

  const productId = product?._id || product?.id;

  const name = product?.name || product?.title || "Unnamed Product";

  const image =
    (typeof product?.thumbnail === "string"
      ? product.thumbnail
      : product?.thumbnail?.url) ||
    product?.images?.[0]?.url ||
    (typeof product?.images?.[0] === "string" ? product.images[0] : "") ||
    product?.image?.url ||
    (typeof product?.image === "string" ? product.image : "");

  const price = Number(
    product?.discountPrice ??
      product?.salePrice ??
      product?.sellingPrice ??
      product?.price ??
      0,
  );

  const rawOriginalPrice = Number(
    product?.originalPrice ??
      product?.oldPrice ??
      product?.old ??
      product?.mrp ??
      product?.compareAtPrice ??
      product?.price ??
      0,
  );

  const fallbackOldPrice =
    price >= 100
      ? Math.ceil((price * 1.3) / 100) * 100 - 1
      : price > 0
        ? Math.round(price * 1.3)
        : 0;

  const originalPrice =
    rawOriginalPrice > price ? rawOriginalPrice : fallbackOldPrice;

  const discount =
    rawOriginalPrice > price && price > 0
      ? Math.round(((rawOriginalPrice - price) / rawOriginalPrice) * 100)
      : 0;

  const stock = Number(
    product?.stock ?? product?.quantity ?? product?.inventory?.stock ?? 1,
  );

  const isOutOfStock =
    product?.isOutOfStock || product?.inStock === false || stock <= 0;

  const rating = Number(product?.averageRating ?? product?.rating ?? 4.8);

  const handleProductClick = () => {
    onProductClick?.(product);
  };

  const handleRemove = (event) => {
    event.stopPropagation();
    onRemove?.(item || product);
  };

  const handleAddToCart = (event) => {
    event.stopPropagation();

    if (!isOutOfStock) {
      onAddToCart?.(product);
    }
  };

  return (
    <article className="product group">
      {/* Visual (exact 175px height from reference) */}
      <div
        onClick={handleProductClick}
        className="productvisual cursor-pointer"
      >
        {image && !imgError ? (
          <img
            src={image}
            alt={name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span>{product?.icon || "🛍️"}</span>
        )}

        {/* Tag / Discount */}
        {(product?.tag || discount > 0) && (
          <span className="tag">
            {product?.tag || `${discount}% OFF`}
          </span>
        )}

        {/* Out of stock */}
        {isOutOfStock && (
          <span
            className="tag"
            style={{
              left: "auto",
              right: "12px",
              background: "#ffeaec",
              color: "var(--red)",
            }}
          >
            SOLD OUT
          </span>
        )}
      </div>

      {/* Content */}
      <div className="productbody">
        <div className="rating">
          ★★★★★{" "}
          <span className="muted">
            ({rating > 0 ? rating.toFixed(1) : "4.8"})
          </span>
        </div>

        <button
          type="button"
          onClick={handleProductClick}
          className="block w-full text-left"
        >
          <h3 className="line-clamp-1 transition group-hover:text-[var(--primary)]">
            {name}
          </h3>
        </button>

        {/* Price */}
        <div>
          <span className="price">₹{price.toLocaleString("en-IN")}</span>

          {originalPrice > price && (
            <span className="oldprice">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="productactions">
          {onAddToCart && (
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="primarybtn disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isOutOfStock ? "Sold out" : "Add to cart"}
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${name} from wishlist`}
              className="outlinebtn border-[var(--primary)] bg-[var(--soft)] text-[var(--primary)]"
            >
              ♥
            </button>
          )}
        </div>

        {productId && <span className="sr-only">Product ID: {productId}</span>}
      </div>
    </article>
  );
};

export default WishlistItem;
