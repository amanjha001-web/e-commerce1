import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import supportService from "../../services/support.service";

import TicketTable from "../../components/admin/support/TicketTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const Support = ({
  tickets: propTickets = null,
  loading: propLoading = false,
  submitting: propSubmitting = false,
  onCreateTicket,
  onViewTicket,
  onCloseTicket,
  onNavigate,
}) => {
  const [internalTickets, setInternalTickets] = useState([]);
  const [internalLoading, setInternalLoading] = useState(!propTickets?.length);
  const [submitting, setSubmitting] = useState(propSubmitting);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadTickets = async () => {
    try {
      setInternalLoading(true);
      const res = await supportService.getMyTickets();
      const list = res?.data?.tickets || res?.data || res?.tickets || [];
      setInternalTickets(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch customer tickets:", err);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (propTickets && propTickets.length > 0) {
      setInternalTickets(propTickets);
    } else {
      loadTickets();
    }
  }, [propTickets]);

  const tickets = propTickets && propTickets.length > 0 ? propTickets : internalTickets;
  const loading = propLoading || internalLoading;

  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const status = String(
        ticket?.status || ticket?.ticketStatus || "open",
      ).toLowerCase();

      const ticketId = ticket?._id || ticket?.id || ticket?.ticketId || "";
      const subject = ticket?.subject || ticket?.title || "";

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesSearch =
        !keyword ||
        String(ticketId).toLowerCase().includes(keyword) ||
        String(subject).toLowerCase().includes(keyword) ||
        String(ticket?.message || "")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(
      (ticket) =>
        String(
          ticket?.status || ticket?.ticketStatus || "open",
        ).toLowerCase() === "open",
    ).length,
    pending: tickets.filter(
      (ticket) =>
        String(ticket?.status || ticket?.ticketStatus || "").toLowerCase() ===
        "pending",
    ).length,
    resolved: tickets.filter(
      (ticket) =>
        String(ticket?.status || ticket?.ticketStatus || "").toLowerCase() ===
        "resolved",
    ).length,
    closed: tickets.filter(
      (ticket) =>
        String(ticket?.status || ticket?.ticketStatus || "").toLowerCase() ===
        "closed",
    ).length,
  };

  const handleViewTicket = async (ticket) => {
    if (onViewTicket) {
      onViewTicket(ticket);
    }
    const id = ticket?._id || ticket?.ticketId || ticket?.id;
    try {
      const res = await supportService.getTicketById(id);
      setSelectedTicket(res?.data?.ticket || res?.data || res || ticket);
    } catch {
      setSelectedTicket(ticket);
    }
  };

  const handleCreateTicket = async (data) => {
    if (onCreateTicket) {
      onCreateTicket(data);
      setShowForm(false);
      return;
    }

    try {
      setSubmitting(true);
      await supportService.createTicket(data);
      toast.success("Support ticket created successfully!");
      setShowForm(false);
      await loadTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create support ticket");
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
      const res = await supportService.addMessage(id, { message: replyMessage.trim() });
      toast.success("Message sent");
      setReplyMessage("");
      const updated = res?.data?.ticket || res?.data || res;
      setSelectedTicket(updated);
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
      await supportService.closeTicket(id);
      toast.success("Ticket closed");
      setSelectedTicket((prev) => (prev ? { ...prev, status: "closed" } : prev));
      await loadTickets();
    } catch (err) {
      toast.error("Failed to close ticket");
    }
  };

  if (selectedTicket) {
    const isClosed = selectedTicket.status === "closed" || selectedTicket.status === "resolved";
    const messages = selectedTicket.messages || [];

    return (
      <CustomerWorkspace title="Ticket Details" eyebrow="Customer workspace">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedTicket(null)}
            className="text-xs font-bold text-[var(--primary)] hover:underline"
          >
            ← Back to all tickets
          </button>

          {!isClosed && (
            <button
              type="button"
              onClick={handleCloseTicket}
              className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-[var(--red)] hover:bg-[#fff0f1]"
            >
              Close Ticket
            </button>
          )}
        </div>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
          <div className="border-b border-[var(--line)] pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--gold)]">
                  #{selectedTicket.ticketId || String(selectedTicket._id).slice(-6)}
                </span>
                <h1 className="mt-1 text-lg font-black text-[var(--text)] dark:text-foreground">
                  {selectedTicket.subject}
                </h1>
              </div>

              <div className="flex gap-2">
                <span className="pill text-xs capitalize">
                  {selectedTicket.category || "General"}
                </span>
                <span
                  className={`status-badge text-xs font-bold capitalize ${
                    isClosed ? "green" : "amber"
                  }`}
                >
                  {selectedTicket.status || "Open"}
                </span>
              </div>
            </div>
          </div>

          {/* Conversation history */}
          <div className="my-6 space-y-4">
            {messages.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No messages in this ticket yet.</p>
            ) : (
              messages.map((m, idx) => {
                const isCustomer = !m.sender?.role || m.sender?.role === "user" || m.sender?.role === "customer";
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 text-xs ${
                      isCustomer
                        ? "ml-6 bg-[var(--soft)]/50 border border-[var(--line)]"
                        : "mr-6 bg-[#fcf9fa] border border-[#f3cbd0]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[var(--text)] dark:text-foreground">
                      <span>{isCustomer ? "You" : m.sender?.name || "Support Representative"}</span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN") : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text)] dark:text-foreground whitespace-pre-wrap">
                      {m.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Form */}
          {!isClosed ? (
            <form onSubmit={handleSendReply} className="mt-6 border-t border-[var(--line)] pt-4">
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
                  className="primarybtn !py-2 !px-4 !text-xs !rounded-xl"
                >
                  {replyLoading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-4 text-center text-xs text-[var(--muted)]">
              This ticket is closed. If you need further assistance, please open a new ticket.
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
        <button
          type="button"
          onClick={() => setShowForm((val) => !val)}
          className="primarybtn !py-2 !px-3.5 !text-xs !rounded-xl"
        >
          {showForm ? "Close Form" : "+ Create ticket"}
        </button>
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
                message: formData.get("message"),
              });
            }}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Subject
              </label>
              <input
                name="subject"
                required
                placeholder="What do you need help with?"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
            </div>

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
                <option value="order">Order & Tracking</option>
                <option value="payment">Payment & Refunds</option>
                <option value="product">Product Details</option>
                <option value="account">Account & Profile</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Message
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
                className="btnsm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="primarybtn"
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
            Pending
          </span>
          <strong className="mt-1 block text-2xl font-black text-[var(--primary)]">
            {statusCounts.pending}
          </strong>
        </div>

        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Resolved
          </span>
          <strong className="mt-1 block text-2xl font-black text-[#16845b]">
            {statusCounts.resolved}
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
            className="w-full sm:max-w-xs rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
          />

          <div className="flex gap-2">
            {["all", "open", "pending", "resolved"].map((tab) => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--soft)] dark:bg-card"
                  }`}
                >
                  {tab}
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
        ) : filteredTickets.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState
              title="No tickets found"
              message="Have an issue with an order or product? Create a ticket and we'll assist you."
              action={() => setShowForm(true)}
              actionText="+ Create Ticket"
            />
          </div>
        ) : (
          <TicketTable
            tickets={filteredTickets}
            onViewTicket={handleViewTicket}
          />
        )}
      </div>
    </CustomerWorkspace>
  );
};

export default Support;
