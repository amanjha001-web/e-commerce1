import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import VendorRequestTable from "../../components/admin/vendors/VendorRequestTable";
import VendorRequestDetails from "../../components/admin/vendors/VendorRequestDetails";

const VendorRequests = ({
  user = null,

  requests = [],
  totalRequests = 0,
  loading = false,
  saving = false,
  filters = {},

  notificationCount = 0,

  onFilterChange,
  onViewRequest,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setDetailsOpen(true);

    onViewRequest?.(request);
  };

  const handleCloseDetails = () => {
    if (saving) return;

    setDetailsOpen(false);
    setSelectedRequest(null);
  };

  const handleApprove = async (request) => {
    if (!onApproveRequest || saving) return;

    await onApproveRequest(request);
  };

  const handleReject = async (request) => {
    if (!onRejectRequest || saving) return;

    await onRejectRequest(request);
  };

  const handleDelete = async (request) => {
    if (!onDeleteRequest || saving) return;

    await onDeleteRequest(request);
  };

  const handleFilterChange = (status) => {
    onFilterChange?.({
      ...filters,
      status,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader
        user={user}
        notificationCount={notificationCount}
        onMenuClick={() => setSidebarOpen(true)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Vendor Requests
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Review and manage vendor registration requests.
              </p>
            </div>

            {/* Filters */}
            {onFilterChange && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleFilterChange("pending")}
                    disabled={saving}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Pending
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterChange("approved")}
                    disabled={saving}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approved
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterChange("rejected")}
                    disabled={saving}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Rejected
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterChange("")}
                    disabled={saving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    All
                  </button>
                </div>
              </div>
            )}

            {/* Request Count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Total Requests</p>

              <p className="text-2xl font-semibold">
                {totalRequests || requests.length}
              </p>
            </div>

            {/* Requests Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <VendorRequestTable
                requests={requests}
                loading={loading}
                onView={handleViewRequest}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Request Details */}
      {detailsOpen && selectedRequest && (
        <VendorRequestDetails
          key={
            selectedRequest?._id ||
            selectedRequest?.id ||
            "vendor-request-details"
          }
          request={selectedRequest}
          open={detailsOpen}
          loading={loading}
          saving={saving}
          onClose={handleCloseDetails}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default VendorRequests;
