import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AdminPagination from "../../components/admin/AdminPagination";

const formatDate = (date) => {
  if (!date) return "No expiry";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateInputValue = (date, fallback = "") => {
  if (!date) return fallback;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString().slice(0, 10);
};

const getTodayDateInput = () => new Date().toISOString().slice(0, 10);

const getFutureDateInput = (daysAhead = 30) =>
  new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

const parseNumericDiscount = (raw) => {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === "number") return Number.isNaN(raw) ? 0 : raw;
  const cleaned = String(raw).replace(/[^\d.]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeCouponRow = (c, nowMs = Date.now()) => {
  const code = String(c?.code || c?.couponCode || c?.name || "COUPON")
    .trim()
    .toUpperCase();
  const discountType =
    String(c?.discountType || c?.type || "percentage").toLowerCase() === "fixed"
      ? "fixed"
      : "percentage";

  const rawDiscount =
    c?.discountAmount ?? c?.discountValue ?? c?.discount ?? c?.value ?? 0;
  const discountAmount = Math.max(0, parseNumericDiscount(rawDiscount));
  const discountLabel =
    discountType === "fixed"
      ? `₹${discountAmount.toLocaleString("en-IN")}`
      : `${discountAmount}%`;

  const minPurchaseAmount = Math.max(
    0,
    Number(c?.minPurchaseAmount ?? c?.minOrderAmount ?? c?.minimumOrderAmount ?? 0) || 0,
  );
  const maxDiscountAmount = Math.max(
    0,
    Number(c?.maxDiscountAmount ?? c?.maximumDiscountAmount ?? 0) || 0,
  );
  const usedCount = Math.max(
    0,
    Number(c?.usedCount ?? c?.usageCount ?? c?.usage ?? 0) || 0,
  );
  const rawLimit = c?.usageLimit ?? c?.maxUses ?? null;
  const usageLimit =
    rawLimit !== null && rawLimit !== undefined && Number(rawLimit) > 0
      ? Number(rawLimit)
      : null;
  const usageLimitPerUser = Math.max(
    1,
    Number(c?.usageLimitPerUser ?? c?.perUserLimit ?? 1) || 1,
  );

  const startDateRaw = c?.startDate ?? c?.startsAt ?? null;
  const expiryDateRaw = c?.expiryDate ?? c?.expiresAt ?? c?.expiry ?? null;
  const startMs = startDateRaw ? new Date(startDateRaw).getTime() : NaN;
  const expiryMs = expiryDateRaw ? new Date(expiryDateRaw).getTime() : NaN;

  const isActive =
    c?.isActive !== false &&
    String(c?.status || "").toLowerCase() !== "inactive" &&
    String(c?.status || "").toLowerCase() !== "disabled";
  const isPublic = c?.isPublic !== false;

  const backendComputed = String(c?.computedStatus || "").toLowerCase();
  let computedStatus = backendComputed;
  if (!["active", "scheduled", "expired", "inactive"].includes(computedStatus)) {
    if (!Number.isNaN(expiryMs) && expiryMs < nowMs) {
      computedStatus = "expired";
    } else if (!isActive) {
      computedStatus = "inactive";
    } else if (!Number.isNaN(startMs) && startMs > nowMs) {
      computedStatus = "scheduled";
    } else {
      computedStatus = "active";
    }
  }

  const statusMeta = {
    active: { label: "Active", statusClass: "green" },
    scheduled: { label: "Scheduled", statusClass: "amber" },
    inactive: { label: "Inactive", statusClass: "amber" },
    expired: { label: "Expired", statusClass: "red" },
  }[computedStatus] || { label: "Active", statusClass: "green" };

  const vendorObj =
    c?.vendorId && typeof c.vendorId === "object" ? c.vendorId : null;
  const vendorName =
    c?.vendorName ||
    vendorObj?.storeName ||
    vendorObj?.shopName ||
    vendorObj?.name ||
    null;

  return {
    ...c,
    code,
    discountType,
    discountAmount,
    discountLabel,
    minPurchaseAmount,
    maxDiscountAmount,
    usedCount,
    usageLimit,
    usageDisplay: usageLimit !== null ? `${usedCount} / ${usageLimit}` : `${usedCount} / ∞`,
    usageLimitPerUser,
    startDateRaw,
    expiryDateRaw,
    expiryFormatted: formatDate(expiryDateRaw),
    startFormatted: startDateRaw ? formatDate(startDateRaw) : "",
    isActive,
    isPublic,
    computedStatus,
    statusLabel: statusMeta.label,
    statusClass: statusMeta.statusClass,
    vendorName,
    scopeLabel: c?.vendorId ? vendorName || "Vendor Store" : "Global",
  };
};

const buildEmptyForm = () => ({
  code: "",
  discountType: "percentage",
  discountAmount: "10",
  minPurchaseAmount: "0",
  maxDiscountAmount: "0",
  usageLimit: "",
  usageLimitPerUser: "1",
  startDate: getTodayDateInput(),
  expiryDate: getFutureDateInput(30),
  description: "",
  isActive: true,
  isPublic: true,
});

const Coupons = ({
  coupons = [],
  summary = null,
  couponUsage = null,
  loading = false,
  saving = false,
  error = null,
  pagination = {},
  filters = {},
  onFilterChange,
  onInspectCoupon,
  onCreateCoupon,
  onEditCoupon,
  onDeleteCoupon,
  onToggleCouponStatus,
  onToggleCouponVisibility,
  onClearError,
}) => {
  const isConnected = typeof onFilterChange === "function";
  const [nowMs] = useState(() => Date.now());
  const [search, setSearch] = useState(filters?.search || "");
  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(buildEmptyForm);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!isConnected || search === (filters?.search || "")) return undefined;
    const timer = setTimeout(() => {
      onFilterChange({ search, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters?.search, onFilterChange, isConnected]);

  const rows = useMemo(() => {
    return (Array.isArray(coupons) ? coupons : []).map((c) =>
      normalizeCouponRow(c, nowMs),
    );
  }, [coupons, nowMs]);

  const standaloneFiltered = useMemo(() => {
    if (isConnected) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        q &&
        !`${r.code} ${r.description || ""} ${r.discountLabel} ${r.statusLabel}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [isConnected, rows, search]);

  const visibleRows = useMemo(() => {
    if (isConnected) return rows;
    const start = (localPage - 1) * localLimit;
    return standaloneFiltered.slice(start, start + localLimit);
  }, [isConnected, rows, standaloneFiltered, localPage, localLimit]);

  const currentPage = isConnected
    ? pagination?.page || filters?.page || 1
    : localPage;
  const pageLimit = isConnected
    ? pagination?.limit || filters?.limit || 10
    : localLimit;
  const totalItems = isConnected
    ? pagination?.total ?? rows.length
    : standaloneFiltered.length;
  const totalPages = isConnected
    ? pagination?.totalPages || Math.max(1, Math.ceil(totalItems / pageLimit))
    : Math.max(1, Math.ceil(standaloneFiltered.length / localLimit));

  const kpiStats = useMemo(() => {
    const fallbackActive = rows.filter((r) => r.computedStatus === "active").length;
    const fallbackScheduled = rows.filter((r) => r.computedStatus === "scheduled").length;
    const fallbackExpired = rows.filter((r) => r.computedStatus === "expired").length;
    const fallbackInactive = rows.filter((r) => r.computedStatus === "inactive").length;
    const fallbackPublic = rows.filter((r) => r.isPublic).length;

    return {
      total: summary?.total ?? totalItems,
      active: summary?.active ?? fallbackActive,
      scheduled: summary?.scheduled ?? fallbackScheduled,
      expiredAndInactive:
        (summary?.expired ?? fallbackExpired) +
        (summary?.inactive ?? fallbackInactive),
      expired: summary?.expired ?? fallbackExpired,
      inactive: summary?.inactive ?? fallbackInactive,
      publicCount: summary?.publicCount ?? fallbackPublic,
    };
  }, [summary, rows, totalItems]);

  const hasActiveFilters = Boolean(
    (filters?.search && filters.search.trim()) ||
      (filters?.status && filters.status !== "all") ||
      (filters?.type && filters.type !== "all") ||
      (filters?.visibility && filters.visibility !== "all"),
  );

  const handleResetFilters = () => {
    setSearch("");
    onFilterChange?.({
      search: "",
      status: "all",
      type: "all",
      visibility: "all",
      page: 1,
    });
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm(buildEmptyForm());
    setFormError("");
    setConfirmDelete(false);
    onInspectCoupon?.(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setFormError("");
    setConfirmDelete(false);
    setForm({
      code: c.code || "",
      discountType: c.discountType || "percentage",
      discountAmount: String(c.discountAmount || 10),
      minPurchaseAmount: String(c.minPurchaseAmount ?? 0),
      maxDiscountAmount: String(c.maxDiscountAmount ?? 0),
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      usageLimitPerUser: String(c.usageLimitPerUser ?? 1),
      startDate: toDateInputValue(c.startDateRaw, getTodayDateInput()),
      expiryDate: toDateInputValue(c.expiryDateRaw, getFutureDateInput(30)),
      description: c.description || "",
      isActive: c.isActive !== false,
      isPublic: c.isPublic !== false,
    });
    setModalOpen(true);
    if (c._id) {
      onInspectCoupon?.(c._id);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
    setFormError("");
    setConfirmDelete(false);
  };

  const handleSaveCoupon = async (event) => {
    event?.preventDefault();
    setFormError("");

    const code = form.code.trim().toUpperCase();
    const amount = Number(form.discountAmount);
    const minPurchase = Number(form.minPurchaseAmount || 0);
    const maxDiscount = Number(form.maxDiscountAmount || 0);
    const perUser = Number(form.usageLimitPerUser || 1);
    const usageLimit = form.usageLimit.trim()
      ? Number(form.usageLimit.trim())
      : null;

    if (code.length < 3 || code.length > 30) {
      setFormError("Coupon code must be between 3 and 30 characters.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Discount value must be greater than 0.");
      return;
    }
    if (form.discountType === "percentage" && amount > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }
    if (!Number.isFinite(minPurchase) || minPurchase < 0) {
      setFormError("Minimum purchase amount cannot be negative.");
      return;
    }
    if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
      setFormError("Maximum discount cap cannot be negative.");
      return;
    }
    if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
      setFormError("Total usage limit must be a positive whole number or left blank.");
      return;
    }
    if (!Number.isInteger(perUser) || perUser <= 0) {
      setFormError("Per-user usage limit must be at least 1.");
      return;
    }
    if (!form.expiryDate) {
      setFormError("Expiry date is required.");
      return;
    }
    if (form.startDate && form.expiryDate && form.expiryDate < form.startDate) {
      setFormError("Expiry date must be on or after the start date.");
      return;
    }

    const payload = {
      code,
      discountType: form.discountType,
      discountAmount: amount,
      minPurchaseAmount: minPurchase,
      maxDiscountAmount: form.discountType === "percentage" ? maxDiscount : 0,
      usageLimit,
      usageLimitPerUser: perUser,
      startDate: form.startDate
        ? `${form.startDate}T00:00:00.000Z`
        : undefined,
      expiryDate: `${form.expiryDate}T23:59:59.999Z`,
      description: form.description.trim(),
      isActive: Boolean(form.isActive),
      isPublic: Boolean(form.isPublic),
    };

    try {
      if (editingCoupon?._id) {
        await onEditCoupon?.(editingCoupon, payload);
        toast.success(`Coupon ${code} updated`);
      } else {
        await onCreateCoupon?.(payload);
        toast.success(`Coupon ${code} created`);
      }
      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === "string" ? err : "Failed to save coupon");
      setFormError(msg);
      toast.error(msg);
    }
  };

  const handleQuickToggleActive = async (c) => {
    const id = c._id || c.id;
    if (!id || busyId) return;
    const nextActive = !c.isActive;
    setBusyId(id);
    try {
      await onToggleCouponStatus?.(c, nextActive);
      toast.success(
        `${c.code} marked ${nextActive ? "Active" : "Inactive"}`,
      );
      if (editingCoupon && (editingCoupon._id || editingCoupon.id) === id) {
        closeModal();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update status";
      toast.error(msg);
    } finally {
      setBusyId("");
    }
  };

  const handleQuickToggleVisibility = async (c) => {
    const id = c._id || c.id;
    if (!id || busyId) return;
    const nextPublic = !c.isPublic;
    setBusyId(id);
    try {
      await onToggleCouponVisibility?.(c, nextPublic);
      toast.success(
        nextPublic
          ? `${c.code} published to Public Storefront (/api/v1/coupons)`
          : `${c.code} set to Private (code-only at checkout)`,
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update storefront visibility";
      toast.error(msg);
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingCoupon?._id) return;
    try {
      await onDeleteCoupon?.(editingCoupon);
      toast.success(`Coupon ${editingCoupon.code} deleted`);
      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to delete coupon";
      setFormError(msg);
      toast.error(msg);
    }
  };

  const usageMatchesEditing =
    editingCoupon &&
    couponUsage &&
    String(couponUsage.code || "").toUpperCase() ===
      String(editingCoupon.code || "").toUpperCase();

  return (
    <div className="space-y-4">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Coupons</h1>
        </div>
        <button
          type="button"
          className="primarybtn"
          onClick={handleOpenCreate}
        >
          + Add coupon
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onFilterChange?.({ status: "all", page: 1 })}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            (filters?.status || "all") === "all"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">Total coupons</p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {kpiStats.total}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {kpiStats.publicCount} public on storefront
          </p>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange?.({ status: "active", page: 1 })}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            filters?.status === "active"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">Active</p>
          <p className="mt-1 text-2xl font-black text-[#16845b]">
            {kpiStats.active}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            Currently redeemable
          </p>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange?.({ status: "scheduled", page: 1 })}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            filters?.status === "scheduled"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">Scheduled</p>
          <p className="mt-1 text-2xl font-black text-[#9b6814]">
            {kpiStats.scheduled}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            Upcoming start date
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            onFilterChange?.({
              status: filters?.status === "expired" ? "inactive" : "expired",
              page: 1,
            })
          }
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            filters?.status === "expired" || filters?.status === "inactive"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">
            Expired / Inactive
          </p>
          <p className="mt-1 text-2xl font-black text-[#bd3345]">
            {kpiStats.expiredAndInactive}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {kpiStats.expired} expired · {kpiStats.inactive} paused
          </p>
        </button>
      </div>

      {/* Storefront Public Route Info Note */}
      <div className="notice text-xs">
        <b>Public storefront control:</b> Coupons marked{" "}
        <span className="font-bold text-[#16845b]">Public</span> that are{" "}
        <b>Active</b> and within date window are automatically published on{" "}
        <code>GET /api/v1/coupons</code> (Storefront <b>Deals</b> &{" "}
        <b>Cart Offers</b>). Coupons marked <b>Private</b> still work when
        entered at checkout but stay hidden from public listings.
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-semibold text-[#bd3345]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => onClearError?.()}
            className="cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search code or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isConnected) setLocalPage(1);
            }}
          />

          <select
            className="field"
            value={filters?.status || "all"}
            onChange={(e) =>
              onFilterChange?.({ status: e.target.value, page: 1 })
            }
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="field"
            value={filters?.type || "all"}
            onChange={(e) =>
              onFilterChange?.({ type: e.target.value, page: 1 })
            }
          >
            <option value="all">All discount types</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₹)</option>
          </select>

          <select
            className="field"
            value={filters?.visibility || "all"}
            onChange={(e) =>
              onFilterChange?.({ visibility: e.target.value, page: 1 })
            }
          >
            <option value="all">All visibility</option>
            <option value="public">Public on Storefront</option>
            <option value="private">Private (Code Only)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="outlinebtn"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          )}
        </div>

        <div id="simpleTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Storefront</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-sm text-[var(--muted)]"
                  >
                    Loading coupons...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <p className="text-sm font-bold text-[var(--text)]">
                      No coupons found
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {hasActiveFilters
                        ? "Try adjusting your search or filter criteria."
                        : "Create your first promotional coupon to offer discounts."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleRows.map((c) => {
                  const id = c._id || c.id || c.code;
                  const isRowBusy = busyId === id;
                  return (
                    <tr key={id}>
                      <td>
                        <div className="font-bold text-[var(--text)]">
                          {c.code}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                          {c.scopeLabel}
                          {c.description ? ` · ${c.description.slice(0, 36)}` : ""}
                        </div>
                      </td>

                      <td>
                        <div className="font-semibold text-[var(--text)]">
                          {c.discountLabel}
                        </div>
                        {(c.minPurchaseAmount > 0 || c.maxDiscountAmount > 0) && (
                          <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                            {c.minPurchaseAmount > 0
                              ? `Min ₹${c.minPurchaseAmount}`
                              : ""}
                            {c.minPurchaseAmount > 0 && c.maxDiscountAmount > 0
                              ? " · "
                              : ""}
                            {c.maxDiscountAmount > 0
                              ? `Max ₹${c.maxDiscountAmount}`
                              : ""}
                          </div>
                        )}
                      </td>

                      <td>{c.usageDisplay}</td>

                      <td>
                        <div>{c.expiryFormatted}</div>
                        {c.computedStatus === "scheduled" && c.startFormatted && (
                          <div className="mt-0.5 text-[11px] text-[#9b6814]">
                            Starts {c.startFormatted}
                          </div>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          disabled={isRowBusy || !onToggleCouponVisibility}
                          onClick={() => handleQuickToggleVisibility(c)}
                          title="Click to toggle public storefront visibility"
                          className={`status cursor-pointer border-0 transition ${
                            c.isPublic ? "green" : "amber"
                          }`}
                        >
                          {c.isPublic ? "Public" : "Private"}
                        </button>
                      </td>

                      <td>
                        <span className={`status ${c.statusClass}`}>
                          {c.statusLabel}
                        </span>
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleOpenEdit(c)}
                          >
                            Edit
                          </button>
                          {c._id && c.computedStatus !== "expired" && (
                            <button
                              type="button"
                              className="btnsm"
                              disabled={isRowBusy}
                              onClick={() => handleQuickToggleActive(c)}
                            >
                              {c.isActive ? "Pause" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageLimit}
          itemLabel="coupons"
          loading={loading}
          onPageChange={(nextPage) => {
            if (isConnected) {
              onFilterChange({ page: nextPage });
            } else {
              setLocalPage(nextPage);
            }
          }}
          onPageSizeChange={(nextLimit) => {
            if (isConnected) {
              onFilterChange({ limit: nextLimit, page: 1 });
            } else {
              setLocalLimit(nextLimit);
              setLocalPage(1);
            }
          }}
        />
      </div>

      {modalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal" style={{ maxWidth: "620px" }}>
            <div className="modalhead">
              <h2>
                {editingCoupon
                  ? `Edit coupon · ${editingCoupon.code}`
                  : "Create coupon"}
              </h2>
              <button
                type="button"
                className="iconbtn"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            {usageMatchesEditing && (
              <div className="notice" style={{ marginBottom: "12px" }}>
                <div className="text-xs">
                  <b>Usage stats:</b> {couponUsage.usedCount} /{" "}
                  {couponUsage.usageLimit ?? "∞"} used
                  {couponUsage.usageLimit
                    ? ` (${couponUsage.usagePercentage}%) · ${couponUsage.remainingUses} remaining`
                    : " (unlimited total uses)"}
                </div>
                {Array.isArray(couponUsage.usages) &&
                  couponUsage.usages.length > 0 && (
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto border-t border-[var(--line)] pt-2 text-[11px]">
                      {couponUsage.usages.slice(0, 5).map((u, idx) => (
                        <div
                          key={u._id || idx}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>
                            {u.userId?.name || u.userId?.email || "Customer"}
                            {u.orderId?.orderNumber
                              ? ` · #${u.orderId.orderNumber}`
                              : ""}
                          </span>
                          <span className="font-semibold">
                            -₹{Number(u.discountAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-3 py-2 text-xs font-semibold text-[#bd3345]"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCoupon}>
              <div className="formgrid">
                <div className="formgroup">
                  <label>Coupon code *</label>
                  <input
                    className="field full uppercase"
                    placeholder="WELCOME10"
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Discount type</label>
                  <select
                    className="field full"
                    value={form.discountType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        discountType: e.target.value,
                      }))
                    }
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>

                <div className="formgroup">
                  <label>
                    {form.discountType === "percentage"
                      ? "Discount percentage (%) *"
                      : "Discount amount (₹) *"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={form.discountType === "percentage" ? "100" : undefined}
                    step="0.01"
                    className="field full"
                    value={form.discountAmount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        discountAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Minimum purchase (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="field full"
                    value={form.minPurchaseAmount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        minPurchaseAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Max discount cap (₹, 0 = none)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={form.discountType === "fixed"}
                    className="field full"
                    value={form.discountType === "fixed" ? "0" : form.maxDiscountAmount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maxDiscountAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Total usage limit (blank = ∞)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    className="field full"
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimit: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Uses per customer *</label>
                  <input
                    type="number"
                    min="1"
                    className="field full"
                    value={form.usageLimitPerUser}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimitPerUser: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Start date</label>
                  <input
                    type="date"
                    className="field full"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Expiry date *</label>
                  <input
                    type="date"
                    className="field full"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup" style={{ gridColumn: "1 / -1" }}>
                  <label>Offer description (shown on public Deals & Cart)</label>
                  <input
                    className="field full"
                    placeholder="e.g. Flat 10% off on orders above ₹999"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2 rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-3 text-xs">
                <label className="flex cursor-pointer items-center gap-2 font-semibold text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isActive)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Coupon is active and redeemable
                </label>

                <label className="flex cursor-pointer items-start gap-2 text-[var(--text)]">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(form.isPublic)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    <span className="font-semibold">
                      Show on Public Storefront (Deals & Cart Offers)
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      Exposed via <code>GET /api/v1/coupons</code> when Active and
                      within valid dates. Uncheck for Private / VIP codes.
                    </span>
                  </span>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  marginTop: "16px",
                }}
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="primarybtn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save coupon"}
                  </button>
                  <button
                    type="button"
                    className="outlinebtn"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>

                {editingCoupon?._id && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btnsm"
                      disabled={saving}
                      onClick={() => handleQuickToggleActive(editingCoupon)}
                    >
                      {editingCoupon.isActive ? "Deactivate" : "Activate"}
                    </button>

                    {confirmDelete ? (
                      <button
                        type="button"
                        className="btnsm"
                        style={{
                          background: "#bd3345",
                          color: "#fff",
                          borderColor: "#bd3345",
                        }}
                        disabled={saving}
                        onClick={handleConfirmDelete}
                      >
                        Confirm delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btnsm"
                        style={{ color: "#bd3345", borderColor: "#f3cbd0" }}
                        disabled={saving}
                        onClick={() => setConfirmDelete(true)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
