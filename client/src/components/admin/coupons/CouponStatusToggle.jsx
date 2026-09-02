import { useState } from "react";

const CouponStatusToggle = ({
  coupon = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");

  if (!open || !coupon) return null;

  const currentStatus =
    coupon?.status ||
    ((coupon?.isActive ?? coupon?.active) ? "active" : "inactive");

  const normalizedStatus = String(currentStatus).toLowerCase();

  const isCurrentlyActive = [
    "active",
    "enabled",
    "published",
    "approved",
  ].includes(normalizedStatus);

  const nextStatus = isCurrentlyActive ? "inactive" : "active";

  const actionLabel = isCurrentlyActive ? "Deactivate" : "Activate";

  const couponCode =
    coupon?.code || coupon?.couponCode || coupon?.name || "this coupon";

  const handleConfirm = () => {
    onConfirm?.(coupon, nextStatus, reason.trim());
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {actionLabel} Coupon
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Change the current status of this coupon.
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

        {/* Content */}
        <div className="px-5 py-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              Are you sure you want to{" "}
              <span className="font-semibold">{actionLabel.toLowerCase()}</span>{" "}
              coupon{" "}
              <span className="font-mono font-semibold text-primary">
                {couponCode}
              </span>
              ?
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  isCurrentlyActive ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              Current status:
              <span className="font-medium capitalize text-foreground">
                {normalizedStatus}
              </span>
            </div>
          </div>

          {/* Warning */}
          {isCurrentlyActive && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.7 2.9 17a2 2 0 0 0 1.75 3h14.7A2 2 0 0 0 21.1 17L13.7 3.7a2 2 0 0 0-3.4 0Z"
                  />
                </svg>

                <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">
                  Deactivating this coupon will prevent customers from using it
                  until it is activated again.
                </p>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="mt-4">
            <label
              htmlFor="coupon-status-reason"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <textarea
              id="coupon-status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={loading}
              rows={3}
              maxLength={300}
              placeholder={
                isCurrentlyActive
                  ? "Why are you deactivating this coupon?"
                  : "Why are you activating this coupon?"
              }
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-1 text-right text-[11px] text-muted-foreground">
              {reason.length}/300
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isCurrentlyActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </span>
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponStatusToggle;
