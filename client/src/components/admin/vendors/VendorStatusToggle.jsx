const VendorStatusToggle = ({
  vendor = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!open || !vendor) return null;

  const vendorName =
    vendor.shopName ||
    vendor.businessName ||
    vendor.storeName ||
    vendor.user?.fullName ||
    "this vendor";

  const isActive = vendor.isActive !== false;
  const nextStatus = !isActive;
  const actionLabel = nextStatus ? "Activate" : "Deactivate";

  const handleConfirm = () => {
    if (loading) return;

    // Pass the target status as a boolean.
    onConfirm?.(vendor, nextStatus);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={() => !loading && onClose?.()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-status-title"
      >
        <h2
          id="vendor-status-title"
          className="text-xl font-semibold text-foreground"
        >
          {actionLabel} Vendor?
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Are you sure you want to {actionLabel.toLowerCase()}{" "}
          <span className="font-medium text-foreground">{vendorName}</span>?
        </p>

        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Current status</p>
          <p className="mt-1 font-medium">{isActive ? "Active" : "Inactive"}</p>

          <p className="mt-3 text-sm text-muted-foreground">New status</p>
          <p className="mt-1 font-medium">
            {nextStatus ? "Active" : "Inactive"}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
              isActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Processing..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorStatusToggle;
