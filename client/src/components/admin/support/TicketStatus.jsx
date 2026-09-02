import { useState } from "react";

const TicketStatus = ({
  ticket = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [status, setStatus] = useState("open");
  const [reason, setReason] = useState("");

  if (!open || !ticket) return null;

  const statusOptions = [
    {
      value: "open",
      label: "Open",
      description: "Ticket is newly opened and requires attention.",
    },
    {
      value: "pending",
      label: "Pending",
      description: "Waiting for customer or additional information.",
    },
    {
      value: "in_progress",
      label: "In Progress",
      description: "Support team is currently working on the ticket.",
    },
    {
      value: "resolved",
      label: "Resolved",
      description: "The issue has been resolved successfully.",
    },
    {
      value: "closed",
      label: "Closed",
      description:
        "Ticket is completely closed and requires no further action.",
    },
  ];

  const currentStatus = String(ticket?.status || "open").toLowerCase();

  const selectedOption =
    statusOptions.find((item) => item.value === status) || statusOptions[0];

  const formatLabel = (value) =>
    String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!ticket || !status || status === currentStatus) return;

    onConfirm?.(ticket, status, reason.trim());
  };

  const ticketId =
    ticket?._id ||
    ticket?.id ||
    ticket?.ticketId ||
    ticket?.ticketNumber ||
    "—";

  const subject = ticket?.subject || ticket?.title || "No subject";

  const statusChanged = status !== currentStatus;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-status-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Ticket Status
            </p>

            <h2
              id="ticket-status-title"
              className="mt-1 text-lg font-semibold text-foreground"
            >
              Update Ticket Status
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              #{String(ticketId).slice(-8)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Ticket Info */}
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Ticket</p>

            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {subject}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Current:</span>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  getStatusClasses(currentStatus),
                ].join(" ")}
              >
                {formatLabel(currentStatus)}
              </span>

              {statusChanged && (
                <>
                  <span className="text-xs text-muted-foreground">→</span>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                      getStatusClasses(status),
                    ].join(" ")}
                  >
                    {formatLabel(status)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status Options */}
          <div className="space-y-3 px-5 py-5 sm:px-6">
            <label className="text-sm font-semibold text-foreground">
              Select new status
            </label>

            <div className="space-y-2">
              {statusOptions.map((option) => {
                const selected = status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    disabled={loading}
                    className={[
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/40",
                      loading ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40",
                      ].join(" ")}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {option.label}
                        </span>

                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                            getStatusClasses(option.value),
                          ].join(" ")}
                        >
                          {option.label}
                        </span>
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reason */}
            <div className="pt-2">
              <label
                htmlFor="ticket-status-reason"
                className="text-sm font-semibold text-foreground"
              >
                Reason{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>

              <textarea
                id="ticket-status-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={loading}
                rows={3}
                maxLength={500}
                placeholder={`Why are you changing the ticket to "${selectedOption.label}"?`}
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-1 text-right text-xs text-muted-foreground">
                {reason.length}/500
              </div>
            </div>

            {/* Warning */}
            {(status === "resolved" || status === "closed") &&
              statusChanged && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex gap-3">
                    <span className="text-lg">⚠️</span>

                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Ticket will be marked as{" "}
                        {formatLabel(status).toLowerCase()}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Make sure the customer's issue has been properly handled
                        before changing the status.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !statusChanged}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketStatus;
