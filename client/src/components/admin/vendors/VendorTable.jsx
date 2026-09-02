

const VendorTable = ({
  vendors = [],
  loading = false,
  onViewVendor,
  onEditVendor,
  onDeleteVendor,
  onToggleStatus,
}) => {
  const getVendorName = (vendor) =>
    vendor?.businessName ||
    vendor?.storeName ||
    vendor?.companyName ||
    vendor?.fullName ||
    vendor?.name ||
    vendor?.username ||
    "Unnamed Vendor";

  const getOwnerName = (vendor) =>
    vendor?.owner?.fullName ||
    vendor?.owner?.name ||
    vendor?.user?.fullName ||
    vendor?.user?.name ||
    vendor?.fullName ||
    vendor?.name ||
    "N/A";

  const getEmail = (vendor) =>
    vendor?.email || vendor?.owner?.email || vendor?.user?.email || "N/A";

  const getStatus = (vendor) => {
    if (vendor?.status) return String(vendor.status).toLowerCase();

    if (vendor?.isActive === false) return "inactive";

    return "active";
  };

  const getInitials = (vendor) => {
    const name = getVendorName(vendor);

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

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
      case "approved":
        return "bg-green-100 text-green-700";

      case "pending":
      case "requested":
        return "bg-yellow-100 text-yellow-700";

      case "suspended":
      case "blocked":
      case "inactive":
      case "rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status) =>
    status.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Vendor",
                  "Owner",
                  "Email",
                  "Status",
                  "Joined",
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
                      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
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
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Loading */}
        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />

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

  if (!vendors.length) {
    return (
      <div className="rounded-2xl border border-border bg-background px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          🏪
        </div>

        <h3 className="mt-4 text-base font-semibold text-foreground">
          No vendors found
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          There are no vendors available to display.
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
                Vendor
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
                Joined
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {vendors.map((vendor) => {
              const status = getStatus(vendor);
              const avatar =
                vendor?.logo ||
                vendor?.storeLogo ||
                vendor?.avatar ||
                vendor?.image;

              return (
                <tr
                  key={vendor?._id || vendor?.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                >
                  {/* Vendor */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={getVendorName(vendor)}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(vendor)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewVendor?.(vendor)}
                          className="max-w-[220px] truncate text-left text-sm font-semibold text-foreground transition hover:text-primary"
                        >
                          {getVendorName(vendor)}
                        </button>

                        {vendor?.slug && (
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                            @{vendor.slug}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-5 py-4 text-sm text-foreground">
                    {getOwnerName(vendor)}
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {getEmail(vendor)}
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

                  {/* Joined */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {formatDate(
                      vendor?.createdAt ||
                        vendor?.joinedAt ||
                        vendor?.created_at,
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewVendor?.(vendor)}
                        title="View vendor"
                        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
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

                      <button
                        type="button"
                        onClick={() => onEditVendor?.(vendor)}
                        title="Edit vendor"
                        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
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
                            d="M12 20h9"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus?.(vendor)}
                        title={
                          status === "active"
                            ? "Deactivate vendor"
                            : "Activate vendor"
                        }
                        className={`rounded-lg border border-border p-2 transition ${
                          status === "active"
                            ? "text-red-500 hover:border-red-500 hover:text-red-600"
                            : "text-green-600 hover:border-green-500 hover:text-green-600"
                        }`}
                      >
                        {status === "active" ? (
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path strokeLinecap="round" d="M9 9l6 6m0-6l-6 6" />
                          </svg>
                        ) : (
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
                              d="M5 12l4 4L19 6"
                            />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteVendor?.(vendor)}
                        title="Delete vendor"
                        className="rounded-lg border border-border p-2 text-red-500 transition hover:border-red-500 hover:bg-red-50"
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
                            d="M3 6h18"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 6V4h8v2m-9 0l1 14h8l1-14M10 11v5m4-5v5"
                          />
                        </svg>
                      </button>
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
        {vendors.map((vendor) => {
          const status = getStatus(vendor);

          const avatar =
            vendor?.logo ||
            vendor?.storeLogo ||
            vendor?.avatar ||
            vendor?.image;

          return (
            <div
              key={vendor?._id || vendor?.id}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={getVendorName(vendor)}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(vendor)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onViewVendor?.(vendor)}
                    className="truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {getVendorName(vendor)}
                  </button>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {getEmail(vendor)}
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
                    {getOwnerName(vendor)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Joined</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(
                      vendor?.createdAt ||
                        vendor?.joinedAt ||
                        vendor?.created_at,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => onViewVendor?.(vendor)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => onEditVendor?.(vendor)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus?.(vendor)}
                  className={`rounded-lg border border-border px-3 py-2 text-xs font-medium transition ${
                    status === "active"
                      ? "text-red-500 hover:border-red-500"
                      : "text-green-600 hover:border-green-500"
                  }`}
                >
                  {status === "active" ? "Disable" : "Enable"}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteVendor?.(vendor)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-red-500 transition hover:border-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorTable;
