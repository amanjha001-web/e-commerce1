import { useState } from "react";

const Image = ({
  src,
  alt = "",
  fallback = "/images/placeholder.png",
  className = "",
  containerClassName = "",
  loading = "lazy",
  objectFit = "cover",
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);

  const handleLoad = (event) => {
    setIsLoading(false);
    onLoad?.(event);
  };

  const handleError = (event) => {
    setIsLoading(false);

    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
    }

    onError?.(event);
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800"
          aria-hidden="true"
        />
      )}

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`h-full w-full transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          } ${
            objectFit === "contain" ? "object-contain" : "object-cover"
          } ${className}`}
          {...props}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 ${className}`}
        >
          No Image
        </div>
      )}
    </div>
  );
};

export default Image;
