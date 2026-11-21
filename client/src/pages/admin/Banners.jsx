import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AdminPagination from "../../components/admin/AdminPagination";

const POSITION_OPTIONS = [
  { value: "home_hero", label: "Homepage hero" },
  { value: "home_middle", label: "Homepage middle" },
  { value: "home_bottom", label: "Homepage bottom" },
  { value: "category_top", label: "Shop / Categories top" },
  { value: "sidebar", label: "Sidebar promo" },
  { value: "product_page", label: "Product page" },
];

const POSITION_LABEL_MAP = {
  home_hero: "Homepage hero",
  home_middle: "Homepage middle",
  home_bottom: "Homepage bottom",
  category_top: "Shop / Categories top",
  sidebar: "Sidebar promo",
  product_page: "Product page",
  HOME_HERO: "Homepage hero",
  HOME_MIDDLE: "Homepage middle",
  HOME_BOTTOM: "Homepage bottom",
  CATEGORY: "Shop / Categories top",
  PRODUCT: "Product page",
};

const normalizePositionValue = (raw) => {
  if (!raw) return "home_hero";
  const key = String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    home_hero: "home_hero",
    homepage_hero: "home_hero",
    home_middle: "home_middle",
    homepage_middle: "home_middle",
    home_bottom: "home_bottom",
    homepage_bottom: "home_bottom",
    category_top: "category_top",
    category: "category_top",
    sidebar: "sidebar",
    product_page: "product_page",
    product: "product_page",
  };
  return aliases[key] || "home_hero";
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateInput = (value, fallback = "") => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString().slice(0, 10);
};

const getTodayDateInput = () => new Date().toISOString().slice(0, 10);

