import { forwardRef } from "react";

const Button = forwardRef(
  (
    {
      children,
      type = "button",
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

    const resolvedVariant =
      variant !== "primary"
        ? variant
        : className.includes("outlinebtn") ||
            (className.includes("btnsm") && !className.includes("primary"))
          ? "outline"
          : className.includes("dangerbtn")
            ? "danger"
            : className.includes("goldbtn")
              ? "gold"
              : variant;

    const variants = {
      primary:
        "bg-[var(--primary)] text-white shadow-md shadow-[#88133725] hover:bg-[var(--deep)] hover:text-white hover:-translate-y-0.5 focus:ring-[var(--primary)]",

      gold:
        "bg-[var(--gold)] text-white shadow-md shadow-[#b68d4025] hover:bg-[#a37c35] hover:text-white hover:-translate-y-0.5 focus:ring-[var(--gold)]",

      secondary:
        "bg-[var(--soft)] text-[var(--primary)] hover:bg-[#edd8df] hover:text-[var(--primary)] focus:ring-[var(--primary)]",

      danger:
        "bg-[#fff0f1] text-[var(--red)] border border-[#f3cbd0] hover:bg-[#ffe3e6] hover:text-[var(--red)] focus:ring-[var(--red)]",

      success:
        "bg-[#e7f6ef] text-[var(--green)] border border-[#c3ebda] hover:bg-[#d8f2e6] hover:text-[var(--green)] focus:ring-[var(--green)]",

      outline:
        "border border-[var(--line)] bg-white text-[var(--text)] hover:bg-[var(--soft)] hover:border-[var(--primary)] hover:text-[var(--primary)] focus:ring-[var(--primary)]",

      ghost:
        "bg-transparent text-[var(--text)] hover:bg-[var(--soft)] hover:text-[var(--primary)] focus:ring-[var(--primary)]",

      link: "bg-transparent text-[var(--primary)] hover:underline focus:ring-0 p-0",
    };

    const sizes = {
      xs: "px-2.5 py-1 text-xs rounded-lg",
      sm: "px-3 py-1.5 text-xs font-semibold rounded-lg",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
      xl: "px-6 py-3.5 text-lg",
    };

    const width = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[resolvedVariant] || variants.primary} ${sizes[size] || sizes.md} ${width} ${className}`}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}

        {loading ? "Please wait..." : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
