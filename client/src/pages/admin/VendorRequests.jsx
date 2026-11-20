import { useMemo, useState } from "react";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";

const getStatusClass = (s) => {
  const normalized = String(s || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "verified" || normalized === "active") {
    return "green";
  }
  if (
    normalized === "pending" ||
    normalized === "under review" ||
    normalized === "submitted"
  ) {
    return "amber";
  }
  if (normalized === "rejected" || normalized === "cancelled" || normalized === "blocked") {
    return "red";
  }
  return "";
};

const formatStatusLabel = (value) =>
  String(value || "Pending")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TITLE_MAP = {
  "": "Seller applications",
  all: "Seller applications",
  pending: "Pending applications",
  under_review: "Applications under review",
  approved: "Approved applications",
  rejected: "Rejected applications",
};

const VendorRequests = ({
  requests = [],
  summary = null,
  selectedRequest = null,
  pagination = {},
  loading = false,
  detailsLoading = false,
  saving = false,
  error = null,
  filters = { search: "", status: "", page: 1, limit: 12 },
  onClearError,
  onFilterChange,
  onResetFilters,
  onViewRequest,
  onApproveRequest,
  onRejectRequest,
  onReviewRequest,
  onDeleteRequest,
  onCloseDetails,
}) => {
  const [viewingRow, setViewingRow] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { page = 1, total = 0, totalPages = 0 } = pagination;

  const rows = useMemo(() => {
    return (Array.isArray(requests) ? requests : []).map((req, idx) => {
      const key = req._id || req.id || `req-${idx}`;
      const userObj =
        req.user || (typeof req.userId === "object" ? req.userId : null);

      const applicant =
        req.applicant ||
        req.ownerName ||
        req.fullName ||
        userObj?.fullName ||
        userObj?.name ||
        (req.email ? String(req.email).split("@")[0] : "") ||
        "Applicant";

      const business =
        req.business ||
        req.shopName ||
        req.businessName ||
        req.storeName ||
        "Store";

      const submitted = req.submitted || formatDate(req.createdAt);
      const gstNumber = req.gstNumber || req.taxId || "";
      const hasBank = Boolean(
        req.bankDetails?.accountNumber && req.bankDetails?.ifscCode,
      );

      const rawStatus =
        req.status ||
        (req.isApproved === true
          ? "approved"
          : req.rejectionReason
            ? "rejected"
            : "pending");
      const canonicalStatus = String(rawStatus)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

      const docLabel =
        req.documentStatus ||
        (canonicalStatus === "approved"
          ? "Verified"
          : canonicalStatus === "rejected"
            ? "Rejected"
            : gstNumber || hasBank
              ? "Submitted"
              : "Under review");

      const verification =
        req.userVerificationStatus ||
        (!userObj && !req.userId
          ? "unlinked"
          : userObj?.isActive === false
            ? "blocked"
            : (req.isUserVerified ?? userObj?.isEmailVerified)
              ? "verified"
              : "unverified");

      return {
        ...req,
        _key: key,
        _userObj: userObj,
        _applicant: applicant,
        _applicantEmail: req.email || userObj?.email || "—",
        _business: business,
        _gstNumber: gstNumber,
        _submitted: submitted,
        _documents: docLabel,
        _canonicalStatus: canonicalStatus,
        _status: formatStatusLabel(canonicalStatus),
        _verificationStatus: verification,
      };
    });
  }, [requests]);

  const handleOpenDetails = (row, focusReject = false) => {
    setViewingRow(row);
    setRejectReason(row.rejectionReason || "");
    setReviewNotes(row.reviewNotes || "");
    setConfirmReject(Boolean(focusReject));
    setConfirmDelete(false);
    if (row._id) {
      onViewRequest?.(row);
    }
  };

  const handleCloseModal = () => {
    if (saving) return;
    setViewingRow(null);
    setConfirmReject(false);
    setConfirmDelete(false);
    onCloseDetails?.();
  };

  const activeDetail =
    selectedRequest && viewingRow && selectedRequest._id === viewingRow._id
      ? { ...viewingRow, ...selectedRequest }
      : viewingRow;

  const detailStatus = String(
    activeDetail?._canonicalStatus || activeDetail?.status || "pending",
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const detailUser =
    activeDetail?.user ||
    (typeof activeDetail?.userId === "object" ? activeDetail.userId : null) ||
    activeDetail?._userObj;

  const detailAddr =
    activeDetail?.address?.city || activeDetail?.address?.street
      ? activeDetail.address
      : activeDetail?.businessAddress || {};

  const detailBank = activeDetail?.bankDetails || {};
  const hasBankDetails = Boolean(
    detailBank?.accountHolderName ||
      detailBank?.accountNumber ||
      detailBank?.bankName ||
      detailBank?.ifscCode ||
      detailBank?.upiId,
  );

  const statTotal = summary?.total ?? total ?? rows.length;
  const statPending =
    summary?.pending ?? rows.filter((r) => r._canonicalStatus === "pending").length;
  const statUnderReview =
    summary?.underReview ??
    rows.filter((r) => r._canonicalStatus === "under_review").length;
  const statProcessed =
    summary !== null && summary !== undefined
      ? (summary.approved || 0) + (summary.rejected || 0)
      : rows.filter((r) =>
          ["approved", "rejected"].includes(r._canonicalStatus),
        ).length;

  const sectionTitle = TITLE_MAP[filters.status || ""] || "Seller applications";

  return (
    <div className="space-y-6">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Vendor requests</h1>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Total applications", statTotal, ""],
          ["Pending", statPending, "pending"],
          ["Under review", statUnderReview, "under_review"],
          ["Approved / Rejected", statProcessed, null],
        ].map(([label, val, filterVal]) => (
          <button
            key={label}
            type="button"
            disabled={filterVal === null}
            onClick={() => filterVal !== null && onFilterChange?.({ status: filterVal })}
            className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition ${
              filterVal !== null
                ? filters.status === filterVal
                  ? "border-[var(--primary)] ring-2 ring-[var(--soft)] cursor-pointer"
                  : "border-[var(--line)] hover:border-[var(--primary)]/50 cursor-pointer"
                : "border-[var(--line)] cursor-default"
            }`}
          >
            <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[var(--text)]">{val}</p>
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-semibold text-[#bd3345]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => onClearError?.()}
            className="cursor-pointer text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="m-0">{sectionTitle}</h2>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="field"
              placeholder="Search applicant, business, email, GST..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange?.({ search: e.target.value })}
            />

            <select
              className="field"
              value={filters.status || ""}
              onChange={(e) => onFilterChange?.({ status: e.target.value })}
            >
              <option value="">All applications</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {(filters.search || filters.status) && (
              <button
                type="button"
                onClick={() => onResetFilters?.()}
                className="outlinebtn"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Business</th>
                <th>Submitted</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading vendor applications...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    No seller applications match the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const canDecide =
                    row._canonicalStatus === "pending" ||
                    row._canonicalStatus === "under_review";
                  return (
                    <tr key={row._key}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(row)}
                          className="cursor-pointer border-0 bg-transparent p-0 text-left font-bold text-[var(--text)] hover:text-[var(--primary)] hover:underline"
                        >
                          {row._applicant}
                        </button>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                          <span>{row._applicantEmail}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              row._verificationStatus === "verified"
                                ? "bg-[#e7f6ef] text-[#16845b]"
                                : row._verificationStatus === "unverified"
                                  ? "bg-[#fff4df] text-[#9b6814]"
                                  : "bg-[#ffeaec] text-[#bd3345]"
                            }`}
                          >
                            {row._verificationStatus === "verified"
                              ? "✓ Verified"
                              : row._verificationStatus === "unverified"
                                ? "Unverified"
                                : row._verificationStatus === "blocked"
                                  ? "Blocked User"
                                  : "Unlinked"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--text)]">
                          {row._business}
                        </div>
                        {(row.businessType || row._gstNumber) && (
                          <div className="text-[11px] font-medium text-[var(--muted)]">
                            {[
                              row.businessType ? formatStatusLabel(row.businessType) : null,
                              row._gstNumber ? `Tax: ${row._gstNumber}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        )}
                      </td>
                      <td>{row._submitted}</td>
                      <td>
                        <span className={`status ${getStatusClass(row._documents)}`}>
                          {row._documents}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${getStatusClass(row._status)}`}>
                          {row._status}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            className="btnsm"
                            disabled={saving}
                            onClick={() => handleOpenDetails(row)}
                          >
                            View
                          </button>
                          {canDecide && (
                            <>
                              <button
                                type="button"
                                className="btnsm primary"
                                disabled={saving}
                                onClick={() => onApproveRequest?.(row)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btnsm"
                                disabled={saving}
                                onClick={() => handleOpenDetails(row, true)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {row._canonicalStatus === "rejected" && (
                            <button
                              type="button"
                              className="btnsm primary"
                              disabled={saving}
                              onClick={() => onApproveRequest?.(row)}
                            >
                              Re-approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[var(--muted)]">
              Page {page} of {Math.max(totalPages, 1)} · {total} applications
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => onFilterChange?.({ page: page - 1 })}
                className="btnsm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={loading || page >= totalPages}
                onClick={() => onFilterChange?.({ page: page + 1 })}
                className="btnsm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {activeDetail && (
        <Modal
          isOpen={Boolean(activeDetail)}
          onClose={handleCloseModal}
          title={activeDetail._business || "Seller Application"}
          size="lg"
        >
          <div className="space-y-5">
            {/* Header Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[#fcf9fa] p-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  {activeDetail._business}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Applicant: {activeDetail._applicant} · Submitted{" "}
                  {activeDetail._submitted}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    activeDetail._verificationStatus === "verified"
                      ? "success"
                      : activeDetail._verificationStatus === "unverified"
                        ? "warning"
                        : "danger"
                  }
                  dot
                >
                  {activeDetail._verificationStatus === "verified"
                    ? "Verified User"
                    : activeDetail._verificationStatus === "unverified"
                      ? "Email Unverified"
                      : activeDetail._verificationStatus === "blocked"
                        ? "User Blocked"
                        : "Unlinked User"}
                </Badge>
                <Badge
                  variant={
                    detailStatus === "approved"
                      ? "success"
                      : detailStatus === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {formatStatusLabel(detailStatus)}
                </Badge>
              </div>
            </div>

            {detailsLoading && (
              <p className="text-xs font-medium text-[var(--muted)]">
                Loading full application details...
              </p>
            )}

            {activeDetail._verificationStatus !== "verified" && (
              <div className="rounded-xl border border-[#f0dfb9] bg-[#fff8e9] px-4 py-3 text-xs text-[#76571d]">
                <span className="font-bold">Account Verification Check:</span>{" "}
                {activeDetail._verificationStatus === "unverified"
                  ? "Applicant has not verified their account email yet."
                  : activeDetail._verificationStatus === "blocked"
                    ? "Applicant's user account is currently blocked."
                    : "No verified user account linked."}
              </div>
            )}

            {detailStatus === "rejected" && activeDetail.rejectionReason && (
              <div className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs text-[#bd3345]">
                <span className="font-bold">Rejection Reason:</span>{" "}
                {activeDetail.rejectionReason}
              </div>
            )}

            {/* Applicant & Business Info */}
            <div className="grid gap-4 rounded-2xl border border-[var(--line)] p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-[var(--muted)]">Applicant Name</p>
                <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                  {activeDetail._applicant}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)]">Contact Email</p>
                <p className="mt-0.5 break-all text-sm font-medium text-[var(--text)]">
                  {activeDetail.email || detailUser?.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)]">Phone</p>
                <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                  {activeDetail.phone || detailUser?.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)]">Business Type</p>
                <p className="mt-0.5 text-sm font-medium capitalize text-[var(--text)]">
                  {activeDetail.businessType || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)]">GST / Tax ID</p>
                <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                  {activeDetail._gstNumber || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)]">Website</p>
                <p className="mt-0.5 break-all text-sm font-medium text-[var(--text)]">
                  {activeDetail.website || "—"}
                </p>
              </div>
              {activeDetail.reviewedAt && (
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">Last Reviewed</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                    {formatDateTime(activeDetail.reviewedAt)}
                    {activeDetail.reviewedByUser?.name
                      ? ` by ${activeDetail.reviewedByUser.name}`
                      : ""}
                  </p>
                </div>
              )}
              {activeDetail.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-[var(--muted)]">Store Description</p>
                  <p className="mt-0.5 text-sm text-[var(--text)]">
                    {activeDetail.description}
                  </p>
                </div>
              )}
            </div>

            {/* Business Address */}
            {(detailAddr?.addressLine1 ||
              detailAddr?.street ||
              detailAddr?.city ||
              detailAddr?.state) && (
              <div className="rounded-2xl border border-[var(--line)] p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Business Address
                </p>
                <p className="text-sm text-[var(--text)]">
                  {[
                    detailAddr.addressLine1 || detailAddr.street,
                    detailAddr.addressLine2,
                    detailAddr.city,
                    detailAddr.state,
                    detailAddr.postalCode,
                    detailAddr.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}

            {/* Bank Details */}
            {hasBankDetails && (
              <div className="grid gap-3 rounded-2xl border border-[var(--line)] p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Submitted Bank / Payout Details
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Account Holder</p>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {detailBank.accountHolderName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Bank & Branch</p>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {[detailBank.bankName, detailBank.branchName]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Account Number</p>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {detailBank.accountNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">IFSC / UPI</p>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {[detailBank.ifscCode, detailBank.upiId]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Review / Rejection Note Box */}
            {detailStatus !== "approved" && (
              <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[#fcf9fa] p-4">
                <label className="block text-xs font-bold text-[var(--text)]">
                  {confirmReject
                    ? "Rejection Reason (min 5 chars recommended)"
                    : "Admin Review / Rejection Note"}
                </label>

                {confirmReject && (
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Incomplete KYC / tax details",
                      "Invalid bank or IFSC information",
                      "Unverified owner email account",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectReason(preset)}
                        className="cursor-pointer rounded-full border border-[#f3cbd0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#bd3345] hover:bg-[#ffe3e6]"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={2}
                  value={confirmReject ? rejectReason : reviewNotes || rejectReason}
                  onChange={(e) => {
                    if (confirmReject) {
                      setRejectReason(e.target.value);
                    } else {
                      setReviewNotes(e.target.value);
                      setRejectReason(e.target.value);
                    }
                  }}
                  disabled={saving}
                  placeholder={
                    confirmReject
                      ? "Enter reason why application is rejected..."
                      : "Optional notes for review or rejection..."
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>
            )}

            {/* Inline Delete Confirmation */}
            {confirmDelete && (
              <div className="flex flex-col gap-3 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-[#bd3345]">
                  Archive & remove &ldquo;{activeDetail._business}&rdquo; from applications list?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    loading={saving}
                    onClick={async () => {
                      const ok = await onDeleteRequest?.(activeDetail);
                      if (ok !== false) handleCloseModal();
                    }}
                  >
                    Confirm Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex flex-wrap flex-col-reverse gap-2.5 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={handleCloseModal}
              >
                Close
              </Button>

              {activeDetail._id && !confirmDelete && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={saving}
                  onClick={() => {
                    setConfirmReject(false);
                    setConfirmDelete(true);
                  }}
                >
                  Delete
                </Button>
              )}

              {onReviewRequest &&
                detailStatus !== "approved" &&
                detailStatus !== "under_review" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={async () => {
                      const ok = await onReviewRequest(
                        activeDetail,
                        reviewNotes.trim() || rejectReason.trim(),
                      );
                      if (ok !== false) handleCloseModal();
                    }}
                  >
                    Mark Under Review
                  </Button>
                )}

              {detailStatus !== "rejected" && detailStatus !== "approved" && (
                confirmReject ? (
                  <Button
                    type="button"
                    variant="danger"
                    loading={saving}
                    onClick={async () => {
                      const ok = await onRejectRequest?.(
                        activeDetail,
                        rejectReason.trim() || "Application rejected by admin",
                      );
                      if (ok !== false) handleCloseModal();
                    }}
                  >
                    Confirm Reject
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setConfirmDelete(false);
                      setConfirmReject(true);
                    }}
                  >
                    Reject Application
                  </Button>
                )
              )}

              {detailStatus !== "approved" && (
                <Button
                  type="button"
                  variant="success"
                  loading={saving}
                  onClick={async () => {
                    const ok = await onApproveRequest?.(activeDetail);
                    if (ok !== false) handleCloseModal();
                  }}
                >
                  {detailStatus === "rejected"
                    ? "Re-approve Application"
                    : "Approve Application"}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VendorRequests;
