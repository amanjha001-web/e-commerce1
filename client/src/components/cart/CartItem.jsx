import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
  updateCartProduct,
  removeCartProduct,
} from "../../store/slices/cartThunk";

const CartItem = ({ item, loading = false }) => {
  const dispatch = useDispatch();

  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [removingItem, setRemovingItem] = useState(false);

  if (!item) return null;

  const product = item.product || item;

  const productId =
    item.productId ||
    product._id ||
    product.id ||
    item._id;

  const image =
    product.thumbnail?.url ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    product.image ||
    "";

  const name = product.name || product.title || "Product";

  const price = Number(
    item.priceAtPurchase ??
      item.price ??
      product.finalPrice ??
      product.price ??
      0,
  );

  const quantity = Math.max(1, Number(item.quantity) || 1);
  const subtotal = price * quantity;

  const isUpdating = loading || updatingQuantity || removingItem;

  // Update quantity through Redux and backend PATCH API.
  const handleQuantityChange = async (nextQuantity) => {
    if (
      !productId ||
      !Number.isInteger(nextQuantity) ||
      nextQuantity < 1 ||
      nextQuantity === quantity ||
      isUpdating
    ) {
      return;
    }

    setUpdatingQuantity(true);

    try {
      const result = await dispatch(
        updateCartProduct(productId, nextQuantity),
      );

      if (!result?.success) {
        console.error(
          "Quantity update failed:",
          result?.message || "Please try again.",
        );
      }
    } catch (error) {
      console.error("Quantity update failed:", error);
    } finally {
      setUpdatingQuantity(false);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    handleQuantityChange(quantity + 1);
  };

  // Remove product through Redux and backend DELETE API.
  const handleRemove = async () => {
    if (!productId || isUpdating) return;

    setRemovingItem(true);

    try {
      const result = await dispatch(removeCartProduct(productId));
      if (!result?.success) {
        console.error(
          "Failed to remove item:",
          result?.message || "Please try again.",
        );
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setRemovingItem(false);
    }
  };

  return (
    <div className="flex gap-4 border-b border-[var(--line)] py-4 sm:gap-6">
      {/* Product visual thumbnail */}
      <Link
        to={`/products/${productId}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#f7e9ed] to-[#ead7dd] text-3xl sm:h-24 sm:w-24"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>🛍️</span>
        )}
      </Link>

      {/* Product details */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <Link
            to={`/products/${productId}`}
            className="line-clamp-1 text-sm font-bold text-[var(--text)] transition hover:text-[var(--primary)] dark:text-foreground"
          >
            {name}
          </Link>

          <p className="mt-0.5 text-xs text-[var(--muted)]">
            ₹{price.toLocaleString("en-IN")} each
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[var(--line)] bg-white dark:bg-card">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1 || isUpdating}
              className="flex h-7 w-7 items-center justify-center font-bold text-[var(--text)] transition hover:bg-[var(--soft)] disabled:opacity-30 cursor-pointer"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span className="min-w-8 text-center text-xs font-bold text-[var(--text)] dark:text-foreground">
              {isUpdating ? "…" : quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={isUpdating}
              className="flex h-7 w-7 items-center justify-center font-bold text-[var(--text)] transition hover:bg-[var(--soft)] disabled:opacity-30 cursor-pointer"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Price & Remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="text-sm font-black text-[var(--primary)]">
          ₹{subtotal.toLocaleString("en-IN")}
        </span>

        <button
          type="button"
          onClick={handleRemove}
          disabled={isUpdating}
          className="btnsm text-[11px] !py-1 !px-2.5"
        >
          {removingItem ? "..." : "Remove"}
        </button>
      </div>
    </div>
  );
};

export default CartItem;
