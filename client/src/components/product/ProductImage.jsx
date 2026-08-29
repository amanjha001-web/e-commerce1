import { useState } from "react";

const ProductImage = ({
  src,
  alt = "Product",
  className = "",
  fallback = "🛍️",
}) => {
  const [hasError, setHasError] = useState(false);

  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-5xl dark:bg-gray-800 ${className}`}
        role="img"
        aria-label={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

export default ProductImage;
