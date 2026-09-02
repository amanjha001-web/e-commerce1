import { useState } from "react";

const ProductStatusToggle = ({
  product = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");

  if (!open || !product) return null;

  const productName =
    product?.name || product?.productName || product?.title || "this product";

  const currentStatus = product?.status
    ? String(product.status).toLowerCase()
    : product?.isActive === false
      ? "inactive"
      : "active";

  const isActive =
    currentStatus === "active" ||
    currentStatus === "published" ||
    currentStatus === "approved";

  const nextStatus = isActive ? "inactive" : "active";

  const handleConfirm = () => {
    onConfirm?.(product, nextStatus, reason.trim());
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isActive ? "Deactivate Product" : "Activate Product"}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Update the product&apos;s availability status.
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
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                isActive ? "bg-red-100" : "bg-green-100"
              }`}
            >
              {isActive ? "⚠️" : "✓"}
            </div>

            <div className="min-w-0">
              <p className="text-sm leading-5 text-foreground">
                Are you sure you want to{" "}
                <span className="font-semibold">
                  {isActive ? "deactivate" : "activate"}
                </span>{" "}
                <span className="font-semibold">{productName}</span>?
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isActive
                  ? "Customers may no longer be able to view or purchase this product."
                  : "This product will become available according to your product visibility rules."}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="mt-4">
            <label
              htmlFor="product-status-reason"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <textarea
              id="product-status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={loading}
              rows={4}
              maxLength={500}
              placeholder={
                isActive
                  ? "Why are you deactivating this product?"
                  : "Add a note about activating this product..."
              }
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-1 text-right text-[11px] text-muted-foreground">
              {reason.length}/500
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
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Updating...
              </span>
            ) : isActive ? (
              "Deactivate Product"
            ) : (
              "Activate Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductStatusToggle;
