import { useState } from "react";
import ProductImage from "./ProductImage";

const ProductImages = ({ images = [], productName = "Product" }) => {
  const normalizedImages = images
    .map((image) => {
      if (typeof image === "string") {
        return image;
      }

      return image?.url || image?.secure_url || image?.src || image?.image;
    })
    .filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0);

  const currentIndex = activeIndex < normalizedImages.length ? activeIndex : 0;

  const activeImage = normalizedImages[currentIndex];

  if (!normalizedImages.length) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-100 text-6xl dark:bg-gray-800">
        🛍️
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Image */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <ProductImage
          src={activeImage}
          alt={productName}
          className="aspect-square h-full w-full object-contain"
        />
      </div>

      {/* Thumbnail Images */}
      {normalizedImages.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {normalizedImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={`aspect-square overflow-hidden rounded-lg border-2 bg-gray-50 transition dark:bg-gray-800 ${
                currentIndex === index
                  ? "border-blue-600"
                  : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <ProductImage
                src={image}
                alt={`${productName} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {normalizedImages.length > 1 && (
        <p className="mt-2 text-center text-xs text-gray-400">
          {currentIndex + 1} / {normalizedImages.length}
        </p>
      )}
    </div>
  );
};

export default ProductImages;