const normalizeBannerRow = (b, nowMs = Date.now()) => {
  const title = b?.title || b?.name || "Promotional Banner";
  const position = normalizePositionValue(b?.position || b?.section);
  const placementLabel =
    b?.placementLabel || POSITION_LABEL_MAP[position] || "Homepage hero";

  const imageUrl =
    b?.imageUrl ||
    (typeof b?.image === "string" ? b.image : b?.image?.url) ||
    "";

  const startDateRaw = b?.startDate || null;
  const endDateRaw = b?.endDate || null;
  const startMs = startDateRaw ? new Date(startDateRaw).getTime() : NaN;
  const endMs = endDateRaw ? new Date(endDateRaw).getTime() : NaN;

  let scheduleLabel = b?.scheduleLabel || b?.schedule || "";
  if (!scheduleLabel) {
    const startText = formatDate(startDateRaw);
    const endText = formatDate(endDateRaw);
    if (startText && endText) scheduleLabel = `${startText} – ${endText}`;
    else if (startText) scheduleLabel = `From ${startText}`;
    else if (endText) scheduleLabel = `Until ${endText}`;
    else scheduleLabel = "Always active";
  }

  const rawStatusStr = String(b?.status || "").trim().toUpperCase();
  const isActive =
    b?.isActive !== false &&
    rawStatusStr !== "INACTIVE" &&
    rawStatusStr !== "PAUSED";

  const backendComputed = String(b?.computedStatus || "").toLowerCase();
  let computedStatus = backendComputed;
  if (!["active", "scheduled", "expired", "inactive"].includes(computedStatus)) {
    if (!Number.isNaN(endMs) && endMs < nowMs) {
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

  const impressions = Math.max(0, Number(b?.impressions) || 0);
  const clicks = Math.max(0, Number(b?.clicks) || 0);
  const ctr =
    b?.ctr ??
    (impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0);

  return {
    ...b,
    title,
    subtitle: b?.subtitle || "",
    description: b?.description || "",
    buttonText: b?.buttonText || "",
    link: b?.link || "",
    position,
    placementLabel,
    sortOrder: Number(b?.sortOrder) || 0,
    imageUrl,
    startDateRaw,
    endDateRaw,
    scheduleLabel,
    isActive,
    computedStatus,
    statusLabel: statusMeta.label,
    statusClass: statusMeta.statusClass,
    impressions,
    clicks,
    ctr,
  };
};

const buildEmptyForm = () => ({
  title: "",
  subtitle: "",
  description: "",
  buttonText: "",
  link: "/products",
  position: "home_hero",
  sortOrder: "0",
  startDate: getTodayDateInput(),
  endDate: "",
  imageUrl: "",
  isActive: true,
});

const Banners = ({
  banners = [],
  summary = null,
  pagination = {},
  filters = {},
  loading = false,
  saving = false,
  error = null,
  onFilterChange,
  onCreateBanner,
  onEditBanner,
  onDeleteBanner,
  onToggleBannerStatus,
  onClearError,
}) => {
  const isConnected = typeof onFilterChange === "function";
  const [nowMs] = useState(() => Date.now());
  const [search, setSearch] = useState(filters?.search || "");
  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState(buildEmptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
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

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const rows = useMemo(() => {
    return (Array.isArray(banners) ? banners : []).map((b) =>
      normalizeBannerRow(b, nowMs),
    );
  }, [banners, nowMs]);

  const standaloneFiltered = useMemo(() => {
    if (isConnected) return rows;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.title} ${r.subtitle} ${r.placementLabel} ${r.scheduleLabel} ${r.statusLabel}`
        .toLowerCase()
        .includes(q),
    );
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
    const fallbackScheduled = rows.filter(
      (r) => r.computedStatus === "scheduled",
    ).length;
    const fallbackExpired = rows.filter(
      (r) => r.computedStatus === "expired",
    ).length;
    const fallbackInactive = rows.filter(
      (r) => r.computedStatus === "inactive",
    ).length;

    return {
      total: summary?.total ?? totalItems,
      active: summary?.active ?? fallbackActive,
      scheduled: summary?.scheduled ?? fallbackScheduled,
      expired: summary?.expired ?? fallbackExpired,
      inactive: summary?.inactive ?? fallbackInactive,
      expiredAndInactive:
        (summary?.expired ?? fallbackExpired) +
        (summary?.inactive ?? fallbackInactive),
    };
  }, [summary, rows, totalItems]);

  const hasActiveFilters = Boolean(
    (filters?.search && filters.search.trim()) ||
      (filters?.status && filters.status !== "all") ||
      (filters?.position && filters.position !== "all"),
  );

  const handleResetFilters = () => {
    setSearch("");
    onFilterChange?.({
      search: "",
      status: "all",
      position: "all",
      page: 1,
    });
  };

  const resetPreview = (nextUrl = "") => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(nextUrl);
  };

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setForm(buildEmptyForm());
    resetPreview("");
    setFormError("");
    setConfirmDelete(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBanner(b);
    setForm({
      title: b.title || "",
      subtitle: b.subtitle || "",
      description: b.description || "",
      buttonText: b.buttonText || "",
      link: b.link || "",
      position: normalizePositionValue(b.position || b.section),
      sortOrder: String(b.sortOrder ?? 0),
      startDate: toDateInput(b.startDateRaw, getTodayDateInput()),
      endDate: toDateInput(b.endDateRaw, ""),
      imageUrl: b.imageUrl || "",
      isActive: b.isActive !== false,
    });
    resetPreview(b.imageUrl || "");
    setFormError("");
    setConfirmDelete(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBanner(null);
    resetPreview("");
    setFormError("");
    setConfirmDelete(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Banner image size cannot exceed 5 MB.");
      return;
    }
    setFormError("");
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveBanner = async (event) => {
    event?.preventDefault();
    setFormError("");

    const title = form.title.trim();
    if (title.length < 2) {
      setFormError("Banner title must be at least 2 characters.");
      return;
    }

    const sortOrder = Number(form.sortOrder || 0);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setFormError("Display order must be 0 or a positive integer.");
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setFormError("End date must be on or after the start date.");
      return;
    }

    let payload;
    if (imageFile) {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("title", title);
      fd.append("subtitle", form.subtitle.trim());
      fd.append("description", form.description.trim());
      fd.append("buttonText", form.buttonText.trim());
      fd.append("link", form.link.trim());
      fd.append("position", form.position);
      fd.append("sortOrder", String(sortOrder));
      fd.append("isActive", String(Boolean(form.isActive)));
      if (form.startDate) fd.append("startDate", `${form.startDate}T00:00:00.000Z`);
      fd.append(
        "endDate",
        form.endDate ? `${form.endDate}T23:59:59.999Z` : "",
      );
      payload = fd;
    } else {
      payload = {
        title,
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        buttonText: form.buttonText.trim(),
        link: form.link.trim(),
        position: form.position,
        sortOrder,
        isActive: Boolean(form.isActive),
        startDate: form.startDate ? `${form.startDate}T00:00:00.000Z` : undefined,
        endDate: form.endDate ? `${form.endDate}T23:59:59.999Z` : null,
      };
      if (form.imageUrl.trim()) {
        payload.imageUrl = form.imageUrl.trim();
      }
    }

    try {
      if (editingBanner?._id || editingBanner?.id) {
        await onEditBanner?.(editingBanner, payload);
        toast.success(`Banner "${title}" updated`);
      } else {
        await onCreateBanner?.(payload);
        toast.success(`Banner "${title}" created`);
      }
      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === "string" ? err : "Failed to save banner");
      setFormError(msg);
      toast.error(msg);
    }
  };

  const handleQuickToggleStatus = async (b) => {
    const id = b._id || b.id;
    if (!id || busyId) return;
    const nextActive = !b.isActive;
    setBusyId(id);
    try {
      await onToggleBannerStatus?.(b, nextActive);
      toast.success(
        `${b.title} marked ${nextActive ? "Active" : "Inactive"}`,
      );
      if (editingBanner && (editingBanner._id || editingBanner.id) === id) {
        closeModal();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to update banner status";
      toast.error(msg);
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingBanner?._id && !editingBanner?.id) return;
    try {
      await onDeleteBanner?.(editingBanner);
      toast.success(`Banner "${editingBanner.title}" deleted`);
      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to delete banner";
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Banners</h1>
        </div>
        <button
          type="button"
          className="primarybtn"
          onClick={handleOpenCreate}
        >
          + Add banner
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
          <p className="text-xs font-bold text-[var(--muted)]">Total banners</p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {kpiStats.total}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            All storefront placements
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
            Live on storefront
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
            Upcoming campaigns
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

      {/* Placement mapping info notice */}
      <div className="notice text-xs">
        <b>Storefront sync:</b> Active banners within date range are served via{" "}
        <code>GET /api/v1/banners/active</code> and appear automatically on{" "}
        <b>Homepage Hero</b> (<code>home_hero</code>), <b>Homepage Middle/Bottom</b>, and{" "}
        <b>Shop / Categories Top</b> (<code>category_top</code>) in ascending Sort Order.
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
            placeholder="Search banner title, subtitle, link..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isConnected) setLocalPage(1);
            }}
          />

          <select
            className="field"
            value={filters?.position || "all"}
            onChange={(e) =>
              onFilterChange?.({ position: e.target.value, page: 1 })
            }
          >
            <option value="all">All placements</option>
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

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
                <th>Preview</th>
                <th>Banner</th>
                <th>Placement</th>
                <th>Schedule</th>
                <th>Performance</th>
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
                    Loading banners...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <p className="text-sm font-bold text-[var(--text)]">
                      No banners found
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {hasActiveFilters
                        ? "Try adjusting your search or filter criteria."
                        : "Add your first promotional banner for the storefront."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleRows.map((b, i) => {
                  const id = b._id || b.id || `${b.title}-${i}`;
                  const isRowBusy = busyId === id;
                  return (
                    <tr key={id}>
                      <td>
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.title}
                            className="h-11 w-20 rounded-lg border border-[var(--line)] object-cover bg-[#fcf9fa]"
                          />
                        ) : (
                          <div className="flex h-11 w-20 items-center justify-center rounded-lg border border-[var(--line)] bg-[#fcf9fa] text-[10px] font-bold text-[var(--muted)]">
                            No image
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="font-bold text-[var(--text)]">
                          {b.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                          {b.subtitle || b.link || "Storefront campaign"}
                        </div>
                      </td>

                      <td>
                        <div className="font-medium text-[var(--text)]">
                          {b.placementLabel}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                          Order #{b.sortOrder}
                        </div>
                      </td>

                      <td>{b.scheduleLabel}</td>

                      <td>
                        <div className="text-xs font-semibold text-[var(--text)]">
                          {b.impressions} views · {b.clicks} clicks
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                          CTR {b.ctr}%
                        </div>
                      </td>

                      <td>
                        <span className={`status ${b.statusClass}`}>
                          {b.statusLabel}
                        </span>
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleOpenEdit(b)}
                          >
                            Edit
                          </button>
                          {b._id && b.computedStatus !== "expired" && (
                            <button
                              type="button"
                              className="btnsm"
                              disabled={isRowBusy}
                              onClick={() => handleQuickToggleStatus(b)}
                            >
                              {b.isActive ? "Pause" : "Activate"}
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
          itemLabel="banners"
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
          <div className="modal" style={{ maxWidth: "640px" }}>
            <div className="modalhead">
              <h2>
                {editingBanner ? `Edit banner · ${editingBanner.title}` : "Add banner"}
              </h2>
              <button
                type="button"
                className="iconbtn"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-3 py-2 text-xs font-semibold text-[#bd3345]"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveBanner}>
              {/* Banner image uploader + preview */}
              <div className="mb-4 rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-3">
                <div className="flex flex-wrap items-center gap-4">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Banner preview"
                      className="h-20 w-36 rounded-lg border border-[var(--line)] object-cover bg-white"
                    />
                  ) : (
                    <div className="flex h-20 w-36 items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-white text-[11px] font-semibold text-[var(--muted)]">
                      No preview selected
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="block text-xs font-bold text-[var(--text)]">
                      Banner image (Cloudinary upload or URL)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-[var(--muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-[var(--line)] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--text)]"
                    />
                    <input
                      type="text"
                      className="field full"
                      placeholder="Or paste image URL (https://...)"
                      value={form.imageUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({ ...prev, imageUrl: val }));
                        if (!imageFile) {
                          setImagePreviewUrl(val);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="formgrid">
                <div className="formgroup">
                  <label>Banner title *</label>
                  <input
                    className="field full"
                    placeholder="Mega Tech Sale 2026"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Subtitle / Eyebrow text</label>
                  <input
                    className="field full"
                    placeholder="The curated collection · 2026"
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Placement section</label>
                  <select
                    className="field full"
                    value={form.position}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, position: e.target.value }))
                    }
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="formgroup">
                  <label>Sort order (lower renders first)</label>
                  <input
                    type="number"
                    min="0"
                    className="field full"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>CTA Button text</label>
                  <input
                    className="field full"
                    placeholder="Explore collection →"
                    value={form.buttonText}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        buttonText: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="formgroup">
                  <label>Target URL / Route</label>
                  <input
                    className="field full"
                    placeholder="/products?deals=true"
                    value={form.link}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, link: e.target.value }))
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
                  <label>End date (blank = always active)</label>
                  <input
                    type="date"
                    className="field full"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>

                <div className="formgroup" style={{ gridColumn: "1 / -1" }}>
                  <label>Hero description</label>
                  <textarea
                    rows={2}
                    className="field full"
                    placeholder="Short campaign summary shown on the storefront banner..."
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

              <div className="mt-3 rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-3 text-xs">
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
                  Banner is active and eligible for storefront display
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
                    {saving ? "Saving..." : "Save banner"}
                  </button>
                  <button
                    type="button"
                    className="outlinebtn"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>

                {(editingBanner?._id || editingBanner?.id) && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btnsm"
                      disabled={saving}
                      onClick={() => handleQuickToggleStatus(editingBanner)}
                    >
                      {editingBanner.isActive ? "Pause" : "Activate"}
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

export default Banners;
