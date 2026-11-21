import { useState, useEffect } from "react";

const CouponBox = ({
  appliedCoupon = null,
  coupon = null,
  discount = 0,
  availableCoupons = [],
  onApply,
  onRemove,
  loading = false,
  error = "",
  success = "",
  placeholder = "Coupon code (e.g. WELCOME10)",
}) => {
  const currentCoupon = appliedCoupon || coupon;
  const couponCodeString = typeof currentCoupon === "string" ? currentCoupon : currentCoupon?.code || "";
  const hasActiveCoupon = Boolean(couponCodeString && String(couponCodeString).trim().length > 0);
  const savedAmount = Math.max(0, Number(currentCoupon?.discount) || Number(discount) || 0);
  const [couponCode, setCouponCode] = useState(couponCodeString);

  useEffect(() => {
    if (hasActiveCoupon) {
      setCouponCode(couponCodeString);
    } else {
      setCouponCode("");
    }
  }, [hasActiveCoupon, couponCodeString]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const code = couponCode.trim().toUpperCase();

    if (!code || loading) {
      return;
    }

    await onApply?.(code);
  };

  const handleRemove = async () => {
    if (loading) {
      return;
    }

    setCouponCode("");
    await onRemove?.(currentCoupon);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs dark:bg-card dark:border-line">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        Have a coupon?
      </h3>

      {hasActiveCoupon ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#c3ebda] bg-[#e7f6ef] px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#16845b]">
              {couponCodeString}
            </p>

            {savedAmount > 0 && (
              <p className="mt-0.5 text-xs font-medium text-[#16845b]/80">
                You saved ₹
                {Number(savedAmount).toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="text-xs font-bold text-[var(--red)] hover:underline disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(event) =>
              setCouponCode(event.target.value.toUpperCase())
            }
            placeholder={placeholder}
            disabled={loading}
            className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-bold uppercase text-[var(--text)] outline-none transition placeholder:normal-case placeholder:font-normal placeholder:text-[var(--muted)]/70 focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 disabled:bg-gray-100 dark:bg-card"
          />

          <button
            type="submit"
            disabled={!couponCode.trim() || loading}
            className="outlinebtn !py-2 !px-4 !text-xs !rounded-xl"
          >
            {loading ? "Applying..." : "Apply coupon"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-[var(--red)]">
          {error}
        </p>
      )}

      {success && !error && (
        <p className="mt-2 text-xs font-medium text-[#16845b]">
          {success}
        </p>
      )}

      {!hasActiveCoupon && Array.isArray(availableCoupons) && availableCoupons.length > 0 && (
        <div className="mt-3 border-t border-[var(--line)] pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Available offers
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableCoupons.map((offer) => (
              <button
                key={offer._id || offer.id || offer.code}
                type="button"
                disabled={loading}
                onClick={() => onApply?.(offer.code)}
                className="cursor-pointer rounded-lg border border-dashed border-[var(--primary)]/50 bg-[var(--soft)]/60 px-2.5 py-1 text-left text-[11px] font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--soft)] disabled:opacity-50"
              >
                <span className="font-black text-[var(--primary)]">
                  {offer.code}
                </span>
                <span className="ml-1.5 text-[var(--muted)]">
                  · {offer.discountLabel}
                  {offer.minPurchaseAmount > 0
                    ? ` (Min ₹${offer.minPurchaseAmount})`
                    : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponBox;
