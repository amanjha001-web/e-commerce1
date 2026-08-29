import { useState } from "react";

const ProductActions = ({
  product,
  quantity = 1,
  onAddToCart,
  onBuyNow,
  onWishlist,
  isWishlisted = false,
  loading = false,
}) => {
  const [added, setAdded] = useState(false);

  if (!product) {
    return null;
  }

  const stock = Number(
    product.stock ?? product.quantity ?? product.inventory ?? 0,
  );

  const isOutOfStock = product.inStock === false || stock <= 0;

  const handleAddToCart = async () => {
    if (loading || isOutOfStock || quantity < 1) {
      return;
    }

    await onAddToCart?.({
      product,
      quantity,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  const handleBuyNow = () => {
    if (loading || isOutOfStock || quantity < 1) {
      return;
    }

    onBuyNow?.({
      product,
      quantity,
    });
  };

  const handleWishlist = () => {
    if (loading) {
      return;
    }

    onWishlist?.(product);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock || quantity < 1}
          className="flex-1 rounded-lg border border-blue-600 px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
        >
          {loading
            ? "Adding..."
            : added
              ? "✓ Added to Cart"
              : isOutOfStock
                ? "Out of Stock"
                : "Add to Cart"}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={loading || isOutOfStock || quantity < 1}
          className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>

      <button
        type="button"
        onClick={handleWishlist}
        disabled={loading}
        className={`rounded-lg border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isWishlisted
            ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
            : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        {isWishlisted ? "♥ Remove from Wishlist" : "♡ Add to Wishlist"}
      </button>
    </div>
  );
};

export default ProductActions;
