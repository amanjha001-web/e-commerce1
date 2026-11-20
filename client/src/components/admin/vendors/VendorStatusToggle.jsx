import { useEffect, useState } from "react";
import Modal from "../../common/Modal";
import Badge from "../../common/Badge";
import Button from "../../common/Button";

const STATUS_OPTIONS = [
  { value: "approved", label: "Approved (Active)" },
  { value: "pending", label: "Pending Review" },
  { value: "under_review", label: "Under Review" },
  { value: "suspended", label: "Suspended / Deactivated" },
  { value: "rejected", label: "Rejected" },
];

const getStatusBadgeVariant = (status, isActive) => {
  if (!isActive && status === "approved") return "danger";
  switch (String(status || "").toLowerCase()) {
    case "approved":
    case "active":
      return "success";
    case "pending":
    case "under_review":
      return "warning";
    case "suspended":
    case "rejected":
    case "inactive":
      return "danger";
    default:
      return "default";
  }
};

const VendorStatusToggle = ({
  vendor = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const initialStatus = String(vendor?.status || "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const initialActive = vendor?.isActive !== false;
  const initialCommission =
    vendor?.commissionRate !== undefined && vendor?.commissionRate !== null
      ? String(vendor.commissionRate)
      : "10";
  const initialReason = vendor?.rejectionReason || "";

  const [status, setStatus] = useState(initialStatus);
  const [isActive, setIsActive] = useState(initialActive);
  const [commissionRate, setCommissionRate] = useState(initialCommission);
  const [rejectionReason, setRejectionReason] = useState(initialReason);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open || !vendor) return;
    setStatus(
      String(vendor.status || "pending")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_"),
    );
    setIsActive(vendor.isActive !== false);
    setCommissionRate(
      vendor.commissionRate !== undefined && vendor.commissionRate !== null
        ? String(vendor.commissionRate)
        : "10",
    );
    setRejectionReason(vendor.rejectionReason || "");
    setFormError("");
  }, [open, vendor]);

  if (!open || !vendor) return null;

  const vendorName =
    vendor.shopName ||
    vendor.storeName ||
    vendor.businessName ||
    vendor.user?.fullName ||
    vendor.userId?.name ||
    "Vendor";

  const vendorEmail =
    vendor.email || vendor.user?.email || vendor.userId?.email || "—";

  const currentDisplayLabel =
    !initialActive && initialStatus === "approved"
      ? "Suspended"
      : initialStatus.replace(/_/g, " ");

  const handleStatusSelect = (nextStatus) => {
    setStatus(nextStatus);
    if (nextStatus === "approved") {
      setIsActive(true);
    } else if (nextStatus === "suspended" || nextStatus === "rejected") {
      setIsActive(false);
    }
    setFormError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;

    const rateNum = Number(commissionRate);
    if (commissionRate !== "" && (Number.isNaN(rateNum) || rateNum < 0 || rateNum > 100)) {
      setFormError("Commission rate must be between 0% and 100%.");
      return;
    }

    onConfirm?.(vendor, {
      status,
      isActive,
      commissionRate: commissionRate === "" ? undefined : rateNum,
      rejectionReason: rejectionReason.trim(),
    });
  };

  return (
    <Modal
      isOpen={open}
      onClose={loading ? () => {} : onClose}
      title="Manage Vendor"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[#fcf9fa] p-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--text)]">
              {vendorName}
            </h3>
            <p className="mt-0.5 truncate text-xs font-medium text-[var(--muted)]">
              {vendorEmail}
            </p>
          </div>

          <Badge variant={getStatusBadgeVariant(initialStatus, initialActive)}>
            <span className="capitalize">{currentDisplayLabel}</span>
          </Badge>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Vendor Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusSelect(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--soft)]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--soft)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Storefront Visibility
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsActive((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                isActive
                  ? "border-[#c3ebda] bg-[#e7f6ef] text-[#16845b]"
                  : "border-[#f3cbd0] bg-[#fff0f1] text-[#bd3345]"
              }`}
            >
              <span>{isActive ? "Active in Store" : "Inactive / Hidden"}</span>
              <span className="text-xs underline">
                {isActive ? "Turn Off" : "Turn On"}
              </span>
            </button>
          </div>
        </div>

        {(status === "rejected" || status === "suspended" || rejectionReason) && (
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {status === "rejected"
                ? "Rejection Reason"
                : status === "suspended"
                  ? "Suspension Note"
                  : "Admin Note"}
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={loading}
              placeholder="Provide reason visible to vendor..."
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--soft)]"
            />
          </div>
        )}

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-3.5 py-2.5 text-xs font-semibold text-[#bd3345]"
          >
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorStatusToggle;
