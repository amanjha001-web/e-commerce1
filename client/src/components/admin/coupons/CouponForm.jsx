import { useState } from "react";

const INITIAL_FORM = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrderAmount: "",
  maximumDiscountAmount: "",
  usageLimit: "",
  usageLimitPerUser: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

const CouponForm = ({
  coupon = null,
  open = false,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = Boolean(coupon);

  const [form, setForm] = useState(() => {
    if (!coupon) {
      return INITIAL_FORM;
    }

    return {
      code: coupon?.code || coupon?.couponCode || "",
      description: coupon?.description || "",
      discountType: coupon?.discountType || coupon?.type || "percentage",
      discountValue:
        coupon?.discountValue ?? coupon?.value ?? coupon?.discount ?? "",
      minimumOrderAmount:
        coupon?.minimumOrderAmount ?? coupon?.minOrderAmount ?? "",
      maximumDiscountAmount:
        coupon?.maximumDiscountAmount ?? coupon?.maxDiscountAmount ?? "",
      usageLimit: coupon?.usageLimit ?? coupon?.maxUses ?? "",
      usageLimitPerUser:
        coupon?.usageLimitPerUser ?? coupon?.perUserLimit ?? "",
      startsAt: coupon?.startsAt ? String(coupon.startsAt).slice(0, 16) : "",
      expiresAt: coupon?.expiresAt ? String(coupon.expiresAt).slice(0, 16) : "",
      isActive:
        coupon?.isActive ?? coupon?.active ?? coupon?.status !== "inactive",
    };
  });

  const [errors, setErrors] = useState({});

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    const code = form.code.trim();
    const discountValue = Number(form.discountValue);

    if (!code) {
      nextErrors.code = "Coupon code is required.";
    } else if (code.length < 3) {
      nextErrors.code = "Coupon code must be at least 3 characters.";
    } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
      nextErrors.code = "Use only letters, numbers, hyphens or underscores.";
    }

    if (form.discountValue === "" || Number.isNaN(discountValue)) {
      nextErrors.discountValue = "Discount value is required.";
    } else if (discountValue <= 0) {
      nextErrors.discountValue = "Discount value must be greater than 0.";
    } else if (form.discountType === "percentage" && discountValue > 100) {
      nextErrors.discountValue = "Percentage discount cannot exceed 100%.";
    }

    if (form.minimumOrderAmount !== "" && Number(form.minimumOrderAmount) < 0) {
      nextErrors.minimumOrderAmount =
        "Minimum order amount cannot be negative.";
    }

    if (
      form.maximumDiscountAmount !== "" &&
      Number(form.maximumDiscountAmount) < 0
    ) {
      nextErrors.maximumDiscountAmount = "Maximum discount cannot be negative.";
    }

    if (form.usageLimit !== "" && Number(form.usageLimit) < 1) {
      nextErrors.usageLimit = "Usage limit must be at least 1.";
    }

    if (form.usageLimitPerUser !== "" && Number(form.usageLimitPerUser) < 1) {
      nextErrors.usageLimitPerUser = "Per-user limit must be at least 1.";
    }

    if (form.startsAt && form.expiresAt) {
      const start = new Date(form.startsAt);
      const end = new Date(form.expiresAt);

      if (end <= start) {
        nextErrors.expiresAt = "Expiry date must be after the start date.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      code: form.code.trim().toUpperCase(),

      description: form.description.trim(),

      discountType: form.discountType,

      discountValue: Number(form.discountValue),

      minimumOrderAmount:
        form.minimumOrderAmount === "" ? 0 : Number(form.minimumOrderAmount),

      maximumDiscountAmount:
        form.maximumDiscountAmount === ""
          ? null
          : Number(form.maximumDiscountAmount),

      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),

      usageLimitPerUser:
        form.usageLimitPerUser === "" ? null : Number(form.usageLimitPerUser),

      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,

      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,

      isActive: form.isActive,
    };

    if (coupon?._id || coupon?.id) {
      payload.id = coupon?._id || coupon?.id;
    }

    onSubmit?.(payload, coupon);
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

  const labelClasses = "mb-1.5 block text-xs font-medium text-foreground";

  const errorClasses = "mt-1 text-xs text-red-600";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {isEdit ? "Edit Coupon" : "Create Coupon"}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {isEdit
                ? "Update the coupon details below."
                : "Create a new discount coupon for customers."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-5">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Basic Information
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="coupon-code" className={labelClasses}>
                      Coupon Code
                    </label>

                    <input
                      id="coupon-code"
                      name="code"
                      type="text"
                      value={form.code}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={50}
                      placeholder="e.g. SAVE20"
                      className={`${inputClasses} font-mono uppercase`}
                    />

                    {errors.code && (
                      <p className={errorClasses}>{errors.code}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="coupon-description"
                      className={labelClasses}
                    >
                      Description
                    </label>

                    <textarea
                      id="coupon-description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      disabled={loading}
                      rows={3}
                      maxLength={500}
                      placeholder="Describe what this coupon offers..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Discount */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Discount
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="discount-type" className={labelClasses}>
                      Discount Type
                    </label>

                    <select
                      id="discount-type"
                      name="discountType"
                      value={form.discountType}
                      onChange={handleChange}
                      disabled={loading}
                      className={inputClasses}
                    >
                      <option value="percentage">Percentage</option>

                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="discount-value" className={labelClasses}>
                      Discount Value
                    </label>

                    <input
                      id="discount-value"
                      name="discountValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountValue}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder={
                        form.discountType === "percentage" ? "20" : "500"
                      }
                      className={inputClasses}
                    />

                    {errors.discountValue && (
                      <p className={errorClasses}>{errors.discountValue}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="minimum-order" className={labelClasses}>
                      Minimum Order Amount
                    </label>

                    <input
                      id="minimum-order"
                      name="minimumOrderAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minimumOrderAmount}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="999"
                      className={inputClasses}
                    />

                    {errors.minimumOrderAmount && (
                      <p className={errorClasses}>
                        {errors.minimumOrderAmount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="maximum-discount" className={labelClasses}>
                      Maximum Discount
                    </label>

                    <input
                      id="maximum-discount"
                      name="maximumDiscountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.maximumDiscountAmount}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Optional"
                      className={inputClasses}
                    />

                    {errors.maximumDiscountAmount && (
                      <p className={errorClasses}>
                        {errors.maximumDiscountAmount}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Usage Limits
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="usage-limit" className={labelClasses}>
                      Total Usage Limit
                    </label>

                    <input
                      id="usage-limit"
                      name="usageLimit"
                      type="number"
                      min="1"
                      value={form.usageLimit}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Unlimited"
                      className={inputClasses}
                    />

                    {errors.usageLimit && (
                      <p className={errorClasses}>{errors.usageLimit}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="usage-per-user" className={labelClasses}>
                      Usage Limit Per User
                    </label>

                    <input
                      id="usage-per-user"
                      name="usageLimitPerUser"
                      type="number"
                      min="1"
                      value={form.usageLimitPerUser}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Unlimited"
                      className={inputClasses}
                    />

                    {errors.usageLimitPerUser && (
                      <p className={errorClasses}>{errors.usageLimitPerUser}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Validity */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Validity
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="coupon-start" className={labelClasses}>
                      Starts At
                    </label>

                    <input
                      id="coupon-start"
                      name="startsAt"
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={handleChange}
                      disabled={loading}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="coupon-expiry" className={labelClasses}>
                      Expires At
                    </label>

                    <input
                      id="coupon-expiry"
                      name="expiresAt"
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={handleChange}
                      disabled={loading}
                      className={inputClasses}
                    />

                    {errors.expiresAt && (
                      <p className={errorClasses}>{errors.expiresAt}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-xl border border-border p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />

                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      Active Coupon
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      Customers can use this coupon when it is active and within
                      its validity period.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isEdit ? "Updating..." : "Creating..."}
                </span>
              ) : isEdit ? (
                "Update Coupon"
              ) : (
                "Create Coupon"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponForm;
