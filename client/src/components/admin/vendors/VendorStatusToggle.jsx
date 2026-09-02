import { useState } from "react";

const VendorStatusToggle = ({
  vendor = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");

  if (!open || !vendor) return null;

  const vendorName =
    vendor?.businessName ||
    vendor?.storeName ||
    vendor?.companyName ||
    vendor?.fullName ||
    vendor?.name ||
    vendor?.username ||
    "this vendor";

  const currentStatus = String(
    vendor?.status || (vendor?.isActive === false ? "inactive" : "active"),
  ).toLowerCase();

  const isActive = currentStatus === "active" || currentStatus === "approved";

  const nextStatus = isActive ? "inactive" : "active";
  const actionLabel = isActive ? "Deactivate" : "Activate";

  const handleConfirm = () => {
    if (loading) return;

    onConfirm?.(vendor, nextStatus, reason.trim());
  };

  const formatStatus = (value) =>
    String(value || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-status-title"
      >
        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <div
            className={[
              "flex h-14 w-14 items-center justify-center rounded-full",
              isActive ? "bg-red-100" : "bg-green-100",
            ].join(" ")}
          >
            {isActive ? (
              <svg
                className="h-7 w-7 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.1 14a2 2 0 001.73 3h16.16a2 2 0 001.73-3l-8.1-14a2 2 0 00-3.42 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-7 w-7 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2
            id="vendor-status-title"
            className="text-xl font-semibold text-foreground"
          >
            {actionLabel} Vendor?
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Are you sure you want to{" "}
            <span className="font-medium text-foreground">
              {actionLabel.toLowerCase()}
            </span>{" "}
            <span className="font-medium text-foreground">{vendorName}</span>?
          </p>
        </div>

        {/* Status Change */}
        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Current Status</p>

              <span
                className={[
                  "mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                  isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700",
                ].join(" ")}
              >
                {formatStatus(currentStatus)}
              </span>
            </div>

            <svg
              className="h-5 w-5 shrink-0 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14m-6-6l6 6-6 6"
              />
            </svg>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">New Status</p>

              <span
                className={[
                  "mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                  nextStatus === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700",
                ].join(" ")}
              >
                {formatStatus(nextStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-5">
          <label
            htmlFor="vendorStatusReason"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Reason{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>

          <textarea
            id="vendorStatusReason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={loading}
            rows={3}
            maxLength={500}
            placeholder={`Enter reason for ${actionLabel.toLowerCase()}ing this vendor...`}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-1 text-right text-xs text-muted-foreground">
            {reason.length}/500
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              isActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-primary/90",
            ].join(" ")}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="opacity-25"
                    stroke="currentColor"
                    strokeWidth="3"
                  />

                  <path
                    d="M21 12a9 9 0 00-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
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

export default VendorStatusToggle;
