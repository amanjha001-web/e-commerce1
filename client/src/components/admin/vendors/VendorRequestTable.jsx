

const VendorRequestTable = ({
  requests = [],
  loading = false,
  onViewRequest,
  onApprove,
  onReject,
}) => {
  const getApplicantName = (request) =>
    request?.vendor?.businessName ||
    request?.businessName ||
    request?.storeName ||
    request?.user?.fullName ||
    request?.user?.name ||
    request?.fullName ||
    request?.name ||
    request?.username ||
    "Unnamed Applicant";

  const getOwnerName = (request) =>
    request?.user?.fullName ||
    request?.user?.name ||
    request?.owner?.fullName ||
    request?.owner?.name ||
    request?.fullName ||
    request?.name ||
    "N/A";

  const getEmail = (request) =>
    request?.email || request?.user?.email || request?.owner?.email || "N/A";

  const getStatus = (request) =>
    String(
      request?.status || request?.requestStatus || "pending",
    ).toLowerCase();

  const getInitials = (request) => {
    const name = getApplicantName(request);

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

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

  const formatStatus = (status) =>
    status.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const getStatusClasses = (status) => {
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

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Applicant",
                  "Owner",
                  "Email",
                  "Status",
                  "Requested",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />

                      <div className="space-y-2">
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-40 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-border bg-background px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          📋
        </div>

        <h3 className="mt-4 text-base font-semibold text-foreground">
          No vendor requests found
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          There are no vendor registration requests to display.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Applicant
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Owner
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Requested
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => {
              const status = getStatus(request);

              const avatar =
                request?.vendor?.logo ||
                request?.logo ||
                request?.storeLogo ||
                request?.user?.avatar ||
                request?.user?.profileImage ||
                request?.avatar;

              const isPending =
                status === "pending" ||
                status === "requested" ||
                status === "under_review";

              return (
                <tr
                  key={request?._id || request?.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                >
                  {/* Applicant */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={getApplicantName(request)}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(request)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewRequest?.(request)}
                          className="max-w-[220px] truncate text-left text-sm font-semibold text-foreground transition hover:text-primary"
                        >
                          {getApplicantName(request)}
                        </button>

                        {request?.category && (
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                            {request.category}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-5 py-4 text-sm text-foreground">
                    {getOwnerName(request)}
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {getEmail(request)}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        status,
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </td>

                  {/* Requested */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {formatDate(
                      request?.createdAt ||
                        request?.requestedAt ||
                        request?.created_at,
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewRequest?.(request)}
                        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                        title="View request"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                          />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove?.(request)}
                            className="rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-600 transition hover:bg-green-50"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => onReject?.(request)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {requests.map((request) => {
          const status = getStatus(request);

          const avatar =
            request?.vendor?.logo ||
            request?.logo ||
            request?.storeLogo ||
            request?.user?.avatar ||
            request?.user?.profileImage ||
            request?.avatar;

          const isPending =
            status === "pending" ||
            status === "requested" ||
            status === "under_review";

          return (
            <div
              key={request?._id || request?.id}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={getApplicantName(request)}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(request)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onViewRequest?.(request)}
                    className="truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {getApplicantName(request)}
                  </button>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {getEmail(request)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                    status,
                  )}`}
                >
                  {formatStatus(status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Owner</p>

                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {getOwnerName(request)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Requested</p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(
                      request?.createdAt ||
                        request?.requestedAt ||
                        request?.created_at,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => onViewRequest?.(request)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  View
                </button>

                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => onApprove?.(request)}
                      className="flex-1 rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-600 transition hover:bg-green-50"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => onReject?.(request)}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorRequestTable;
