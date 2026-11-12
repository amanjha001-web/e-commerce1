const Badge = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}) => {
  const variants = {
    default: "bg-[var(--soft)] text-[var(--primary)] font-bold",
    pill: "bg-[var(--soft)] text-[var(--primary)] font-extrabold tracking-wide uppercase",
    primary: "bg-[var(--primary)] text-white font-bold",
    gold: "bg-[#fff8e9] text-[#76571d] border border-[#f0dfb9] font-bold",
    success: "bg-[#e7f6ef] text-[#16845b] font-bold",
    warning: "bg-[#fff4df] text-[#9b6814] font-bold",
    amber: "bg-[#fff4df] text-[#9b6814] font-bold",
    danger: "bg-[#ffeaec] text-[#bd3345] font-bold",
    red: "bg-[#ffeaec] text-[#bd3345] font-bold",
    info: "bg-[#ebf5fa] text-[#1d6b99] font-bold",
    secondary: "bg-[var(--soft)] text-[var(--primary)] font-bold",
    burgundy: "bg-[var(--primary)] text-white font-bold",
  };

  const sizes = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  };

  const dotColors = {
    default: "bg-[var(--primary)]",
    primary: "bg-white",
    gold: "bg-[#b68d40]",
    success: "bg-[#16845b]",
    warning: "bg-[#b7791f]",
    danger: "bg-[#c0394b]",
    info: "bg-[#1d6b99]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dotColors[variant] || dotColors.default
          }`}
          aria-hidden="true"
        />
      )}

      {children}
    </span>
  );
};

export default Badge;
