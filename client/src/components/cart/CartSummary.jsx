import { Link } from "react-router-dom";

const CartSummary = ({
  subtotal = 0,
  discount = 0,
  shipping = 0,
  tax = 0,
  total = 0,
  itemCount = 0,
  checkoutPath = "/checkout",
  showCheckout = true,
  loading = false,
}) => {
  const formatPrice = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
      <h2 className="text-lg font-bold text-[var(--text)] dark:text-foreground">
        Order summary
      </h2>

      <div className="mt-5 space-y-3.5 text-xs text-[var(--muted)]">
        <div className="flex items-center justify-between">
          <span>Subtotal {itemCount > 0 ? `(${itemCount} items)` : ""}</span>
          <b className="text-[var(--text)] text-sm dark:text-foreground">
            {formatPrice(subtotal)}
          </b>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-[#16845b]">
            <span>Coupon discount</span>
            <b className="text-sm">- {formatPrice(discount)}</b>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <b className="text-[var(--text)] text-sm dark:text-foreground">
            {subtotal > 999 || shipping === 0 ? "FREE" : formatPrice(shipping)}
          </b>
        </div>

        {tax > 0 && (
          <div className="flex items-center justify-between">
            <span>Tax (GST)</span>
            <b className="text-[var(--text)] text-sm dark:text-foreground">
              {formatPrice(tax)}
            </b>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-[var(--line)]" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--text)] dark:text-foreground">
          Total
        </span>

        <span className="text-2xl font-black text-[var(--primary)]">
          {formatPrice(total)}
        </span>
      </div>

      {showCheckout && (
        <Link
          to={checkoutPath}
          className={`primarybtn mt-5 w-full !py-3 !text-sm !rounded-xl ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {loading ? "Processing..." : "Proceed to checkout →"}
        </Link>
      )}
    </div>
  );
};

export default CartSummary;
