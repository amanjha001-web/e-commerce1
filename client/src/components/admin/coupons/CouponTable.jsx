

const CouponTable = ({
  coupons = [],
  loading = false,
  onViewCoupon,
  onEditCoupon,
  onDeleteCoupon,
  onToggleStatus,
}) => {
  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatValue = (value) => {
    if (!value) return "N/A";

    return String(value)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getCouponCode = (coupon) =>
    coupon?.code ||
    coupon?.couponCode ||
    coupon?.name ||
    coupon?._id ||
    coupon?.id ||
    "N/A";

  const getDiscountType = (coupon) =>
    String(coupon?.discountType || coupon?.type || "percentage").toLowerCase();

  const getDiscountValue = (coupon) =>
    coupon?.discountValue ?? coupon?.value ?? coupon?.discount ?? 0;

  const getUsageCount = (coupon) =>
    coupon?.usedCount ??
    coupon?.usageCount ??
    coupon?.timesUsed ??
    coupon?.used ??
    0;

  const getUsageLimit = (coupon) =>
    coupon?.usageLimit ?? coupon?.maxUses ?? coupon?.maximumUses ?? null;

  const getStatus = (coupon) => {
    if (coupon?.status !== undefined && coupon?.status !== null) {
      return String(coupon.status).toLowerCase();
    }

    if (coupon?.isActive === false || coupon?.active === false) {
      return "inactive";
    }

    return "active";
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
      case "enabled":
        return "bg-green-100 text-green-700";

      case "inactive":
      case "disabled":
        return "bg-gray-100 text-gray-700";

      case "expired":
        return "bg-red-100 text-red-700";

      case "scheduled":
      case "pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isExpired = (coupon) => {
    const expiry = coupon?.expiresAt || coupon?.endDate || coupon?.validUntil;

    if (!expiry) return false;

    const date = new Date(expiry);

    return !Number.isNaN(date.getTime()) && date < new Date();
  };

  const getDiscountLabel = (coupon) => {
    const type = getDiscountType(coupon);
    const value = getDiscountValue(coupon);

    if (type === "fixed" || type === "flat" || type === "amount") {
      return formatCurrency(value);
    }

    return `${value}%`;
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        {/* Desktop Loading */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Coupon",
                  "Discount",
                  "Min. Order",
                  "Usage",
                  "Valid Until",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  {Array.from({ length: 7 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4">
                      <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Loading */}
        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!coupons.length) {
    return (
      <div className="rounded-2xl border border-border bg-background p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
          🎟️
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          No coupons found
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          Create a coupon to offer discounts to customers.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[950px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Coupon
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Discount
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Min. Order
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Usage
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Valid Until
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((coupon, index) => {
              const code = getCouponCode(coupon);
              const discount = getDiscountLabel(coupon);

              const minOrder =
                coupon?.minimumOrderAmount ??
                coupon?.minOrderAmount ??
                coupon?.minAmount ??
                0;

              const usageCount = getUsageCount(coupon);
              const usageLimit = getUsageLimit(coupon);

              const status = isExpired(coupon) ? "expired" : getStatus(coupon);

              const validUntil =
                coupon?.expiresAt || coupon?.endDate || coupon?.validUntil;

              return (
                <tr
                  key={coupon?._id || coupon?.id || code || index}
                  className="border-b border-border transition last:border-0 hover:bg-muted/20"
                >
                  {/* Coupon */}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onViewCoupon?.(coupon)}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 font-mono text-sm font-semibold text-primary transition hover:bg-primary/15"
                    >
                      {code}
                    </button>
                  </td>

                  {/* Discount */}
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-foreground">
                      {discount}
                    </span>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatValue(getDiscountType(coupon))}
                    </p>
                  </td>

                  {/* Minimum Order */}
                  <td className="px-4 py-4 text-sm text-foreground">
                    {formatCurrency(minOrder)}
                  </td>

                  {/* Usage */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-foreground">
                      {usageCount}
                      {usageLimit !== null ? ` / ${usageLimit}` : ""}
                    </span>
                  </td>

                  {/* Valid Until */}
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(validUntil)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        status,
                      )}`}
                    >
                      {formatValue(status)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewCoupon?.(coupon)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="View coupon"
                      >
                        👁️
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditCoupon?.(coupon)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Edit coupon"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus?.(coupon)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Toggle status"
                      >
                        🔄
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteCoupon?.(coupon)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                        title="Delete coupon"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {coupons.map((coupon, index) => {
          const code = getCouponCode(coupon);
          const discount = getDiscountLabel(coupon);

          const minOrder =
            coupon?.minimumOrderAmount ??
            coupon?.minOrderAmount ??
            coupon?.minAmount ??
            0;

          const usageCount = getUsageCount(coupon);
          const usageLimit = getUsageLimit(coupon);

          const status = isExpired(coupon) ? "expired" : getStatus(coupon);

          const validUntil =
            coupon?.expiresAt || coupon?.endDate || coupon?.validUntil;

          return (
            <div
              key={coupon?._id || coupon?.id || code || index}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewCoupon?.(coupon)}
                  className="rounded-lg bg-primary/10 px-3 py-1.5 font-mono text-sm font-semibold text-primary"
                >
                  {code}
                </button>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                    status,
                  )}`}
                >
                  {formatValue(status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Discount</p>

                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {discount}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Min. Order
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatCurrency(minOrder)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Usage</p>

                  <p className="mt-1 text-sm text-foreground">
                    {usageCount}
                    {usageLimit !== null ? ` / ${usageLimit}` : ""}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Valid Until
                  </p>

                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(validUntil)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => onViewCoupon?.(coupon)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => onEditCoupon?.(coupon)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus?.(coupon)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Status
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteCoupon?.(coupon)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CouponTable;
