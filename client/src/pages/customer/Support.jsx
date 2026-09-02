
import { useMemo, useState } from "react";

import TicketTable from "../../components/admin/support/TicketTable";
import TicketDetails from "../../components/admin/support/TicketDetails";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

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
        ticket?.status ||
          ticket?.ticketStatus ||
          "open"
      ).toLowerCase();

      const ticketId =
        ticket?._id ||
        ticket?.id ||
        ticket?.ticketId ||
        "";

      const subject =
        ticket?.subject ||
        ticket?.title ||
        "";

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const matchesSearch =
        !keyword ||
        String(ticketId)
          .toLowerCase()
          .includes(keyword) ||
        String(subject)
          .toLowerCase()
          .includes(keyword) ||
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
          ticket?.status ||
            ticket?.ticketStatus ||
            "open"
        ).toLowerCase() === "open"
    ).length,
    pending: tickets.filter(
      (ticket) =>
        String(
          ticket?.status ||
            ticket?.ticketStatus ||
            ""
        ).toLowerCase() === "pending"
    ).length,
    resolved: tickets.filter(
      (ticket) =>
        String(
          ticket?.status ||
            ticket?.ticketStatus ||
            ""
        ).toLowerCase() === "resolved"
    ).length,
    closed: tickets.filter(
      (ticket) =>
        String(
          ticket?.status ||
            ticket?.ticketStatus ||
            ""
        ).toLowerCase() === "closed"
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
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setSelectedTicket(null)}
          className="mb-6 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Support
        </button>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <TicketDetails
            ticket={selectedTicket}
            onCloseTicket={onCloseTicket}
            onBack={() => setSelectedTicket(null)}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Help Center
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Customer Support
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Need help? Create a support ticket and track its progress.
          </p>
        </div>

        <Button
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? "Close Form" : "Create Ticket"}
        </Button>
      </div>

      {/* Create Ticket */}
      {showForm && (
        <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">
            Create Support Ticket
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Tell us what went wrong and our support team will help you.
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
            <Input
              name="subject"
              label="Subject"
              placeholder="What do you need help with?"
              required
            />

            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>

              <select
                name="category"
                defaultValue="general"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="general">
                  General
                </option>
                <option value="order">
                  Order
                </option>
                <option value="payment">
                  Payment
                </option>
                <option value="product">
                  Product
                </option>
                <option value="delivery">
                  Delivery
                </option>
                <option value="account">
                  Account
                </option>
                <option value="refund">
                  Refund
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Message
              </label>

              <textarea
                name="message"
                rows={5}
                required
                placeholder="Describe your issue..."
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Total Tickets
          </p>
          <p className="mt-2 text-2xl font-bold">
            {statusCounts.all}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Open
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {statusCounts.open}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Pending
          </p>
          <p className="mt-2 text-2xl font-bold">
            {statusCounts.pending}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Resolved
          </p>
          <p className="mt-2 text-2xl font-bold">
            {statusCounts.resolved}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="w-full md:max-w-md">
            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search tickets..."
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              "all",
              "open",
              "pending",
              "resolved",
              "closed",
            ].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={[
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium capitalize transition",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span>{status}</span>
                <span className="rounded-full bg-background/50 px-2 py-0.5 text-xs">
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tickets */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <Loader />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={
                search || statusFilter !== "all"
                  ? "No matching tickets"
                  : "No support tickets"
              }
              description={
                search || statusFilter !== "all"
                  ? "Try changing your search or status filter."
                  : "You haven't created any support tickets yet."
              }
            />

            {!search && statusFilter === "all" && (
              <div className="mt-5 flex justify-center">
                <Button
                  onClick={() => setShowForm(true)}
                >
                  Create Your First Ticket
                </Button>
              </div>
            )}
          </div>
        ) : (
          <TicketTable
            tickets={filteredTickets}
            onView={handleViewTicket}
            onClose={onCloseTicket}
          />
        )}
      </section>

      <button
        type="button"
        onClick={() => onNavigate?.("/")}
        className="mt-8 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Home
      </button>
    </main>
  );
};

export default Support;
