import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import useAuth from "../../hooks/useAuth";
import { addCartProduct } from "../../store/slices/cartThunk";
import {
  addWishlistProduct,
  removeWishlistProduct,
} from "../../store/slices/wishlistThunk";

const getCategoryIcon = (categoryName = "") => {
  const lower = String(categoryName).toLowerCase();
  if (lower.includes("fashion") || lower.includes("cloth")) return "👜";
  if (lower.includes("home") || lower.includes("living")) return "💡";
  if (lower.includes("electr") || lower.includes("audio")) return "🎧";
  if (lower.includes("access") || lower.includes("watch")) return "⌚";
  if (lower.includes("beauty") || lower.includes("skin")) return "🧴";
  if (lower.includes("shoe") || lower.includes("foot")) return "👟";
  return "🛍️";
};

const ProductCard = ({
  product,
  onAddToCart,
  onWishlist,
  isWishlisted = false,
  loading = false,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [addingToCart, setAddingToCart] = useState(false);
  const [imgError, setImgError] = useState(false);

  const rawRole =
    user?.role?.name ||
    user?.role?.roleName ||
    user?.role ||
    user?.userRole ||
    "";
  const role = String(rawRole).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const isAdmin = ["admin", "superadmin", "super_admin"].includes(role);
  const isVendor = ["vendor", "seller"].includes(role);
  const isCustomer = ["customer", "user"].includes(role) || (!isAdmin && !isVendor);

  if (!product) {
    return null;
  }

  const productId = product._id || product.id || product.slug;
  const productName = product.name || product.title || "Product";

  const image =
    (typeof product.thumbnail === "string"
      ? product.thumbnail
      : product.thumbnail?.url) ||
    product.image?.url ||
    (typeof product.image === "string" ? product.image : "") ||
    (Array.isArray(product.images) && product.images.length > 0
      ? (typeof (product.images.find((img) => img?.isDefault) || product.images[0]) === "string"
          ? (product.images.find((img) => img?.isDefault) || product.images[0])
          : (product.images.find((img) => img?.isDefault) || product.images[0])?.url)
      : "") ||
    "";

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "";

  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || product.salePrice || 0);
  const comparePrice = Number(
    product.compareAtPrice ||
      product.old ||
      product.oldPrice ||
      product.originalPrice ||
      product.mrp ||
      0,
  );

  const hasDiscount = price > 0 && discountPrice > 0 && discountPrice < price;
  const displayPrice = hasDiscount ? discountPrice : price;
  const fallbackOldPrice =
    displayPrice >= 100
      ? Math.ceil((displayPrice * 1.3) / 100) * 100 - 1
      : displayPrice > 0
        ? Math.round(displayPrice * 1.3)
        : 0;
  const oldPrice = hasDiscount
    ? price
    : comparePrice > displayPrice
      ? comparePrice
      : fallbackOldPrice;

  const discountPercentage =
    hasDiscount && price > 0
      ? Math.round(((price - displayPrice) / price) * 100)
      : comparePrice > displayPrice && comparePrice > 0
        ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
        : Number(product.discountPercentage ?? product.discount ?? 0);

  const stock = Number(product.stock ?? product.quantity ?? 1);

  const isOutOfStock =
    product.inStock === false ||
    product.isActive === false ||
    product.status === "draft" ||
    stock <= 0;

  const rating = Number(product.rating ?? product.averageRating ?? 0);
  const reviewCount = Number(
    product.numReviews ?? product.reviewCount ?? product.totalReviews ?? 0,
  );

  const badges = [];

  if (product.tag) {
    badges.push({ type: "tag", text: product.tag });
  } else if (product.isBestSeller || product.bestSeller) {
    badges.push({ type: "best_seller", text: "BESTSELLER" });
  } else if (product.isNewArrival || product.newArrival) {
    badges.push({ type: "new_arrival", text: "NEW" });
  } else if (product.isTrending || product.trending) {
    badges.push({ type: "trending", text: "TRENDING" });
  } else if (product.isFlashSale || product.flashSale) {
    badges.push({ type: "flash_sale", text: "SALE" });
  } else if (product.isFeatured || product.featured) {
    badges.push({ type: "featured", text: "POPULAR" });
  } else if (discountPercentage > 0) {
    badges.push({ type: "discount", text: `${discountPercentage}% OFF` });
  }

  const handleAddToCart = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!productId || addingToCart || isOutOfStock) {
      return;
    }

    if (onAddToCart) {
      setAddingToCart(true);
      try {
        await onAddToCart(product);
      } finally {
        setAddingToCart(false);
      }
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

    setAddingToCart(true);

    try {
      const result = await dispatch(addCartProduct(productId, 1));

      if (result?.success) {
        toast.success("Added to cart");
      } else {
        toast.error(result?.message || "Unable to add product to cart");
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Unable to add product to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistClick = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (onWishlist) {
      onWishlist(product);
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please sign in as a customer to manage your wishlist");
      navigate("/login");
      return;
    }

    if (!isCustomer || isAdmin || isVendor) {
      toast.error("Wishlist is only available for customer accounts");
      return;
    }

    if (isWishlisted) {
      dispatch(removeWishlistProduct(productId));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addWishlistProduct(productId));
      toast.success("Added to wishlist");
    }
  };

  const fallbackIcon = product.icon || getCategoryIcon(categoryName);

  return (
    <article className="product group">
      {/* Product Visual Container (exact 175px height from reference) */}
      <Link
        to={`/products/${productId}`}
        className="productvisual cursor-pointer"
        aria-label={`View ${productName}`}
      >
        {image && !imgError ? (
          <img
            src={image}
            alt={productName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span aria-label="Product icon">{fallbackIcon}</span>
        )}

        {/* Floating Tag */}
        {badges.length > 0 && <span className="tag">{badges[0].text}</span>}

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
      </Link>

      {/* Product Body (exact 14px padding & 4-row layout from reference) */}
      <div className="productbody">
        <div className="rating">
          ★★★★★{" "}
          <span className="muted">
            ({rating > 0 ? rating.toFixed(1) : reviewCount > 0 ? "0.0" : "4.8"})
            {reviewCount > 0 ? ` · ${reviewCount}` : ""}
          </span>
        </div>

        <Link to={`/products/${productId}`} className="block">
          <h3 className="line-clamp-1 transition-colors group-hover:text-[var(--primary)]">
            {productName}
          </h3>
        </Link>

        <div>
          <span className="price">
            ₹{Number(displayPrice).toLocaleString("en-IN")}
          </span>
          {oldPrice > displayPrice && (
            <span className="oldprice">
              ₹{Number(oldPrice).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="productactions">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isOutOfStock}
            className="primarybtn disabled:opacity-50"
          >
            {addingToCart
              ? "Adding..."
              : isOutOfStock
                ? "Sold out"
                : "Add to cart"}
          </button>

          <button
            type="button"
            onClick={handleWishlistClick}
            disabled={loading}
            aria-label={
              isWishlisted
                ? `Remove ${productName} from wishlist`
                : `Add ${productName} to wishlist`
            }
            title={isWishlisted ? "In wishlist" : "Add to wishlist"}
            className={`outlinebtn ${
              isWishlisted
                ? "!border-[var(--primary)] !bg-[var(--soft)] !text-[var(--primary)]"
                : ""
            }`}
          >
            {isWishlisted ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
