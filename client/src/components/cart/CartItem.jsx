
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
    "/images/placeholder.png";

  const name = product.name || product.title || "Product";

  const price = Number(
    item.priceAtPurchase ??
      item.price ??
      product.finalPrice ??
      product.price ??
      0
  );

  const quantity = Math.max(1, Number(item.quantity) || 1);
  const subtotal = price * quantity;

  const isUpdating =
    loading || updatingQuantity || removingItem;

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
        updateCartProduct(productId, nextQuantity)
      );

      if (!result?.success) {
        console.error(
          "Quantity update failed:",
          result?.message || "Please try again."
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
          "Remove cart item failed:",
          result?.message || "Please try again."
        );
      }
    } catch (error) {
      console.error("Remove cart item failed:", error);
    } finally {
      setRemovingItem(false);
    }
  };

  return (
    <div className="flex gap-4 border-b border-gray-200 py-5 dark:border-gray-800">
      {/* Product image */}
      <Link
        to={`/products/${productId}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
      >
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/images/placeholder.png";
          }}
        />
      </Link>

      {/* Product details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/products/${productId}`}
              className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
            >
              {name}
            </Link>

            {item.variant && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {item.variant}
              </p>
            )}
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUpdating}
            className="shrink-0 text-sm text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removingItem ? "Removing..." : "Remove"}
          </button>
        </div>

        {/* Quantity and price */}
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1 || isUpdating}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span
              className="min-w-10 border-x border-gray-300 px-3 py-1.5 text-center text-sm text-gray-900 dark:border-gray-700 dark:text-white"
              aria-live="polite"
            >
              {isUpdating ? "…" : quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={isUpdating}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ₹{price.toLocaleString("en-IN")} each
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              ₹{subtotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
