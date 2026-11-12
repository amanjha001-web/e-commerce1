import { useMemo, useState } from "react";

import TicketTable from "../../components/admin/support/TicketTable";
import TicketDetails from "../../components/admin/support/TicketDetails";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const Support = ({
  tickets = [],
  loading = false,
  submitting = false,
  onCreateTicket,
  onViewTicket,
  onCloseTicket,
  onNavigate,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    onViewTicket?.(ticket);
  };

  const handleCreateTicket = (data) => {
    onCreateTicket?.(data);
    setShowForm(false);
  };

  if (selectedTicket) {
    return (
      <CustomerWorkspace title="Ticket Details" eyebrow="Customer workspace">
        <button
          type="button"
          onClick={() => setSelectedTicket(null)}
          className="mb-4 text-xs font-bold text-[var(--primary)] hover:underline"
        >
          ← Back to all tickets
        </button>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
          <TicketDetails
            ticket={selectedTicket}
            onCloseTicket={onCloseTicket}
          />
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
                <option value="delivery">Delivery Delay</option>
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
