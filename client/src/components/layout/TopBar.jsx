import { Link } from "react-router-dom";

const TopBar = ({
  message = "LUXURY FINDS, EVERYDAY PRICES · FREE SHIPPING ON ORDERS ABOVE ₹999",
  leftContent,
  rightContent,
  showMessage = true,
  className = "",
}) => {
  return (
    <div
      className={`w-full bg-[var(--deep)] text-white text-xs font-medium tracking-wide ${className}`}
    >
      <div className="mx-auto flex min-h-7 sm:min-h-8 max-w-[1440px] items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-7">
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          {leftContent ||
            (showMessage && (
              <p className="truncate text-[10px] sm:text-xs text-white/90">
                {message}
              </p>
            ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5 text-[10px] sm:text-[11px] text-white/80">
          {rightContent || (
            <>
              <Link
                to="/support"
                className="hidden transition hover:text-white md:inline"
              >
                Help & Support
              </Link>

              <Link
                to="/orders"
                className="hidden transition hover:text-white sm:inline"
              >
                Track Order
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
