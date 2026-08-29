const Skeleton = ({
  width = "100%",
  height = "1rem",
  rounded = "md",
  count = 1,
  className = "",
}) => {
  const roundedStyles = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${
            roundedStyles[rounded] || roundedStyles.md
          }`}
          style={{
            width,
            height,
          }}
        />
      ))}
    </div>
  );
};

export default Skeleton;
