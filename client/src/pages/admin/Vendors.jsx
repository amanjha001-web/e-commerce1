import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import VendorTable from "../../components/admin/vendors/VendorTable";
import VendorDetails from "../../components/admin/vendors/VendorDetails";
import VendorStatusToggle from "../../components/admin/vendors/VendorStatusToggle";

const Vendors = ({
  user = null,

  vendors = [],
  totalVendors = 0,
  loading = false,
  saving = false,
  filters = {},

  notificationCount = 0,

  onFilterChange,
  onViewVendor,
  onEditVendor,
  onDeleteVendor,
  onToggleVendorStatus,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                  <button
                    type="button"
                    onClick={() => handleFilterChange("")}
                    disabled={saving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterChange("active")}
                    disabled={saving}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterChange("inactive")}
                    disabled={saving}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Inactive
                  </button>
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
      </div>

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
