import { useState } from "react";
import ProductImage from "./ProductImage";

const ProductGallery = ({ images = [], product }) => {
  const productImages = images.length > 0 ? images : product?.images || [];

  const normalizedImages = productImages
    .map((image) => {
      if (typeof image === "string") {
        return image;
      }

      return image?.url || image?.secure_url || image?.src || image?.image;
    })
    .filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0);

  const safeIndex = activeIndex < normalizedImages.length ? activeIndex : 0;

  const activeImage = normalizedImages[safeIndex];

  if (!normalizedImages.length) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-100 text-6xl dark:bg-gray-800">
        🛍️
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
        <ProductImage
          src={activeImage}
          alt={product?.name || product?.title || "Product"}
          className="aspect-square w-full object-contain"
        />
      </div>

      {normalizedImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {normalizedImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`aspect-square overflow-hidden rounded-lg border-2 bg-gray-50 transition dark:bg-gray-800 ${
                safeIndex === index
                  ? "border-blue-600"
                  : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
