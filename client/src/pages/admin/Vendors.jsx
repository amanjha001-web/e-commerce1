import { useState } from "react";

import VendorTable from "../../components/admin/vendors/VendorTable";
import VendorDetails from "../../components/admin/vendors/VendorDetails";
import VendorStatusToggle from "../../components/admin/vendors/VendorStatusToggle";

const Vendors = ({
  vendors = [],
  totalVendors = 0,
  loading = false,
  saving = false,
  filters = {},

  onFilterChange,
  onViewVendor,
  onEditVendor,
  onDeleteVendor,
  onToggleVendorStatus,
}) => {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusVendor, setStatusVendor] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setDetailsOpen(true);

    onViewVendor?.(vendor);
  };

  const handleCloseDetails = () => {
    if (loading) return;

    setDetailsOpen(false);
    setSelectedVendor(null);
  };

  const handleEditVendor = (vendor) => {
    onEditVendor?.(vendor);
  };

  const handleDeleteVendor = async (vendor) => {
    if (!onDeleteVendor || saving) return;

    await onDeleteVendor(vendor);
  };

  const handleStatusClick = (vendor) => {
    setStatusVendor(vendor);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (saving) return;

    setStatusOpen(false);
    setStatusVendor(null);
  };

  const handleToggleStatus = async (vendor, status) => {
    if (!onToggleVendorStatus || saving) return;

    await onToggleVendorStatus(vendor, status);

    setStatusOpen(false);
    setStatusVendor(null);
  };

  const handleFilterChange = (status) => {
    onFilterChange?.({
      ...filters,
      status,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vendors
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage registered vendors, store information and account status.
            </p>
          </div>

          {/* Filters */}
          {onFilterChange && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                {[
                  { label: "All", value: "" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ].map((item) => {
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

          {/* Vendor Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Total Vendors</p>

            <p className="text-2xl font-semibold">
              {totalVendors || vendors.length}
            </p>
          </div>

          {/* Vendor Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <VendorTable
              vendors={vendors}
              loading={loading}
              onView={handleViewVendor}
              onEdit={handleEditVendor}
              onDelete={handleDeleteVendor}
              onToggleStatus={handleStatusClick}
            />
          </div>
        </div>
      </main>

      {/* Vendor Details */}
      {detailsOpen && selectedVendor && (
        <VendorDetails
          key={selectedVendor?._id || selectedVendor?.id || "vendor-details"}
          vendor={selectedVendor}
          open={detailsOpen}
          loading={loading}
          onClose={handleCloseDetails}
          onEdit={handleEditVendor}
          onToggleStatus={handleStatusClick}
        />
      )}

      {/* Vendor Status */}
      {statusOpen && statusVendor && (
        <VendorStatusToggle
          key={statusVendor?._id || statusVendor?.id || "vendor-status"}
          vendor={statusVendor}
          open={statusOpen}
          loading={saving}
          onClose={handleCloseStatus}
          onConfirm={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Vendors;
