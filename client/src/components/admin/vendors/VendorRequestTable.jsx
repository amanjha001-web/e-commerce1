import { useState } from "react";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusClasses = (status) => {
  const normalizedStatus = status?.toLowerCase();

  const classes = {
    pending: "status-badge amber",
    under_review: "status-badge",
    approved: "status-badge green",
    rejected: "status-badge red",
  };

  return classes[normalizedStatus] || "status-badge";
};

const formatStatus = (status = "pending") =>
  status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const VendorRequestTable = ({
  requests = [],
  loading = false,
  saving = false,
  onView,
  onApprove,
  onReject,
  onDelete,
}) => {
  const [processingId, setProcessingId] = useState(null);

  const handleAction = async (action, request) => {
    if (!action || saving || processingId) return;

    setProcessingId(request._id);

    try {
      await action(request);
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatus = (status) => (
    <span className={getStatusClasses(status)}>
      {formatStatus(status)}
    </span>
  );

  const renderApplicant = (request) => {
    const shopName =
      request?.shopName ||
      request?.businessName ||
      request?.storeName ||
      "Unnamed Store";

    const ownerName =
      request?.user?.fullName ||
      request?.user?.name ||
      request?.user?.username ||
      "Unknown Applicant";

    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--soft)] text-sm font-bold text-[var(--primary)]">
          {getInitials(shopName)}
        </div>

        <div className="min-w-0">
          <p className="truncate font-bold text-[var(--text)]">{shopName}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
            Owner: {ownerName}
          </p>
          {request?.businessName && request.businessName !== shopName && (
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
              {request.businessName}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderActions = (request) => {
    const isProcessing = processingId === request._id || saving;
    const isPending =
      request?.status === "pending" || request?.status === "under_review";

    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onView?.(request)}
          disabled={isProcessing}
          className="btnsm disabled:cursor-not-allowed disabled:opacity-50"
        >
          View
        </button>

        {isPending && (
          <>
            <button
              type="button"
              onClick={() => handleAction(onApprove, request)}
              disabled={isProcessing || !onApprove}
              className="btnsm primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingId === request._id ? "Processing..." : "Approve"}
            </button>

            <button
              type="button"
              onClick={() => handleAction(onReject, request)}
              disabled={isProcessing || !onReject}
              className="btnsm border-[#f3cbd0] bg-[#fff0f1] text-[var(--red)] hover:bg-[#ffe3e6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => handleAction(onDelete, request)}
            disabled={isProcessing}
            className="btnsm border-[#f3cbd0] text-[var(--red)] hover:bg-[#fff0f1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <div className="h-5 w-44 animate-pulse rounded bg-[var(--soft)]" />
        </div>

        <div className="space-y-4 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-[var(--soft)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-[var(--soft)]" />
                <div className="h-3 w-28 rounded bg-[var(--soft)]" />
              </div>
              <div className="hidden h-6 w-20 rounded-full bg-[var(--soft)] sm:block" />
              <div className="hidden h-8 w-24 rounded bg-[var(--soft)] md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--soft)] text-2xl">
          📋
        </div>

        <h3 className="mt-4 text-base font-bold text-[var(--text)]">
          No vendor requests found
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">
          There are no requests matching your current filter. Try another status
          or check again later.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[#fcf9fa] px-5 py-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text)]">
            Vendor Applications
          </h3>
          <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
            Review applicant information and manage vendor requests.
          </p>
        </div>

        <span className="pill">
          {requests.length} shown
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-[var(--line)] bg-[#fcf9fa] text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-5 py-3.5">
                Store / Applicant
              </th>
              <th className="px-5 py-3.5">
                Contact
              </th>
              <th className="px-5 py-3.5">
                Location
              </th>
              <th className="px-5 py-3.5">
                Status
              </th>
              <th className="px-5 py-3.5">
                Submitted
              </th>
              <th className="px-5 py-3.5">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0e8eb]">
            {requests.map((request) => (
              <tr
                key={request._id}
                className="transition hover:bg-[var(--soft)]/40"
              >
                <td className="px-5 py-4">{renderApplicant(request)}</td>

                <td className="px-5 py-4">
                  <p className="max-w-[220px] truncate text-sm font-medium text-[var(--text)]">
                    {request?.email || request?.user?.email || "—"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {request?.phone || "No phone provided"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-[var(--text)]">
                    {request?.address?.city || "—"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {request?.address?.state || ""}
                    {request?.address?.country
                      ? `${request?.address?.state ? ", " : ""}${request.address.country}`
                      : ""}
                  </p>
                </td>

                <td className="px-5 py-4">{renderStatus(request?.status)}</td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--muted)]">
                  {formatDate(request?.createdAt)}
                </td>

                <td className="px-5 py-4">{renderActions(request)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile and tablet cards */}
      <div className="space-y-4 p-4 lg:hidden">
        {requests.map((request) => (
          <article
            key={request._id}
            className="rounded-xl border border-[var(--line)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{renderApplicant(request)}</div>
              {renderStatus(request?.status)}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--muted)]">Email</p>
                <p className="mt-1 break-words text-sm text-[var(--text)]">
                  {request?.email || request?.user?.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--muted)]">Phone</p>
                <p className="mt-1 text-sm text-[var(--text)]">
                  {request?.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--muted)]">City</p>
                <p className="mt-1 text-sm text-[var(--text)]">
                  {request?.address?.city || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--muted)]">
                  Submitted
                </p>
                <p className="mt-1 text-sm text-[var(--text)]">
                  {formatDate(request?.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--line)] pt-4">
              {renderActions(request)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default VendorRequestTable;
