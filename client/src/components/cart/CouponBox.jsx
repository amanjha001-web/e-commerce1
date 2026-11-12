import { useState } from "react";

const CouponBox = ({
  appliedCoupon = null,
  onApply,
  onRemove,
  loading = false,
  error = "",
  success = "",
  placeholder = "Coupon code (e.g. WELCOME10)",
}) => {
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || "");

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
    await onRemove?.(appliedCoupon);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs dark:bg-card dark:border-line">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        Have a coupon?
      </h3>

      {appliedCoupon ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#c3ebda] bg-[#e7f6ef] px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#16845b]">
              {appliedCoupon.code}
            </p>

            {appliedCoupon.discount !== undefined && (
              <p className="mt-0.5 text-xs font-medium text-[#16845b]/80">
                You saved ₹
                {Number(appliedCoupon.discount).toLocaleString("en-IN")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="text-xs font-bold text-[var(--red)] hover:underline disabled:opacity-50"
          >
            Remove
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
    </div>
  );
};

export default CouponBox;
