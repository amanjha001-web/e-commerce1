import { useState } from "react";

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClasses = (status) => {
  const classes = {
    pending: "bg-amber-100 text-amber-700",
    under_review: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };

  return classes[status?.toLowerCase()] || "bg-gray-100 text-gray-700";
};

const formatStatus = (status = "pending") =>
  status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const DetailItem = ({ label, value, breakAll = false }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
      {label}
    </p>

    <p
      className={`mt-1.5 text-sm font-medium text-gray-800 ${
        breakAll ? "break-all" : "break-words"
      }`}
    >
      {value || "—"}
    </p>
  </div>
);

const Section = ({ title, children }) => (
  <section className="rounded-xl border border-gray-200 bg-white">
    <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>

    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

const VendorRequestDetails = ({
  request,
  open = false,
  loading = false,
  saving = false,
  onClose,
  onApprove,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [rejectReason, setRejectReason] = useState("");
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  if (!open) return null;

  const shopName =
    request?.shopName ||
    request?.businessName ||
    request?.storeName ||
    "Vendor Store";

  const ownerName =
    request?.user?.fullName ||
    request?.user?.name ||
    request?.user?.username ||
    "—";

  // Contact email: prefer application email, then registered user email.
  const contactEmail =
    request?.email ||
    request?.contactEmail ||
    request?.businessEmail ||
    request?.user?.email ||
    "—";

  const address = request?.address || {};
  const bankDetails = request?.bankDetails || {};

  const documents = Array.isArray(request?.documents) ? request.documents : [];

  const isPending =
    request?.status === "pending" || request?.status === "under_review";

  const addressParts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  const busy = loading || saving || submittingAction;

  const handleApprove = async () => {
    if (!onApprove || busy) return;

    setSubmittingAction(true);

    try {
      await onApprove(request);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async (event) => {
    event?.preventDefault();

    const reason = rejectReason.trim();

    if (!reason || !onReject || busy) return;

    setSubmittingAction(true);

    try {
      await onReject(request, reason);
      setRejectReason("");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-91  flex items-start justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-request-title"
        className="m-4 w-full max-w-5xl overflow-hidden rounded-2xl bg-gray-50 shadow-2xl "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
              {shopName
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "V"}
            </div>

            <div className="min-w-0">
              <h2
                id="vendor-request-title"
                className="break-words text-lg font-bold text-gray-900 sm:text-xl"
              >
                {shopName}
              </h2>

              <p className="mt-1 break-all text-xs text-gray-500">
                Request ID: {request?._id || "—"}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  request?.status,
                )}`}
              >
                {formatStatus(request?.status)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close vendor request details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-max gap-5">
            {[
              { id: "overview", label: "Overview" },
              { id: "documents", label: `Documents (${documents.length})` },
              { id: "bank", label: "Bank Details" },
              { id: "review", label: "Review History" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-1 py-3 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-44 animate-pulse rounded-xl bg-gray-200" />
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <Section title="Applicant Information">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem label="Store Name" value={shopName} />

                      <DetailItem
                        label="Business Name"
                        value={request?.businessName}
                      />

                      <DetailItem label="Owner Name" value={ownerName} />

                      <DetailItem
                        label="Contact Email"
                        value={contactEmail}
                        breakAll
                      />

                      <DetailItem
                        label="Registered Account Email"
                        value={request?.user?.email}
                        breakAll
                      />

                      <DetailItem label="Phone" value={request?.phone} />

                      <DetailItem label="Website" value={request?.website} />

                      <DetailItem
                        label="Submitted On"
                        value={formatDate(request?.createdAt)}
                      />

                      <DetailItem
                        label="Last Updated"
                        value={formatDate(request?.updatedAt)}
                      />
                    </div>
                  </Section>

                  <Section title="Business Description">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {request?.description ||
                        "No business description provided."}
                    </p>
                  </Section>

                  <Section title="Business Address">
                    {addressParts.length ? (
                      <div className="space-y-1 text-sm leading-6 text-gray-700">
                        {addressParts.map((part, index) => (
                          <p key={`${part}-${index}`}>{part}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No business address provided.
                      </p>
                    )}
                  </Section>
                </div>
              )}

              {activeTab === "documents" && (
                <Section title="Submitted Documents">
                  {documents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
                      <p className="font-medium text-gray-700">
                        No documents submitted
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        This application contains no uploaded documents.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((document, index) => (
                        <div
                          key={document?._id || document?.publicId || index}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-gray-900">
                              {document?.type || `Document ${index + 1}`}
                            </p>

                            <p className="mt-1 break-all text-xs text-gray-500">
                              Document Number: {document?.number || "—"}
                            </p>
                          </div>

                          {document?.url ? (
                            <a
                              href={document.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                              Open Document ↗
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No document URL
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {activeTab === "bank" && (
                <Section title="Bank & Payout Information">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <DetailItem
                      label="Account Holder"
                      value={bankDetails.accountHolderName}
                    />

                    <DetailItem
                      label="Bank Name"
                      value={bankDetails.bankName}
                    />

                    <DetailItem
                      label="Branch Name"
                      value={bankDetails.branchName}
                    />

                    <DetailItem
                      label="IFSC Code"
                      value={bankDetails.ifscCode}
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Account Number
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <p className="break-all text-sm font-medium text-gray-800">
                          {bankDetails.accountNumber
                            ? showAccountNumber
                              ? bankDetails.accountNumber
                              : `••••••${String(
                                  bankDetails.accountNumber,
                                ).slice(-4)}`
                            : "—"}
                        </p>

                        {bankDetails.accountNumber && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowAccountNumber((previous) => !previous)
                            }
                            className="text-xs font-semibold text-indigo-700"
                          >
                            {showAccountNumber ? "Hide" : "Reveal"}
                          </button>
                        )}
                      </div>
                    </div>

                    <DetailItem
                      label="UPI ID"
                      value={bankDetails.upiId}
                      breakAll
                    />
                  </div>
                </Section>
              )}

              {activeTab === "review" && (
                <div className="space-y-4">
                  <Section title="Review Information">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <DetailItem
                        label="Current Status"
                        value={formatStatus(request?.status)}
                      />

                      <DetailItem
                        label="Reviewed By"
                        value={
                          request?.reviewedBy?.fullName ||
                          request?.reviewedBy?.email ||
                          "Not reviewed yet"
                        }
                      />

                      <DetailItem
                        label="Reviewer Email"
                        value={request?.reviewedBy?.email}
                      />

                      <DetailItem
                        label="Reviewed At"
                        value={formatDate(request?.reviewedAt)}
                      />
                    </div>
                  </Section>

                  {request?.rejectionReason && (
                    <Section title="Rejection Reason">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-red-700">
                        {request.rejectionReason}
                      </p>
                    </Section>
                  )}

                  {isPending && (
                    <Section title="Review Application">
                      <form onSubmit={handleReject} className="space-y-3">
                        <p className="text-sm leading-6 text-gray-600">
                          Review the applicant information and documents before
                          making a decision.
                        </p>

                        <label
                          htmlFor="vendor-rejection-reason"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Rejection reason
                        </label>

                        <textarea
                          id="vendor-rejection-reason"
                          rows={3}
                          value={rejectReason}
                          onChange={(event) =>
                            setRejectReason(event.target.value)
                          }
                          placeholder="Explain why this application is being rejected..."
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleApprove}
                            disabled={busy || !onApprove}
                            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busy ? "Please wait..." : "Approve Request"}
                          </button>

                          <button
                            type="submit"
                            disabled={busy || !onReject || !rejectReason.trim()}
                            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {busy ? "Please wait..." : "Reject Request"}
                          </button>
                        </div>
                      </form>
                    </Section>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
          <p className="break-all text-xs text-gray-400">
            Request ID: {request?._id || "—"}
          </p>

          <div className="flex flex-wrap gap-2">
            {isPending && activeTab !== "review" && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={busy || !onApprove}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? "Please wait..." : "Approve"}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("review")}
                  disabled={busy}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRequestDetails;
