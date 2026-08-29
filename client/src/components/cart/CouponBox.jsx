import { useState } from "react";

const CouponBox = ({
  appliedCoupon = null,
  onApply,
  onRemove,
  loading = false,
  error = "",
  success = "",
  placeholder = "Enter coupon code",
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        Apply Coupon
      </h3>

      {appliedCoupon ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-900/50 dark:bg-green-950/30">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {appliedCoupon.code}
            </p>

            {appliedCoupon.discount !== undefined && (
              <p className="mt-0.5 text-xs text-green-600 dark:text-green-500">
                You saved ₹
                {Number(appliedCoupon.discount).toLocaleString("en-IN")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
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
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 uppercase outline-none transition placeholder:normal-case placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800"
          />

          <button
            type="submit"
            disabled={!couponCode.trim() || loading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Applying..." : "Apply"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {success && !error && (
        <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
          {success}
        </p>
      )}
    </div>
  );
};

export default CouponBox;
