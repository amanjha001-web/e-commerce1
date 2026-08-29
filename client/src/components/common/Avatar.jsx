const Avatar = ({
  src,
  alt = "User avatar",
  name = "",
  size = "md",
  fallback,
  className = "",
}) => {
  const sizes = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
    "2xl": "h-20 w-20 text-2xl",
  };

  const getInitials = (value) => {
    if (!value) return "?";

    const words = value.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  };

  const initials = fallback || getInitials(name);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200 ${
        sizes[size] || sizes.md
      } ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling.style.display = "flex";
          }}
        />
      ) : null}

      <span
        className="absolute inset-0 hidden items-center justify-center"
        style={{
          display: src ? "none" : "flex",
        }}
        aria-hidden={src ? "true" : "false"}
      >
        {initials}
      </span>
    </div>
  );
};

export default Avatar;
