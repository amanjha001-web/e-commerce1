import { useState } from "react";

import TicketTable from "../../components/admin/support/TicketTable";
import TicketDetails from "../../components/admin/support/TicketDetails";
import TicketStatus from "../../components/admin/support/TicketStatus";

const Support = ({
  tickets = [],
  totalTickets = 0,
  loading = false,
  saving = false,
  filters = {},

  onFilterChange,
  onViewTicket,
  onUpdateTicketStatus,
  onDeleteTicket,
}) => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusTicket, setStatusTicket] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setDetailsOpen(true);

    onViewTicket?.(ticket);
  };

  const handleCloseDetails = () => {
    if (loading) return;

    setDetailsOpen(false);
    setSelectedTicket(null);
  };

  const handleStatusClick = (ticket) => {
    setStatusTicket(ticket);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (saving) return;

    setStatusOpen(false);
    setStatusTicket(null);
  };

  const handleUpdateStatus = async (ticket, status) => {
    if (!onUpdateTicketStatus || saving) return;

    await onUpdateTicketStatus(ticket, status);

    setStatusOpen(false);
    setStatusTicket(null);
  };

  const handleDeleteTicket = async (ticket) => {
    if (!onDeleteTicket || saving) return;

    await onDeleteTicket(ticket);
  };

  const handleFilterChange = (status) => {
    onFilterChange?.({
      ...filters,
      status,
    });
  };

  const filterOptions = [
    { label: "All", value: "" },
    { label: "Open", value: "open" },
    { label: "Pending", value: "pending" },
    { label: "Resolved", value: "resolved" },
    { label: "Closed", value: "closed" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Support
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage customer support tickets and their status.
            </p>
          </div>

          {/* Filters */}
          {onFilterChange && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              {filterOptions.map((item) => {
                const isActive = (filters?.status || "") === item.value;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleFilterChange(item.value)}
                    disabled={saving}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Ticket Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Total Tickets</p>

            <p className="text-2xl font-semibold">
              {totalTickets || tickets.length}
            </p>
          </div>

          {/* Ticket Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <TicketTable
              tickets={tickets}
              loading={loading}
              onView={handleViewTicket}
              onStatusChange={handleStatusClick}
              onDelete={handleDeleteTicket}
            />
          </div>
        </div>
      </main>

      {/* Ticket Details */}
      {detailsOpen && selectedTicket && (
        <TicketDetails
          key={selectedTicket?._id || selectedTicket?.id || "ticket-details"}
          ticket={selectedTicket}
          open={detailsOpen}
          loading={loading}
          onClose={handleCloseDetails}
          onStatusChange={handleStatusClick}
        />
      )}

      {/* Ticket Status */}
      {statusOpen && statusTicket && (
        <TicketStatus
          key={statusTicket?._id || statusTicket?.id || "ticket-status"}
          ticket={statusTicket}
          open={statusOpen}
          loading={saving}
          onClose={handleCloseStatus}
          onConfirm={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default Support;
