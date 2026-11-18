

const isUserObject = (val) =>
  Boolean(val) && typeof val === "object" && !Array.isArray(val);

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

const TicketTable = ({
  tickets = [],
  loading = false,
  fallbackUser = null,
  onViewTicket,
  onEditTicket,
  onDeleteTicket,
  onStatusChange,
}) => {
  const getTicketId = (ticket) =>
    ticket?.ticketId ||
    ticket?.ticketNumber ||
    ticket?._id ||
    ticket?.id ||
    "—";

  const formatTicketDisplayId = (id) => {
    const str = String(id || "—");
    return str.startsWith("TCK-") || str.length <= 12 ? str : str.slice(-8);
  };

  const getUser = (ticket) => {
    const candidates = [
      ticket?.userId,
      ticket?.user,
      ticket?.customer,
      ticket?.messages?.find(
        (m) =>
          isUserObject(m?.sender) &&
          !ADMIN_ROLES.has(String(m.sender.role || "").toLowerCase()),
      )?.sender,
    ].filter(isUserObject);

    const primary = candidates[0] || {};
    if (!isUserObject(fallbackUser)) return primary;

    const primaryId = primary?._id || primary?.id;
    const rawUserId =
      typeof ticket?.userId === "string"
        ? ticket.userId
        : ticket?.userId?._id || ticket?.userId?.id;
    const fallbackId = fallbackUser?._id || fallbackUser?.id;

    // Fill missing profile details only when ticket belongs to fallbackUser or userId is unpopulated
    const canApplyFallback =
      !primaryId ||
      !fallbackId ||
      String(primaryId) === String(fallbackId) ||
      (!isUserObject(ticket?.userId) &&
        (!rawUserId || String(rawUserId) === String(fallbackId)));

    if (!canApplyFallback) return primary;

    return {
      ...fallbackUser,
      ...primary,
      fullName: primary.fullName || fallbackUser.fullName,
      name: primary.name || fallbackUser.name,
      username: primary.username || fallbackUser.username,
      email: primary.email || fallbackUser.email,
    };
  };

  const getUserName = (ticket) => {
    const user = getUser(ticket);
    const resolved =
      user?.fullName ||
      user?.name ||
      user?.username ||
      ticket?.userName ||
      ticket?.customerName;

    if (resolved && String(resolved).trim()) return String(resolved).trim();

    const email = user?.email || ticket?.email;
    if (email && String(email).includes("@")) {
      return String(email).split("@")[0];
    }

    return "Customer";
  };

  const getUserEmail = (ticket) => {
    const user = getUser(ticket);

    return user?.email || ticket?.email || "—";
  };

  const getSubject = (ticket) =>
    ticket?.subject || ticket?.title || "No subject";

  const getCategory = (ticket) =>
    ticket?.category || ticket?.type || "General";

  const getPriority = (ticket) =>
    String(ticket?.priority || "medium").toLowerCase();

  const getStatus = (ticket) =>
    String(ticket?.status || "open").toLowerCase();

  const getCreatedAt = (ticket) =>
    ticket?.createdAt || ticket?.created_at || ticket?.date;

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

  const formatStatus = (status) => {
    const labels = {
      open: "Open",
      pending: "Pending",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };

    return (
      labels[status] ||
      status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  };

  const formatPriority = (priority) => {
    const labels = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    };

    return (
      labels[priority] ||
      priority.charAt(0).toUpperCase() + priority.slice(1)
    );
  };

  const getStatusClasses = (status) => {
    const classes = {
      open: "bg-[var(--soft)] text-[var(--primary)] ring-[var(--primary)]/25",
      pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
      in_progress: "bg-amber-50 text-amber-800 ring-amber-600/20",
      waiting_for_customer: "bg-amber-50 text-amber-800 ring-amber-600/20",
      resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      closed: "bg-gray-100 text-gray-700 ring-gray-500/20",
    };

    return (
      classes[status] ||
      "bg-gray-100 text-gray-700 ring-gray-500/20"
    );
  };

  const getPriorityClasses = (priority) => {
    const classes = {
      low: "bg-gray-100 text-gray-700 ring-gray-500/20",
      medium: "bg-[var(--soft)] text-[var(--primary)] ring-[var(--primary)]/25",
      high: "bg-orange-50 text-orange-700 ring-orange-600/20",
      urgent: "bg-red-50 text-red-700 ring-red-600/20",
    };

    return (
      classes[priority] ||
      "bg-gray-100 text-gray-700 ring-gray-500/20"
    );
  };

  const getInitials = (name) => {
    if (!name || name === "Unknown User") return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const handleView = (ticket) => {
    onViewTicket?.(ticket);
  };

  const handleEdit = (ticket) => {
    onEditTicket?.(ticket);
  };

  const handleDelete = (ticket) => {
    onDeleteTicket?.(ticket);
  };

  const handleStatusChange = (ticket) => {
    onStatusChange?.(ticket);
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-muted/40">
                {Array.from({ length: 8 }).map((_, index) => (
                  <th
                    key={index}
                    className="px-6 py-4 text-left"
                  >
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4"
                    >
                      <div className="h-4 w-full max-w-[130px] animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-4 lg:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-xl border border-border p-4"
            >
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          🎫
        </div>

        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No support tickets found
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          There are currently no support tickets available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/40">
            <tr>
              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ticket
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                User
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Priority
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Created
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {tickets.map((ticket) => {
              const id = getTicketId(ticket);
              const userName = getUserName(ticket);
              const userEmail = getUserEmail(ticket);
              const subject = getSubject(ticket);
              const priority = getPriority(ticket);
              const status = getStatus(ticket);
              const category = getCategory(ticket);

              return (
                <tr
                  key={id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleView(ticket)}
                      className="cursor-pointer font-semibold text-[var(--primary)] transition hover:underline"
                    >
                      #{formatTicketDisplayId(id)}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(userName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {userName}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="max-w-[240px] px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleView(ticket)}
                      className="block max-w-full truncate text-left text-sm font-medium text-foreground transition hover:text-primary"
                      title={subject}
                    >
                      {subject}
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        getPriorityClasses(priority),
                      ].join(" ")}
                    >
                      {formatPriority(priority)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        getStatusClasses(status),
                      ].join(" ")}
                    >
                      {formatStatus(status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {category}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(getCreatedAt(ticket))}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {onViewTicket && (
                        <button
                          type="button"
                          onClick={() => handleView(ticket)}
                          className="btnsm cursor-pointer !text-xs !py-1.5 !px-3"
                        >
                          View Details →
                        </button>
                      )}

                      {onEditTicket && (
                        <button
                          type="button"
                          onClick={() => handleEdit(ticket)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted cursor-pointer"
                        >
                          Edit
                        </button>
                      )}

                      {onStatusChange && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ticket)}
                          className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 cursor-pointer"
                        >
                          Status
                        </button>
                      )}

                      {onDeleteTicket && (
                        <button
                          type="button"
                          onClick={() => handleDelete(ticket)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
                        >
                          Delete
                        </button>
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
      <div className="divide-y divide-border lg:hidden">
        {tickets.map((ticket) => {
          const id = getTicketId(ticket);
          const userName = getUserName(ticket);
          const userEmail = getUserEmail(ticket);
          const subject = getSubject(ticket);
          const priority = getPriority(ticket);
          const status = getStatus(ticket);
          const category = getCategory(ticket);

          return (
            <div
              key={id}
              className="space-y-4 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleView(ticket)}
                      className="cursor-pointer font-semibold text-[var(--primary)] hover:underline"
                    >
                      #{formatTicketDisplayId(id)}
                    </button>

                  <h3 className="mt-1 truncate text-sm font-semibold text-foreground">
                    {subject}
                  </h3>
                </div>

                <span
                  className={[
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                    getStatusClasses(status),
                  ].join(" ")}
                >
                  {formatStatus(status)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(userName)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {userName}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Priority
                  </p>

                  <span
                    className={[
                      "mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                      getPriorityClasses(priority),
                    ].join(" ")}
                  >
                    {formatPriority(priority)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Category
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {category}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(getCreatedAt(ticket))}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Ticket ID
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    #{formatTicketDisplayId(id)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {onViewTicket && (
                  <button
                    type="button"
                    onClick={() => handleView(ticket)}
                    className="btnsm flex-1 cursor-pointer !text-xs !py-2"
                  >
                    View Details →
                  </button>
                )}

                {onEditTicket && (
                  <button
                    type="button"
                    onClick={() => handleEdit(ticket)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted cursor-pointer"
                  >
                    Edit
                  </button>
                )}

                {onStatusChange && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(ticket)}
                    className="rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 cursor-pointer"
                  >
                    Status
                  </button>
                )}

                {onDeleteTicket && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ticket)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketTable;

