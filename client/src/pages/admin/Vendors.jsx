
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import VendorTable from "../../components/admin/vendors/VendorTable";
import VendorDetails from "../../components/admin/vendors/VendorDetails";
import VendorStatusToggle from "../../components/admin/vendors/VendorStatusToggle";

import {
  fetchAdminVendors,
  fetchAdminVendorById,
  updateAdminVendor,
  deleteAdminVendor,
  toggleAdminVendorStatus,
  setVendorFilters,
  setSelectedVendor,
  clearSelectedVendor,
} from "../../store/slices/Admin/adminVendorsSlice";

const Vendors = () => {
  const dispatch = useDispatch();

  const {
    vendors = [],
    selectedVendor = null,
    filters = { status: "", search: "" },
    loading = false,
    detailsLoading = false,
    saving = false,
    deleting = false,
    error = null,
  } = useSelector((state) => state.adminVendors);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [initialEdit, setInitialEdit] = useState(false);

  const [statusVendor, setStatusVendor] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminVendors());
  }, [dispatch]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const status = filters?.status || "";

      if (status === "active" && !vendor.isActive) return false;
      if (status === "inactive" && vendor.isActive) return false;

      const search = (filters?.search || "").trim().toLowerCase();

      if (search) {
        const searchableText = [
          vendor.shopName,
          vendor.shopSlug,
          vendor.email,
          vendor.phone,
          vendor.user?.fullName,
          vendor.user?.username,
          vendor.user?.email,
          vendor.address?.city,
          vendor.address?.state,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(search)) return false;
      }

      return true;
    });
  }, [vendors, filters]);

  const handleFilterChange = (status) => {
    dispatch(setVendorFilters({ status }));
  };

  const handleSearchChange = (event) => {
    dispatch(setVendorFilters({ search: event.target.value }));
  };

  const handleOpenVendor = async (vendor, edit = false) => {
    const vendorId = vendor?._id || vendor?.id;

    if (!vendorId) {
      console.error("Vendor ID missing:", vendor);
      return;
    }

    dispatch(setSelectedVendor(vendor));
    setInitialEdit(edit);
    setDetailsOpen(true);

    try {
      const result = await dispatch(fetchAdminVendorById(vendorId));

      if (fetchAdminVendorById.rejected.match(result)) {
        console.error(
          "Failed to fetch vendor details:",
          result.payload || result.error,
        );
      }
    } catch (error) {
      console.error("Vendor details error:", error);
    }
  };

  const handleViewVendor = (vendor) => {
    return handleOpenVendor(vendor, false);
  };

  const handleEditVendor = (vendor) => {
    return handleOpenVendor(vendor, true);
  };

  const handleUpdateVendor = async (vendorId, vendorData) => {
    try {
      await dispatch(
        updateAdminVendor({ vendorId, vendorData }),
      ).unwrap();

      setInitialEdit(false);
      return true;
    } catch (error) {
      console.error("Failed to update vendor:", error);
      return false;
    }
  };

  const handleCloseDetails = () => {
    if (detailsLoading || saving) return;

    setDetailsOpen(false);
    setInitialEdit(false);
    dispatch(clearSelectedVendor());
  };

  const handleDeleteVendor = async (vendor) => {
    const vendorId = vendor?._id || vendor?.id;

    if (!vendorId || deleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        vendor.shopName || "this vendor"
      }"?`,
    );

    if (!confirmed) return;

    const result = await dispatch(deleteAdminVendor(vendorId));

    if (deleteAdminVendor.fulfilled.match(result)) {
      if (
        (selectedVendor?._id || selectedVendor?.id) === vendorId
      ) {
        setDetailsOpen(false);
        setInitialEdit(false);
        dispatch(clearSelectedVendor());
      }

      if (
        (statusVendor?._id || statusVendor?.id) === vendorId
      ) {
        setStatusOpen(false);
        setStatusVendor(null);
      }
    }
  };

  const handleStatusClick = (vendor) => {
    if (!vendor?._id && !vendor?.id) return;

    setStatusVendor(vendor);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (saving) return;

    setStatusOpen(false);
    setStatusVendor(null);
  };

  const handleToggleStatus = async (vendor, status) => {
    const vendorId = vendor?._id || vendor?.id;

    if (!vendorId || saving) return;

    const isActive =
      typeof status === "boolean"
        ? status
        : typeof status?.isActive === "boolean"
          ? status.isActive
          : typeof status?.active === "boolean"
            ? status.active
            : undefined;

    if (typeof isActive !== "boolean") {
      console.error(
        "VendorStatusToggle must pass the target boolean status to onConfirm.",
      );
      return;
    }

    const result = await dispatch(
      toggleAdminVendorStatus({
        vendorId,
        isActive,
      }),
    );

    if (toggleAdminVendorStatus.fulfilled.match(result)) {
      setStatusOpen(false);
      setStatusVendor(null);
      dispatch(fetchAdminVendors());
    }
  };

  const handleRefresh = () => {
    dispatch(fetchAdminVendors());
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Vendors
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage registered vendors, store information and account status.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="font-semibold underline disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "All", value: "" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ].map((item) => {
                  const isActive =
                    (filters?.status || "") === item.value;

                  return (
                    <button
                      key={item.value || "all"}
                      type="button"
                      onClick={() => handleFilterChange(item.value)}
                      disabled={saving}
                      aria-pressed={isActive}
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

              <div className="w-full sm:max-w-xs">
                <input
                  type="search"
                  value={filters?.search || ""}
                  onChange={handleSearchChange}
                  placeholder="Search vendors..."
                  aria-label="Search vendors"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {filters?.status
                  ? `${filters.status[0].toUpperCase()}${filters.status.slice(1)} Vendors`
                  : "Total Vendors"}
              </p>

              <p className="text-2xl font-semibold">
                {filteredVendors.length}
              </p>
            </div>

            {filters?.search && (
              <button
                type="button"
                onClick={() =>
                  dispatch(setVendorFilters({ search: "" }))
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <VendorTable
              vendors={filteredVendors}
              loading={loading}
              onViewVendor={handleViewVendor}
              onEditVendor={handleEditVendor}
              onDeleteVendor={handleDeleteVendor}
              onToggleStatus={handleStatusClick}
            />
          </div>
        </div>
      </main>

      {detailsOpen && selectedVendor && (
        <VendorDetails
          key={selectedVendor._id || selectedVendor.id}
          vendor={selectedVendor}
          open={detailsOpen}
          loading={detailsLoading}
          saving={saving}
          initialEdit={initialEdit}
          onClose={handleCloseDetails}
          onUpdate={handleUpdateVendor}
          onStatusChange={handleStatusClick}
        />
      )}

      {statusOpen && statusVendor && (
        <VendorStatusToggle
          key={statusVendor._id || statusVendor.id}
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
