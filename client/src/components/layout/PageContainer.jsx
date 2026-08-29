const PageContainer = ({ children, className = "", size = "default" }) => {
  const sizes = {
    sm: "max-w-3xl",
    default: "max-w-7xl",
    lg: "max-w-[1440px]",
    full: "max-w-none",
  };

  return (
    <main
      className={`mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 ${
        sizes[size] || sizes.default
      } ${className}`}
    >
      {children}
    </main>
  );
};

export default PageContainer;
