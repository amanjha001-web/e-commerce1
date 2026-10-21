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
    pending: "bg-amber-100 text-amber-700 ring-amber-200",
    under_review: "bg-blue-100 text-blue-700 ring-blue-200",
    approved: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    rejected: "bg-red-100 text-red-700 ring-red-200",
  };

  return classes[normalizedStatus] || "bg-gray-100 text-gray-700 ring-gray-200";
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
        status,
      )}`}
    >
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
          {getInitials(shopName)}
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{shopName}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            Owner: {ownerName}
          </p>
          {request?.businessName && request.businessName !== shopName && (
            <p className="mt-0.5 truncate text-xs text-gray-400">
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
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          View
        </button>

        {isPending && (
          <>
            <button
              type="button"
              onClick={() => handleAction(onApprove, request)}
              disabled={isProcessing || !onApprove}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingId === request._id ? "Processing..." : "Approve"}
            </button>

            <button
              type="button"
              onClick={() => handleAction(onReject, request)}
              disabled={isProcessing || !onReject}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="space-y-4 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-3 w-28 rounded bg-gray-100" />
              </div>
              <div className="hidden h-6 w-20 rounded-full bg-gray-200 sm:block" />
              <div className="hidden h-8 w-24 rounded bg-gray-100 md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
          📋
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-900">
          No vendor requests found
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          There are no requests matching your current filter. Try another status
          or check again later.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="font-semibold text-gray-900">Vendor Applications</h3>
          <p className="mt-1 text-xs text-gray-500">
            Review applicant information and manage vendor requests.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {requests.length} shown
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Store / Applicant
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contact
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Location
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Submitted
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {requests.map((request) => (
              <tr key={request._id} className="transition hover:bg-gray-50/70">
                <td className="px-5 py-4">{renderApplicant(request)}</td>

                <td className="px-5 py-4">
                  <p className="max-w-[220px] truncate text-sm text-gray-800">
                    {request?.email || request?.user?.email || "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {request?.phone || "No phone provided"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm text-gray-700">
                    {request?.address?.city || "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {request?.address?.state || ""}
                    {request?.address?.country
                      ? `${request?.address?.state ? ", " : ""}${request.address.country}`
                      : ""}
                  </p>
                </td>

                <td className="px-5 py-4">{renderStatus(request?.status)}</td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
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
            className="rounded-xl border border-gray-200 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{renderApplicant(request)}</div>
              {renderStatus(request?.status)}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400">Email</p>
                <p className="mt-1 break-words text-sm text-gray-700">
                  {request?.email || request?.user?.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400">Phone</p>
                <p className="mt-1 text-sm text-gray-700">
                  {request?.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400">City</p>
                <p className="mt-1 text-sm text-gray-700">
                  {request?.address?.city || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400">Submitted</p>
                <p className="mt-1 text-sm text-gray-700">
                  {formatDate(request?.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              {renderActions(request)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default VendorRequestTable;
