import { useState } from "react";
import ProductImage from "./ProductImage";

const ProductGallery = ({ images = [], product }) => {
  const productImages =
    images.length > 0
      ? images
      : product?.images?.length
        ? product.images
        : product?.thumbnail
          ? [product.thumbnail]
          : product?.image
            ? [product.image]
            : [];

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
      <div className="detailvisual">
        {product?.icon || "🛍️"}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="detailvisual">
        <ProductImage
          src={activeImage}
          alt={product?.name || product?.title || "Product"}
          className="max-h-[420px] w-full object-contain"
        />
      </div>

      {normalizedImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2.5 sm:grid-cols-6">
          {normalizedImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`aspect-square overflow-hidden rounded-xl border-2 bg-white transition ${
                safeIndex === index
                  ? "border-[var(--primary)] shadow-xs"
                  : "border-[var(--line)] hover:border-[var(--primary)]/50"
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

