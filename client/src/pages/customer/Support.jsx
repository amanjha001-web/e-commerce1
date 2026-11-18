import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ReactReduxContext } from "react-redux";
import { toast } from "sonner";
import supportService from "../../services/support.service";

import TicketTable from "../../components/admin/support/TicketTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const extractTicketsList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.tickets)) return res.data.tickets;
  if (Array.isArray(res?.tickets)) return res.tickets;
  if (Array.isArray(res?.data?.data?.tickets)) return res.data.data.tickets;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const extractTicketObject = (res) => {
  if (!res) return null;
  if (res?.data?.ticket) return res.data.ticket;
  if (res?.ticket) return res.ticket;
  if (res?.data?._id) return res.data;
  if (res?._id) return res;
  return res?.data || res;
};

const isInProgressStatus = (status) =>
  ["pending", "in_progress", "waiting_for_customer"].includes(
    String(status || "").toLowerCase(),
  );

const Support = ({
  tickets: propTickets = null,
  loading: propLoading = false,
  submitting: propSubmitting = false,
  onCreateTicket,
  onViewTicket,
  onCloseTicket,
  onNavigate,
}) => {
  const reduxCtx = useContext(ReactReduxContext);
  const [authUser, setAuthUser] = useState(
    () => reduxCtx?.store?.getState()?.auth?.user || null,
  );

  useEffect(() => {
    const store = reduxCtx?.store;
    if (!store) return undefined;
    setAuthUser(store.getState()?.auth?.user || null);
    return store.subscribe(() => {
      setAuthUser(store.getState()?.auth?.user || null);
    });
  }, [reduxCtx]);

  const [internalTickets, setInternalTickets] = useState([]);
  const [internalLoading, setInternalLoading] = useState(!propTickets?.length);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(propSubmitting);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      setInternalLoading(true);
      setFetchError("");
      const res = await supportService.getMyTickets({ limit: 50 });
      setInternalTickets(extractTicketsList(res));
    } catch (err) {
      console.error("Failed to fetch customer tickets:", err);
      setFetchError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load support tickets.",
      );
      setInternalTickets([]);
    } finally {
      setInternalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (propTickets && propTickets.length > 0) {
      setInternalTickets(propTickets);
      setInternalLoading(false);
    } else {
      loadTickets();
    }
  }, [propTickets?.length, loadTickets]);

  const tickets = propTickets && propTickets.length > 0 ? propTickets : internalTickets;
  const loading = propLoading || internalLoading;

  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const status = String(
        ticket?.status || ticket?.ticketStatus || "open",
      ).toLowerCase();

      const ticketId = ticket?.ticketId || ticket?._id || ticket?.id || "";
      const subject = ticket?.subject || ticket?.title || "";

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_progress"
          ? isInProgressStatus(status)
          : status === statusFilter);

      const matchesSearch =
        !keyword ||
        String(ticketId).toLowerCase().includes(keyword) ||
        String(subject).toLowerCase().includes(keyword) ||
        String(ticket?.category || "")
          .toLowerCase()
          .includes(keyword) ||
        String(ticket?.messages?.[0]?.message || ticket?.message || "")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter(
        (t) =>
          String(t?.status || t?.ticketStatus || "open").toLowerCase() ===
          "open",
      ).length,
      in_progress: tickets.filter((t) =>
        isInProgressStatus(t?.status || t?.ticketStatus),
      ).length,
      resolved: tickets.filter(
        (t) =>
          String(t?.status || t?.ticketStatus || "").toLowerCase() ===
          "resolved",
      ).length,
      closed: tickets.filter(
        (t) =>
          String(t?.status || t?.ticketStatus || "").toLowerCase() === "closed",
      ).length,
    }),
    [tickets],
  );

  const handleViewTicket = async (ticket) => {
    if (onViewTicket) {
      onViewTicket(ticket);
    }
    const id = ticket?._id || ticket?.ticketId || ticket?.id;
    try {
      const res = await supportService.getTicketById(id);
      setSelectedTicket(extractTicketObject(res) || ticket);
    } catch {
      setSelectedTicket(ticket);
    }
  };

  const handleCreateTicket = async (data) => {
    const cleanSubject = String(data?.subject || "").trim();
    const cleanMessage = String(data?.message || "").trim();

    if (!cleanSubject || !cleanMessage) {
      toast.error("Please enter both a subject and message.");
      return;
    }

    const payload = {
      subject: cleanSubject,
      category: String(data?.category || "general").toLowerCase(),
      priority: String(data?.priority || "medium").toLowerCase(),
      message: cleanMessage,
    };

    if (onCreateTicket) {
      onCreateTicket(payload);
      setShowForm(false);
      return;
    }

    try {
      setSubmitting(true);
      await supportService.createTicket(payload);
      toast.success("Support ticket created successfully!");
      setShowForm(false);
      await loadTickets();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create support ticket",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    const id = selectedTicket._id || selectedTicket.ticketId;
    try {
      setReplyLoading(true);
      const res = await supportService.addMessage(id, {
        message: replyMessage.trim(),
      });
      toast.success("Message sent");
      setReplyMessage("");
      setSelectedTicket(extractTicketObject(res) || selectedTicket);
      await loadTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    const id = selectedTicket._id || selectedTicket.ticketId;

    if (onCloseTicket) {
      onCloseTicket(selectedTicket);
      return;
    }

    try {
      setStatusActionLoading(true);
      const res = await supportService.closeTicket(id);
      toast.success("Ticket closed");
      setSelectedTicket(
        extractTicketObject(res) || { ...selectedTicket, status: "closed" },
      );
      await loadTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to close ticket");
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;
    const id = selectedTicket._id || selectedTicket.ticketId;

    try {
      setStatusActionLoading(true);
      const res = await supportService.reopenTicket(id);
      toast.success("Ticket reopened");
      setSelectedTicket(
        extractTicketObject(res) || { ...selectedTicket, status: "open" },
      );
      await loadTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reopen ticket");
    } finally {
      setStatusActionLoading(false);
    }
  };

  if (selectedTicket) {
    const ticketStatus = String(selectedTicket.status || "open").toLowerCase();
    const isClosed = ticketStatus === "closed" || ticketStatus === "resolved";
    const messages = selectedTicket.messages || [];

    return (
      <CustomerWorkspace title="Ticket Details" eyebrow="Customer workspace">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedTicket(null)}
            className="cursor-pointer text-xs font-bold text-[var(--primary)] hover:underline"
          >
            ← Back to all tickets
          </button>

          {!isClosed ? (
            <button
              type="button"
              disabled={statusActionLoading}
              onClick={handleCloseTicket}
              className="cursor-pointer rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-[var(--red)] hover:bg-[#fff0f1] disabled:opacity-50"
            >
              {statusActionLoading ? "Closing..." : "Close Ticket"}
            </button>
          ) : (
            <button
              type="button"
              disabled={statusActionLoading}
              onClick={handleReopenTicket}
              className="btnsm cursor-pointer disabled:opacity-50"
            >
              {statusActionLoading ? "Reopening..." : "↻ Reopen Ticket"}
            </button>
          )}
        </div>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
          <div className="border-b border-[var(--line)] pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-[var(--gold)]">
                  #{selectedTicket.ticketId || String(selectedTicket._id).slice(-6)}
                </span>
                <h1 className="mt-1 text-lg font-black text-[var(--text)] dark:text-foreground">
                  {selectedTicket.subject}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="pill text-xs capitalize">
                  {selectedTicket.category || "General"}
                </span>
                <span className="pill text-xs capitalize">
                  {selectedTicket.priority || "Medium"} priority
                </span>
                <span
                  className={`status-badge text-xs font-bold capitalize ${
                    isClosed ? "green" : "amber"
                  }`}
                >
                  {String(selectedTicket.status || "open").replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {selectedTicket.resolution && isClosed && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
              <strong className="font-bold">Resolution:</strong>{" "}
              {selectedTicket.resolution}
            </div>
          )}

          {/* Conversation history */}
          <div className="my-6 space-y-4">
            {messages.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                No messages in this ticket yet.
              </p>
            ) : (
              messages.map((m, idx) => {
                const senderRole = String(m.sender?.role || "").toLowerCase();
                const isCustomer =
                  !senderRole ||
                  senderRole === "user" ||
                  senderRole === "customer" ||
                  senderRole === "vendor";
                return (
                  <div
                    key={m._id || idx}
                    className={`rounded-2xl p-4 text-xs ${
                      isCustomer
                        ? "ml-4 sm:ml-8 border border-[var(--line)] bg-[var(--soft)]/50"
                        : "mr-4 sm:mr-8 border border-[#f3cbd0] bg-[#fcf9fa]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-bold text-[var(--text)] dark:text-foreground">
                      <span>
                        {isCustomer
                          ? "You"
                          : m.sender?.fullName ||
                            m.sender?.name ||
                            m.sender?.username ||
                            "Support Representative"}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleString("en-IN")
                          : ""}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[var(--text)] dark:text-foreground">
                      {m.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Form */}
          {!isClosed ? (
            <form
              onSubmit={handleSendReply}
              className="mt-6 border-t border-[var(--line)] pt-4"
            >
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Add a reply
              </label>
              <textarea
                rows={3}
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message to support..."
                className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-white p-3 text-xs text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={replyLoading || !replyMessage.trim()}
                  className="primarybtn cursor-pointer !rounded-xl !px-4 !py-2 !text-xs disabled:opacity-50"
                >
                  {replyLoading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-4 text-center text-xs text-[var(--muted)]">
              This ticket is {ticketStatus}. Click <b>Reopen Ticket</b> above or create a new ticket if you need further assistance.
            </div>
          )}
        </section>
      </CustomerWorkspace>
    );
  }

  return (
    <CustomerWorkspace
      title="Support Tickets"
      eyebrow="Customer workspace"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadTickets}
            disabled={loading}
            className="outlinebtn cursor-pointer !px-3 !py-2 !text-xs disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            onClick={() => setShowForm((val) => !val)}
            className="primarybtn cursor-pointer !rounded-xl !px-3.5 !py-2 !text-xs"
          >
            {showForm ? "Close Form" : "+ Create ticket"}
          </button>
        </div>
      }
    >
      {/* Create Ticket Form */}
      {showForm && (
        <section className="mb-8 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-md dark:bg-card dark:border-line">
          <h2 className="text-base font-bold text-[var(--text)] dark:text-foreground">
            Create new support ticket
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Describe your issue and our customer care team will respond shortly.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              handleCreateTicket({
                subject: formData.get("subject"),
                category: formData.get("category"),
                priority: formData.get("priority"),
                message: formData.get("message"),
              });
            }}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Subject *
              </label>
              <input
                name="subject"
                required
                placeholder="What do you need help with?"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Category
                </label>
                <select
                  name="category"
                  defaultValue="general"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                >
                  <option value="general">General Inquiry</option>
                  <option value="order">Order &amp; Tracking</option>
                  <option value="payment">Payment &amp; Refunds</option>
                  <option value="product">Product Details</option>
                  <option value="account">Account &amp; Profile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="medium"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Message *
              </label>
              <textarea
                name="message"
                rows={4}
                required
                placeholder="Describe your issue with order numbers if applicable..."
                className="mt-1.5 w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btnsm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="primarybtn cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit ticket"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Total Tickets
          </span>
          <strong className="mt-1 block text-2xl font-black text-[var(--text)] dark:text-foreground">
            {statusCounts.all}
          </strong>
        </div>

        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Open
          </span>
          <strong className="mt-1 block text-2xl font-black text-[#b7791f]">
            {statusCounts.open}
          </strong>
        </div>

        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            In Progress
          </span>
          <strong className="mt-1 block text-2xl font-black text-[var(--primary)]">
            {statusCounts.in_progress}
          </strong>
        </div>

        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Resolved / Closed
          </span>
          <strong className="mt-1 block text-2xl font-black text-[#16845b]">
            {statusCounts.resolved + statusCounts.closed}
          </strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs dark:bg-card dark:border-line">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card sm:max-w-xs"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All", count: statusCounts.all },
              { key: "open", label: "Open", count: statusCounts.open },
              { key: "in_progress", label: "In Progress", count: statusCounts.in_progress },
              { key: "resolved", label: "Resolved", count: statusCounts.resolved },
              { key: "closed", label: "Closed", count: statusCounts.closed },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--soft)] dark:bg-card"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--soft)] text-[var(--primary)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <Loader />
          </div>
        ) : fetchError ? (
          <div className="p-10 text-center">
            <EmptyState
              title="Unable to load support tickets"
              message={fetchError}
              action={loadTickets}
              actionText="Try Again"
            />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState
              title="No tickets found"
              message={
                search.trim() || statusFilter !== "all"
                  ? "No support tickets match your current filter."
                  : "Have an issue with an order or product? Create a ticket and we'll assist you."
              }
              action={
                !search.trim() && statusFilter === "all"
                  ? () => setShowForm(true)
                  : undefined
              }
              actionText="+ Create Ticket"
            />
          </div>
        ) : (
          <TicketTable
            tickets={filteredTickets}
            fallbackUser={authUser}
            onViewTicket={handleViewTicket}
          />
        )}
      </div>
    </CustomerWorkspace>
  );
};

export default Support;
