import { useState } from "react";

const VendorRequestDetails = ({
  request,
  open = false,
  loading = false,
  onClose,
  onApprove,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!open || !request) return null;

  const businessName =
    request?.businessName ||
    request?.storeName ||
    request?.vendor?.businessName ||
    request?.vendor?.storeName ||
    request?.companyName ||
    "Unnamed Business";

  const ownerName =
    request?.user?.fullName ||
    request?.user?.name ||
    request?.owner?.fullName ||
    request?.owner?.name ||
    request?.fullName ||
    request?.name ||
    request?.username ||
    "N/A";

  const email =
    request?.email || request?.user?.email || request?.owner?.email || "N/A";

  const phone =
    request?.phone ||
    request?.mobile ||
    request?.phoneNumber ||
    request?.user?.phone ||
    request?.owner?.phone ||
    "N/A";

  const status = String(
    request?.status || request?.requestStatus || "pending",
  ).toLowerCase();

  const logo =
    request?.logo ||
    request?.storeLogo ||
    request?.vendor?.logo ||
    request?.user?.avatar ||
    request?.avatar ||
    request?.profileImage;

  const getInitials = () =>
    businessName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  const formatStatus = (value) =>
    value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClasses = () => {
    switch (status) {
      case "approved":
      case "accepted":
        return "bg-green-100 text-green-700";

      case "pending":
      case "requested":
      case "under_review":
        return "bg-yellow-100 text-yellow-700";

      case "rejected":
      case "declined":
      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isPending =
    status === "pending" || status === "requested" || status === "under_review";

  const address =
    request?.address ||
    request?.businessAddress ||
    request?.storeAddress ||
    null;

  const documents = request?.documents || request?.verificationDocuments || [];

  const handleReject = () => {
    onReject?.(request, rejectReason.trim());

    setRejectReason("");
    setShowRejectForm(false);
  };

  const tabs = ["overview", "documents", "review"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={businessName}
                className="h-12 w-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                {getInitials()}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-foreground">
                {businessName}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses()}`}
                >
                  {formatStatus(status)}
                </span>

                <span className="text-xs text-muted-foreground">
                  Vendor Application
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto border-b border-border">
          <div className="flex min-w-max px-5 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-3 text-sm font-medium capitalize transition first:pl-0 ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Applicant Information */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Applicant Information
                </h3>

                <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                  <InfoItem label="Business Name" value={businessName} />

                  <InfoItem label="Owner Name" value={ownerName} />

                  <InfoItem label="Email" value={email} />

                  <InfoItem label="Phone" value={phone} />

                  <InfoItem
                    label="Business Type"
                    value={
                      request?.businessType ||
                      request?.type ||
                      request?.category ||
                      "N/A"
                    }
                  />

                  <InfoItem
                    label="Category"
                    value={
                      request?.category || request?.businessCategory || "N/A"
                    }
                  />

                  <InfoItem
                    label="GST Number"
                    value={
                      request?.gstNumber ||
                      request?.gst ||
                      request?.taxId ||
                      "N/A"
                    }
                  />

                  <InfoItem
                    label="PAN Number"
                    value={request?.panNumber || request?.pan || "N/A"}
                  />

                  <InfoItem
                    label="Submitted On"
                    value={formatDate(
                      request?.createdAt ||
                        request?.requestedAt ||
                        request?.created_at,
                    )}
                  />

                  <InfoItem
                    label="Last Updated"
                    value={formatDate(
                      request?.updatedAt || request?.reviewedAt,
                    )}
                  />
                </div>
              </section>

              {/* Address */}
              {address && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Business Address
                  </h3>

                  <div className="rounded-xl border border-border p-4 text-sm leading-6 text-muted-foreground">
                    {typeof address === "string" ? (
                      address
                    ) : (
                      <>
                        {address?.addressLine1 ||
                          address?.line1 ||
                          address?.street ||
                          ""}

                        {(address?.addressLine2 || address?.line2) && <br />}

                        {address?.addressLine2 || address?.line2 || ""}

                        {(address?.city ||
                          address?.state ||
                          address?.pincode ||
                          address?.postalCode) && <br />}

                        {[
                          address?.city,
                          address?.state,
                          address?.pincode || address?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}

                        {address?.country && (
                          <>
                            <br />
                            {address.country}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* Description */}
              {(request?.description ||
                request?.about ||
                request?.businessDescription) && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Business Description
                  </h3>

                  <p className="rounded-xl border border-border p-4 text-sm leading-6 text-muted-foreground">
                    {request.description ||
                      request.about ||
                      request.businessDescription}
                  </p>
                </section>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Verification Documents
              </h3>

              {documents.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {documents.map((document, index) => {
                    const documentName =
                      document?.name ||
                      document?.title ||
                      document?.type ||
                      `Document ${index + 1}`;

                    const documentUrl =
                      document?.url || document?.fileUrl || document?.path;

                    return (
                      <div
                        key={document?._id || document?.id || index}
                        className="rounded-xl border border-border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            📄
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {documentName}
                            </p>

                            {document?.status && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatStatus(
                                  String(document.status).toLowerCase(),
                                )}
                              </p>
                            )}
                          </div>

                          {documentUrl && (
                            <a
                              href={documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/5"
                            >
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="No verification documents submitted." />
              )}
            </div>
          )}

          {activeTab === "review" && (
            <div className="space-y-5">
              <section>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Application Review
                </h3>

                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Current Status
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses()}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  {request?.reviewedBy && (
                    <div className="mt-4 border-t border-border pt-4">
                      <InfoItem
                        label="Reviewed By"
                        value={
                          request.reviewedBy?.fullName ||
                          request.reviewedBy?.name ||
                          request.reviewedBy
                        }
                      />
                    </div>
                  )}

                  {request?.reviewedAt && (
                    <div className="mt-4">
                      <InfoItem
                        label="Reviewed On"
                        value={formatDate(request.reviewedAt)}
                      />
                    </div>
                  )}

                  {request?.rejectionReason && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">
                        Rejection Reason
                      </p>

                      <p className="mt-1 text-sm text-red-600">
                        {request.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {isPending && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Admin Decision
                  </h3>

                  <div className="rounded-xl border border-border p-4">
                    {!showRejectForm ? (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => onApprove?.(request)}
                          disabled={loading}
                          className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? "Processing..." : "Approve Application"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRejectForm(true)}
                          disabled={loading}
                          className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject Application
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="rejectReason"
                          className="mb-2 block text-sm font-medium text-foreground"
                        >
                          Rejection Reason
                        </label>

                        <textarea
                          id="rejectReason"
                          value={rejectReason}
                          onChange={(event) =>
                            setRejectReason(event.target.value)
                          }
                          rows={4}
                          disabled={loading}
                          placeholder="Explain why this vendor application is being rejected..."
                          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectReason("");
                            }}
                            disabled={loading}
                            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleReject}
                            disabled={loading || !rejectReason.trim()}
                            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loading ? "Rejecting..." : "Confirm Rejection"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-xs text-muted-foreground">
            Request ID:{" "}
            <span className="font-medium text-foreground">
              {request?._id || request?.id || "N/A"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>

    <p className="mt-1 break-words text-sm font-medium text-foreground">
      {value || "N/A"}
    </p>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
    <div className="text-2xl">📭</div>

    <p className="mt-2 text-sm text-muted-foreground">{message}</p>
  </div>
);

export default VendorRequestDetails;
