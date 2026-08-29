
import { useEffect, useSyncExternalStore } from "react";
import ProductCard from "./ProductCard";

const STORAGE_KEY = "shopsphere_recently_viewed";
const MAX_ITEMS = 8;

const getRecentProducts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      "Failed to load recently viewed products:",
      error,
    );

    return [];
  }
};

const subscribe = (callback) => {
  const handleStorageChange = (event) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(
      "storage",
      handleStorageChange,
    );
  };
};

const RecentlyViewed = ({
  product,
  products = [],
  onAddToCart,
  onWishlist,
  wishlistIds = [],
}) => {
  const recentProducts = useSyncExternalStore(
    subscribe,
    getRecentProducts,
    () => [],
  );

  // Save current product to localStorage.
  useEffect(() => {
    if (!product) return;

    const currentId =
      product._id || product.id || product.slug;

    if (!currentId) return;

    try {
      const stored = getRecentProducts();

      const filtered = stored.filter((item) => {
        const itemId =
          item?._id || item?.id || item?.slug;

        return itemId !== currentId;
      });

      const updated = [product, ...filtered].slice(
        0,
        MAX_ITEMS,
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated),
      );

      // Notify subscribers in the same tab.
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
        }),
      );
    } catch (error) {
      console.error(
        "Failed to save recently viewed products:",
        error,
      );
    }
  }, [product]);

  const currentId =
    product?._id || product?.id || product?.slug;

  // Use externally supplied products when available.
  const externalProducts =
    products.length > 0 ? products : recentProducts;

  // Remove current product from the list.
  const visibleProducts = externalProducts
    .filter((item) => {
      const id =
        item?._id || item?.id || item?.slug;

      return id !== currentId;
    })
    .slice(0, MAX_ITEMS);

  if (!visibleProducts.length) {
    return null;
  }

  const handleClear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
        }),
      );
    } catch (error) {
      console.error(
        "Failed to clear recently viewed products:",
        error,
      );
    }
  };

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recently Viewed
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Products you viewed recently
          </p>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-medium text-gray-500 transition hover:text-red-500 dark:text-gray-400"
        >
          Clear
        </button>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visibleProducts.map((item, index) => {
          const id =
            item?._id || item?.id || item?.slug;

          return (
            <ProductCard
              key={id || index}
              product={item}
              onAddToCart={onAddToCart}
              onWishlist={onWishlist}
              wishlistIds={wishlistIds}
              isWishlisted={wishlistIds.includes(id)}
            />
          );
        })}
      </div>
    </section>
  );
};

export default RecentlyViewed;
