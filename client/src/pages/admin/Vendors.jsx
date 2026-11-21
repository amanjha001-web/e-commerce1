import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import VendorDetails from "../../components/admin/vendors/VendorDetails";
import VendorStatusToggle from "../../components/admin/vendors/VendorStatusToggle";
import AdminPagination from "../../components/admin/AdminPagination";

import {
  fetchAdminVendors,
  fetchAdminVendorById,
  updateAdminVendor,
  deleteAdminVendor,
  toggleAdminVendorStatus,
  approveAdminVendor,
  rejectAdminVendor,
  setAdminVendorsPage,
  setAdminVendorsLimit,
  setSelectedVendor,
  clearSelectedVendor,
  clearAdminVendorsError,
} from "../../store/slices/Admin/adminVendorsSlice";

const formatStatusLabel = (value) =>
  String(value || "Pending")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const getStatusClass = (s) => {
  const normalized = String(s || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "active") return "green";
  if (normalized === "pending" || normalized === "under review") return "amber";
  if (
    normalized === "suspended" ||
    normalized === "rejected" ||
    normalized === "inactive" ||
    normalized === "blocked"
  ) {
    return "red";
  }
  return "";
};

const Vendors = () => {
  const dispatch = useDispatch();

  const {
    vendors = [],
    summary = null,
    pagination = {},
    selectedVendor = null,
    loading = false,
    detailsLoading = false,
    saving = false,
    deleting = false,
    error = null,
  } = useSelector((state) => state.adminVendors || {});

  const { page = 1, limit = 10, total = 0, totalPages = 0 } = pagination;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [initialEdit, setInitialEdit] = useState(false);
  const [statusVendor, setStatusVendor] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const loadVendors = (overrides = {}) => {
    const params = {
      page,
      limit,
      ...overrides,
    };
    const q = (overrides.search !== undefined ? overrides.search : search).trim();
    const st = overrides.status !== undefined ? overrides.status : statusFilter;

    if (q) params.search = q;
    if (st && st !== "all") params.status = st;

    dispatch(fetchAdminVendors(params));
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        const params = { page, limit };
        if (search.trim()) params.search = search.trim();
        if (statusFilter !== "all") params.status = statusFilter;
        dispatch(fetchAdminVendors(params));
      },
      search ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [dispatch, page, limit, search, statusFilter]);

  const normalizedVendors = useMemo(() => {
    return (Array.isArray(vendors) ? vendors : []).map((v, i) => {
      const code =
        v.vendorCode ||
        (v._id ? `V-${String(v._id).slice(-4).toUpperCase()}` : `V-${101 + i}`);
      const shop = v.shopName || v.storeName || v.businessName || "Shop";
      const owner =
        v.ownerName ||
        v.user?.fullName ||
        v.user?.name ||
        v.userId?.fullName ||
        v.userId?.name ||
        "";
      const email =
        v.email || v.user?.email || v.userId?.email || "—";
      const products = v.productCount ?? v.productsCount ?? 0;
      const orders = v.orderCount ?? v.ordersCount ?? 0;
      const isActive = v.isActive !== false;

      let rawStatus = v.displayStatus || v.status || (isActive ? "active" : "inactive");
      if (!isActive && String(v.status).toLowerCase() === "approved") {
        rawStatus = "suspended";
      } else if (!isActive && String(v.status).toLowerCase() === "pending") {
        rawStatus = "inactive";
      }

      const verification =
        v.userVerificationStatus ||
        (!v.user && !v.userId
          ? "unlinked"
          : v.user?.isActive === false || v.userId?.isActive === false
            ? "blocked"
            : (v.isUserVerified ?? v.user?.isEmailVerified ?? v.userId?.isEmailVerified)
              ? "verified"
              : "unverified");

      return {
        ...v,
        _displayCode: code,
        _displayShop: shop,
        _displayOwner: owner,
        _displayEmail: email,
        _displayProducts: products,
        _displayOrders: orders,
        _displayStatus: formatStatusLabel(rawStatus),
        _verificationStatus: verification,
      };
    });
  }, [vendors]);

  const handleViewVendor = async (vendor) => {
    if (!vendor?._id) return;
    dispatch(setSelectedVendor(vendor));
    setInitialEdit(false);
    setDetailsOpen(true);

    try {
      await dispatch(fetchAdminVendorById(vendor._id)).unwrap();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to load vendor details");
    }
  };

  const handleManageVendor = (vendor) => {
    if (!vendor?._id) return;
    setStatusVendor(vendor);
    setStatusOpen(true);
  };

  const handleUpdateVendor = async (vendorId, vendorData) => {
    try {
      await dispatch(updateAdminVendor({ vendorId, vendorData })).unwrap();
      toast.success("Vendor details updated");
      setInitialEdit(false);
      loadVendors();
      return true;
    } catch (err) {
      const msg = typeof err === "string" ? err : "Failed to update vendor";
      toast.error(msg);
      return msg;
    }
  };

  const isMutating = saving || deleting;

  const handleCloseDetails = () => {
    if (isMutating) return;
    setDetailsOpen(false);
    setInitialEdit(false);
    dispatch(clearSelectedVendor());
  };

  const handleDeleteVendor = async (vendor) => {
    const vendorId = vendor?._id || vendor?.id;
    if (!vendorId || isMutating) return;

    try {
      await dispatch(deleteAdminVendor(vendorId)).unwrap();
      toast.success("Vendor store deleted");
      setDetailsOpen(false);
      setInitialEdit(false);
      dispatch(clearSelectedVendor());
      if (statusVendor?._id === vendorId || statusVendor?.id === vendorId) {
        setStatusOpen(false);
        setStatusVendor(null);
      }
      if (page > 1 && normalizedVendors.length <= 1) {
        dispatch(setAdminVendorsPage(page - 1));
      } else {
        loadVendors();
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to delete vendor");
    }
  };

  const handleToggleStatus = async (vendor, payloadOrBool) => {
    const vendorId = vendor?._id || vendor?.id;
    if (!vendorId || saving) return;

    const payload =
      typeof payloadOrBool === "object" && payloadOrBool !== null
        ? payloadOrBool
        : { isActive: Boolean(payloadOrBool) };

    try {
      await dispatch(
        toggleAdminVendorStatus({
          vendorId,
          ...payload,
        }),
      ).unwrap();
      toast.success("Vendor updated successfully");
      setStatusOpen(false);
      setStatusVendor(null);
      loadVendors();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update vendor status");
    }
  };

  const handleApproveVendor = async (vendor) => {
    const vendorId = vendor?._id || vendor?.id;
    if (!vendorId || saving) return;

    try {
      await dispatch(approveAdminVendor(vendorId)).unwrap();
      toast.success("Vendor approved");
      loadVendors();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to approve vendor");
    }
  };

  const handleRejectVendor = async (vendor, reason) => {
    const vendorId = vendor?._id || vendor?.id;
    if (!vendorId || saving) return;

    try {
      await dispatch(
        rejectAdminVendor({
          vendorId,
          reason:
            (reason && String(reason).trim()) ||
            "Application did not meet verification requirements.",
        }),
      ).unwrap();
      toast.success("Vendor application rejected");
      loadVendors();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to reject vendor");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    dispatch(setAdminVendorsPage(1));
  };

  const statTotal = summary?.total ?? total ?? normalizedVendors.length;
  const statApproved =
    summary?.approved ??
    normalizedVendors.filter((v) => v._displayStatus.toLowerCase() === "approved").length;
  const statPending =
    summary?.pending ??
    normalizedVendors.filter((v) =>
      ["pending", "under review"].includes(v._displayStatus.toLowerCase()),
    ).length;
  const statRestricted =
    summary !== null && summary !== undefined
      ? (summary.suspended || 0) + (summary.rejected || 0)
      : normalizedVendors.filter((v) =>
          ["suspended", "rejected", "inactive"].includes(v._displayStatus.toLowerCase()),
        ).length;

  return (
    <div className="space-y-6">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Vendors</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Total vendors", statTotal],
          ["Approved", statApproved],
          ["Pending review", statPending],
          ["Suspended / Rejected", statRestricted],
        ].map(([label, val]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs"
          >
            <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[var(--text)]">{val}</p>
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-semibold text-[#bd3345]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => dispatch(clearAdminVendorsError())}
            className="cursor-pointer text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search store, owner, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page !== 1) dispatch(setAdminVendorsPage(1));
            }}
          />

          <select
            className="field"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (page !== 1) dispatch(setAdminVendorsPage(1));
            }}
          >
            <option value="all">All status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>

          {(search || statusFilter !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="outlinebtn"
            >
              Reset
            </button>
          )}
        </div>

        <div id="vendorTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Shop</th>
                <th>Email</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && normalizedVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading vendors...
                  </td>
                </tr>
              ) : normalizedVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    No vendors match the selected filters.
                  </td>
                </tr>
              ) : (
                normalizedVendors.map((v, i) => (
                  <tr key={v._id || v.id || i}>
                    <td>
                      <div className="font-bold text-[var(--text)]">
                        {v._displayShop}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                        <span>
                          {v._displayCode}
                          {v._displayOwner ? ` · ${v._displayOwner}` : ""}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            v._verificationStatus === "verified"
                              ? "bg-[#e7f6ef] text-[#16845b]"
                              : v._verificationStatus === "unverified"
                                ? "bg-[#fff4df] text-[#9b6814]"
                                : "bg-[#ffeaec] text-[#bd3345]"
                          }`}
                        >
                          {v._verificationStatus === "verified"
                            ? "✓ Verified"
                            : v._verificationStatus === "unverified"
                              ? "Unverified"
                              : v._verificationStatus === "blocked"
                                ? "Blocked User"
                                : "No User"}
                        </span>
                      </div>
                    </td>
                    <td>{v._displayEmail}</td>
                    <td>{v._displayProducts}</td>
                    <td>{v._displayOrders}</td>
                    <td>
                      <span
                        className={`status ${getStatusClass(v._displayStatus)}`}
                      >
                        {v._displayStatus}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btnsm"
                          onClick={() => handleViewVendor(v)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btnsm"
                          onClick={() => handleManageVendor(v)}
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          itemLabel="vendors"
          loading={loading}
          onPageChange={(nextPage) => dispatch(setAdminVendorsPage(nextPage))}
          onPageSizeChange={(nextLimit) =>
            dispatch(setAdminVendorsLimit(nextLimit))
          }
        />
      </div>

      {detailsOpen && selectedVendor && (
        <VendorDetails
          key={selectedVendor._id || selectedVendor.id}
          vendor={selectedVendor}
          open={detailsOpen}
          loading={detailsLoading}
          saving={saving}
          deleting={deleting}
          initialEdit={initialEdit}
          onClose={handleCloseDetails}
          onUpdate={handleUpdateVendor}
          onDelete={handleDeleteVendor}
          onApprove={handleApproveVendor}
          onReject={handleRejectVendor}
          onReopen={(v) =>
            handleToggleStatus(v, {
              status: "pending",
              isActive: false,
              rejectionReason: "",
            })
          }
          onStatusChange={(v) => {
            setStatusVendor(v);
            setStatusOpen(true);
          }}
        />
      )}

      {statusOpen && statusVendor && (
        <VendorStatusToggle
          key={statusVendor._id || statusVendor.id}
          vendor={statusVendor}
          open={statusOpen}
          loading={saving}
          onClose={() => {
            setStatusOpen(false);
            setStatusVendor(null);
          }}
          onConfirm={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Vendors;
