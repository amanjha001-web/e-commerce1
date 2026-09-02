import { useState } from "react";

const TicketDetails = ({
  ticket = null,
  open = false,
  loading = false,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!open || !ticket) return null;

  const user = ticket?.user || ticket?.customer || {};

  const ticketId =
    ticket?._id ||
    ticket?.id ||
    ticket?.ticketId ||
    ticket?.ticketNumber ||
    "—";

  const userName =
    user?.fullName ||
    user?.name ||
    ticket?.userName ||
    ticket?.customerName ||
    "Unknown User";

  const userEmail = user?.email || ticket?.email || "—";

  const userPhone = user?.phone || user?.phoneNumber || ticket?.phone || "—";

  const subject = ticket?.subject || ticket?.title || "No subject";

  const description =
    ticket?.description ||
    ticket?.message ||
    ticket?.content ||
    "No description available.";

  const category = ticket?.category || ticket?.type || "General";

  const priority = String(ticket?.priority || "medium").toLowerCase();

  const status = String(ticket?.status || "open").toLowerCase();

  const createdAt = ticket?.createdAt || ticket?.created_at || ticket?.date;

  const updatedAt = ticket?.updatedAt || ticket?.updated_at;

  const assignedTo =
    ticket?.assignedTo || ticket?.assignedAgent || ticket?.agent || null;

  const messages =
    ticket?.messages || ticket?.conversation || ticket?.replies || [];

  const timeline =
    ticket?.timeline || ticket?.history || ticket?.activity || [];

  const formatDate = (date, includeTime = false) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(includeTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    });
  };

  const formatLabel = (value) => {
    if (!value) return "—";

    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusClasses = (value) => {
    const classes = {
      open: "bg-blue-50 text-blue-700 ring-blue-600/20",
      pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
      in_progress: "bg-purple-50 text-purple-700 ring-purple-600/20",
      resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      closed: "bg-gray-100 text-gray-700 ring-gray-500/20",
    };

    return classes[value] || "bg-gray-100 text-gray-700 ring-gray-500/20";
  };

  const getPriorityClasses = (value) => {
    const classes = {
      low: "bg-gray-100 text-gray-700 ring-gray-500/20",
      medium: "bg-blue-50 text-blue-700 ring-blue-600/20",
      high: "bg-orange-50 text-orange-700 ring-orange-600/20",
      urgent: "bg-red-50 text-red-700 ring-red-600/20",
    };

    return classes[value] || "bg-gray-100 text-gray-700 ring-gray-500/20";
  };

  const getUserInitials = (name) => {
    if (!name || name === "Unknown User") {
      return "U";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const getMessageText = (message) =>
    message?.message ||
    message?.content ||
    message?.text ||
    message?.body ||
    "";

  const getMessageUser = (message) => {
    const sender = message?.user || message?.sender || message?.author || {};

    return (
      sender?.fullName ||
      sender?.name ||
      message?.userName ||
      message?.senderName ||
      (message?.isAdmin ? "Admin" : "User")
    );
  };

  const getTimelineTitle = (item) =>
    item?.title ||
    item?.action ||
    item?.event ||
    item?.status ||
    "Ticket updated";

  const getTimelineDescription = (item) =>
    item?.description || item?.message || item?.details || "";

  const handleEdit = () => {
    onEdit?.(ticket);
  };

  const handleStatusChange = () => {
    onStatusChange?.(ticket);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-details-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-primary">
                #{String(ticketId).slice(-8)}
              </span>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  getStatusClasses(status),
                ].join(" ")}
              >
                {formatLabel(status)}
              </span>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  getPriorityClasses(priority),
                ].join(" ")}
              >
                {formatLabel(priority)} Priority
              </span>
            </div>

            <h2
              id="ticket-details-title"
              className="mt-2 truncate text-lg font-semibold text-foreground sm:text-xl"
            >
              {subject}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Created {formatDate(createdAt, true)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto border-b border-border">
          <div className="flex min-w-max px-5 sm:px-6">
            {[
              ["overview", "Overview"],
              ["conversation", "Conversation"],
              ["user", "User"],
              ["timeline", "Timeline"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  "border-b-2 px-4 py-3 text-sm font-medium transition",
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="space-y-5">
              <div className="h-32 animate-pulse rounded-xl bg-muted" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
              </div>

              <div className="h-40 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : (
            <>
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        🎫
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Ticket Description
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Status</p>

                      <span
                        className={[
                          "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          getStatusClasses(status),
                        ].join(" ")}
                      >
                        {formatLabel(status)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Priority</p>

                      <span
                        className={[
                          "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          getPriorityClasses(priority),
                        ].join(" ")}
                      >
                        {formatLabel(priority)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Category</p>

                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {category}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Last Updated
                      </p>

                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatDate(updatedAt || createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-foreground">
                        Customer
                      </h3>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {getUserInitials(userName)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {userName}
                          </p>

                          <p className="truncate text-sm text-muted-foreground">
                            {userEmail}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <div className="flex justify-between gap-4">
                          <span className="text-sm text-muted-foreground">
                            Phone
                          </span>

                          <span className="text-right text-sm font-medium text-foreground">
                            {userPhone}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-sm text-muted-foreground">
                            User ID
                          </span>

                          <span className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">
                            {user?._id || user?.id || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-foreground">
                        Assignment
                      </h3>

                      {assignedTo ? (
                        <div className="mt-4">
                          <p className="font-medium text-foreground">
                            {assignedTo?.fullName ||
                              assignedTo?.name ||
                              assignedTo?.email ||
                              "Assigned Agent"}
                          </p>

                          {assignedTo?.email && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {assignedTo.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg bg-muted/40 p-4">
                          <p className="text-sm text-muted-foreground">
                            This ticket is not assigned to an agent.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground">
                          Ticket ID
                        </p>

                        <p className="mt-1 break-all text-sm font-medium text-foreground">
                          {ticketId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation */}
              {activeTab === "conversation" && (
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const sender = getMessageUser(message);

                      const isAdmin =
                        message?.isAdmin ||
                        message?.senderType === "admin" ||
                        message?.role === "admin";

                      return (
                        <div
                          key={message?._id || message?.id || index}
                          className={[
                            "flex",
                            isAdmin ? "justify-end" : "justify-start",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "max-w-[85%] rounded-2xl border p-4 sm:max-w-[70%]",
                              isAdmin
                                ? "border-primary/20 bg-primary/5"
                                : "border-border bg-muted/30",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-semibold text-foreground">
                                {sender}
                              </p>

                              <span className="text-xs text-muted-foreground">
                                {formatDate(
                                  message?.createdAt ||
                                    message?.created_at ||
                                    message?.date,
                                  true,
                                )}
                              </span>
                            </div>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                              {getMessageText(message) || "No message content."}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
                      <div className="text-3xl">💬</div>

                      <h3 className="mt-3 font-semibold text-foreground">
                        No conversation yet
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        There are no replies or messages for this ticket.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* User */}
              {activeTab === "user" && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-border p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {getUserInitials(userName)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {userName}
                        </h3>

                        <p className="truncate text-sm text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      Contact Information
                    </h3>

                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>

                        <p className="mt-1 break-all text-sm font-medium text-foreground">
                          {userEmail}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {userPhone}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">User ID</p>

                        <p className="mt-1 break-all text-sm font-medium text-foreground">
                          {user?._id || user?.id || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {activeTab === "timeline" && (
                <div>
                  {timeline.length > 0 ? (
                    <div className="relative ml-2 border-l border-border pl-6">
                      <div className="space-y-8">
                        {timeline.map((item, index) => (
                          <div
                            key={item?._id || item?.id || index}
                            className="relative"
                          >
                            <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary ring-1 ring-primary/20" />

                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-foreground">
                                  {formatLabel(getTimelineTitle(item))}
                                </h3>

                                <span className="text-xs text-muted-foreground">
                                  {formatDate(
                                    item?.createdAt ||
                                      item?.created_at ||
                                      item?.date,
                                    true,
                                  )}
                                </span>
                              </div>

                              {getTimelineDescription(item) && (
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                  {getTimelineDescription(item)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
                      <div className="text-3xl">🕒</div>

                      <h3 className="mt-3 font-semibold text-foreground">
                        No timeline available
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Ticket activity will appear here when available.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Close
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleEdit}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit Ticket
            </button>

            <button
              type="button"
              onClick={handleStatusChange}
              disabled={loading}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Change Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
