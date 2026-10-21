import { useState } from "react";

import VendorRequestTable from "../../components/admin/vendors/VendorRequestTable";
import VendorRequestDetails from "../../components/admin/vendors/VendorRequestDetails";

const VendorRequests = ({
  requests = [],
  selectedRequest: reduxSelectedRequest = null,
  totalRequests = 0,
  pagination = {},
  loading = false,
  detailsLoading = false,
  saving = false,
  filters = {},

  onFilterChange,
  onViewRequest,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,
  onCloseDetails,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [localSelectedRequest, setLocalSelectedRequest] = useState(null);

  // Prefer the detailed request fetched from Redux.
  const selectedRequest = reduxSelectedRequest || localSelectedRequest;

  const handleViewRequest = (request) => {
    setLocalSelectedRequest(request);
    setDetailsOpen(true);
    onViewRequest?.(request);
  };

  const handleCloseDetails = () => {
    if (saving) return;

    setDetailsOpen(false);
    setLocalSelectedRequest(null);
    onCloseDetails?.();
  };

  const handleApprove = async (request) => {
    if (!onApproveRequest || saving) return;

    await onApproveRequest(request);
  };

  const handleReject = async (request, reason = "") => {
    if (!onRejectRequest || saving) return;

    await onRejectRequest(request, reason);
  };

  const handleDelete = async (request) => {
    if (!onDeleteRequest || saving) return;

    await onDeleteRequest(request);
  };

  const handleFilterChange = (status) => {
    onFilterChange?.({
      ...filters,
      status,
      page: 1,
    });
  };

  const filterOptions = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "" },
  ];

  const displayedTotal = totalRequests || pagination?.total || requests.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
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
            </div>
          )}

          {/* Request Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Total Requests</p>

            <p className="text-2xl font-semibold">{displayedTotal}</p>
          </div>

          {/* Requests Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <VendorRequestTable
              requests={requests}
              loading={loading}
              saving={saving}
              onView={handleViewRequest}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination summary */}
          {pagination?.totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                Page {pagination.page || filters.page || 1} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    saving ||
                    loading ||
                    !(
                      pagination.hasPrevPage ??
                      Number(pagination.page || filters.page || 1) > 1
                    )
                  }
                  onClick={() =>
                    onFilterChange?.({
                      ...filters,
                      page: Number(pagination.page || filters.page || 1) - 1,
                    })
                  }
                  className="rounded-lg border border-border px-3 py-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    loading ||
                    !(
                      pagination.hasNextPage ??
                      Number(pagination.page || filters.page || 1) <
                        pagination.totalPages
                    )
                  }
                  onClick={() =>
                    onFilterChange?.({
                      ...filters,
                      page: Number(pagination.page || filters.page || 1) + 1,
                    })
                  }
                  className="rounded-lg border border-border px-3 py-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Request Details */}
      {detailsOpen && (
        <VendorRequestDetails
          key={selectedRequest?._id || "vendor-request-details"}
          request={selectedRequest}
          open={detailsOpen}
          loading={detailsLoading}
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
