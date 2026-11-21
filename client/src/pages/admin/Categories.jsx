import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import AdminPagination from "../../components/admin/AdminPagination";

const toSlugPreview = (text = "") =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

const Categories = () => {
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [isLegacyList, setIsLegacyList] = useState(false);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    total: null,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catParent, setCatParent] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catSortOrder, setCatSortOrder] = useState("0");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catImageFile, setCatImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [catActive, setCatActive] = useState(true);

  const catImagePreview = useMemo(() => {
    if (!catImageFile) return "";
    return URL.createObjectURL(catImageFile);
  }, [catImageFile]);

  useEffect(() => {
    return () => {
      if (catImagePreview) URL.revokeObjectURL(catImagePreview);
    };
  }, [catImagePreview]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adminService.getCategories(params);
      const data = response?.data ?? response;
      const arrayPayload = Array.isArray(data);
      const list = Array.isArray(data?.categories)
        ? data.categories
        : arrayPayload
          ? data
          : [];

      setIsLegacyList(arrayPayload);
      setCategories(list);

      if (arrayPayload) {
        const activeCount = list.filter((c) => c.isActive !== false).length;
        const archivedCount = list.filter((c) => c.isActive === false).length;
        const productsCount = list.reduce(
          (sum, c) => sum + Number(c.productCount ?? c.productsCount ?? c.products ?? 0),
          0,
        );
        setSummary({
          total: list.length,
          active: activeCount,
          archived: archivedCount,
          totalCategorizedProducts: productsCount,
        });
        setPagination({
          total: list.length,
          page: 1,
          limit,
          totalPages: Math.max(1, Math.ceil(list.length / limit)),
        });
      } else {
        setSummary(data?.summary || null);
        if (data?.pagination) {
          setPagination((prev) => ({ ...prev, ...data.pagination }));
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchCategories();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [fetchCategories, search]);

  const allMappedRows = useMemo(() => {
    return (Array.isArray(categories) ? categories : []).map((c, i) => {
      const name = c.name || "Category";
      const slug = c.slug || toSlugPreview(name);
      const productCount = Number(
        c.productCount ?? c.productsCount ?? c.products ?? 0,
      );
      const publishedCount = Number(c.publishedProductCount ?? 0);
      const isActive = c.isActive !== false;
      const imageUrl =
        c.imageUrl || (typeof c.image === "string" ? c.image : c.image?.url) || "";
      const rawParent = c.parent || c.parentCategory;
      const parentName =
        c.parentName || (typeof rawParent === "object" ? rawParent?.name : "") || "";

      return {
        ...c,
        _key: c._id || c.id || slug || i,
        _name: name,
        _slug: slug,
        _products: productCount,
        _publishedProducts: publishedCount,
        _isActive: isActive,
        _status: isActive ? "Active" : "Archived",
        _imageUrl: imageUrl,
        _parentName: parentName,
        _parentId:
          typeof rawParent === "object" ? rawParent?._id || "" : rawParent || "",
      };
    });
  }, [categories]);

  const filteredRows = useMemo(() => {
    if (!isLegacyList) return allMappedRows;
    const q = search.trim().toLowerCase();
    return allMappedRows.filter((item) => {
      if (statusFilter === "active" && !item._isActive) return false;
      if (statusFilter === "archived" && item._isActive) return false;
      if (
        q &&
        !item._name.toLowerCase().includes(q) &&
        !item._slug.toLowerCase().includes(q) &&
        !String(item.description || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [allMappedRows, isLegacyList, search, statusFilter]);

  const rows = useMemo(() => {
    if (!isLegacyList) return filteredRows;
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, isLegacyList, page, limit]);

  const resetModalForm = () => {
    setEditingCat(null);
    setCatName("");
    setCatSlug("");
    setCatDesc("");
    setCatParent("");
    setCatIcon("");
    setCatSortOrder("0");
    setCatImageUrl("");
    setCatImageFile(null);
    setRemoveImage(false);
    setCatActive(true);
    setFormError("");
    setConfirmDelete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenAdd = () => {
    resetModalForm();
    setModalOpen(true);
  };

  const handleOpenEdit = async (cat) => {
    setEditingCat(cat);
    setCatName(cat._name || "");
    setCatSlug(cat._slug || "");
    setCatDesc(cat.description || "");
    setCatParent(cat._parentId || "");
    setCatIcon(cat.icon || "");
    setCatSortOrder(String(cat.sortOrder ?? 0));
    setCatImageUrl(cat._imageUrl || "");
    setCatImageFile(null);
    setRemoveImage(false);
    setCatActive(cat._isActive);
    setFormError("");
    setConfirmDelete(false);
    setModalOpen(true);

    if (cat._id) {
      try {
        const res = await adminService.getCategoryById(cat._id);
        const detail = res?.data ?? res;
        if (detail && typeof detail === "object") {
          setEditingCat((prev) => (prev ? { ...prev, ...detail } : prev));
          setCatName(detail.name || cat._name || "");
          setCatSlug(detail.slug || cat._slug || "");
          setCatDesc(detail.description || "");
          setCatParent(
            typeof detail.parent === "object"
              ? detail.parent?._id || ""
              : detail.parent || "",
          );
          setCatIcon(detail.icon || "");
          setCatSortOrder(String(detail.sortOrder ?? 0));
          setCatImageUrl(
            detail.imageUrl ||
              (typeof detail.image === "string"
                ? detail.image
                : detail.image?.url) ||
              "",
          );
          setCatActive(detail.isActive !== false);
        }
      } catch {
        // Non-blocking refresh
      }
    }
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
    resetModalForm();
  };

  const handleSaveCategory = async (event) => {
    event?.preventDefault();
    if (saving) return;

    const trimmedName = catName.trim();
    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }

    const sortNum = catSortOrder === "" ? 0 : Number(catSortOrder);
    if (Number.isNaN(sortNum)) {
      setFormError("Sort order must be a valid number.");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      let payload;
      if (catImageFile) {
        payload = new FormData();
        payload.append("name", trimmedName);
        if (catSlug.trim()) payload.append("slug", catSlug.trim());
        payload.append("description", catDesc.trim());
        payload.append("parent", catParent || "");
        payload.append("icon", catIcon.trim());
        payload.append("sortOrder", String(sortNum));
        payload.append("isActive", String(catActive));
        payload.append("image", catImageFile);
      } else {
        payload = {
          name: trimmedName,
          ...(catSlug.trim() ? { slug: catSlug.trim() } : {}),
          description: catDesc.trim(),
          parent: catParent || null,
          icon: catIcon.trim(),
          sortOrder: sortNum,
          isActive: catActive,
          ...(removeImage
            ? { removeImage: true }
            : { imageUrl: catImageUrl.trim() }),
        };
      }

      if (editingCat?._id) {
        await adminService.updateCategory(editingCat._id, payload);
        toast.success("Category updated");
      } else {
        await adminService.createCategory(payload);
        toast.success("Category created");
      }

      setModalOpen(false);
      resetModalForm();
      await fetchCategories();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to save category";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveToggle = async (cat) => {
    if (!cat?._id || saving) return;
    const nextActive = !cat._isActive;
    try {
      setSaving(true);
      await adminService.updateCategoryStatus(cat._id, nextActive);
      toast.success(nextActive ? "Category activated" : "Category archived");
      await fetchCategories();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update category status",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (targetCat = editingCat) => {
    if (!targetCat?._id || saving) return;

    try {
      setSaving(true);
      await adminService.deleteCategory(targetCat._id);
      toast.success("Category deleted");
      setModalOpen(false);
      resetModalForm();
      if (page > 1 && rows.length <= 1) {
        setPage((p) => p - 1);
      } else {
        await fetchCategories();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to delete category";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const parentOptions = useMemo(() => {
    return allMappedRows.filter((c) => !editingCat || c._id !== editingCat._id);
  }, [allMappedRows, editingCat]);

  const effectiveTotalItems = isLegacyList
    ? filteredRows.length
    : typeof pagination.total === "number"
      ? pagination.total
      : rows.length;
  const effectiveTotalPages = isLegacyList
    ? Math.max(1, Math.ceil(filteredRows.length / limit))
    : pagination.totalPages ||
      Math.ceil(effectiveTotalItems / limit) ||
      1;

  const statActive =
    summary?.active ?? allMappedRows.filter((r) => r._isActive).length;
  const statArchived =
    summary?.archived ?? allMappedRows.filter((r) => !r._isActive).length;
  const rawStatTotal =
    summary?.total ??
    (typeof pagination.total === "number"
      ? pagination.total
      : allMappedRows.length);
  const statTotal =
    rawStatTotal === 0 && (statActive > 0 || statArchived > 0)
      ? statActive + statArchived
      : rawStatTotal;
  const statProducts =
    summary?.totalCategorizedProducts ??
    allMappedRows.reduce((sum, r) => sum + r._products, 0);

  const previewImageSrc = catImageFile
    ? catImagePreview
    : !removeImage
      ? catImageUrl
      : "";

  return (
    <div className="space-y-6">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Categories</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total categories",
            value: statTotal,
            active: statusFilter === "all",
            onClick: () => {
              setStatusFilter("all");
              setPage(1);
            },
          },
          {
            label: "Active",
            value: statActive,
            active: statusFilter === "active",
            onClick: () => {
              setStatusFilter("active");
              setPage(1);
            },
          },
          {
            label: "Archived",
            value: statArchived,
            active: statusFilter === "archived",
            onClick: () => {
              setStatusFilter("archived");
              setPage(1);
            },
          },
          {
            label: "Assigned products",
            value: statProducts,
            active: false,
            onClick: null,
          },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            disabled={!card.onClick}
            onClick={card.onClick || undefined}
            className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition ${
              card.onClick
                ? card.active
                  ? "cursor-pointer border-[var(--primary)] ring-2 ring-[var(--soft)]"
                  : "cursor-pointer border-[var(--line)] hover:border-[var(--primary)]/50"
                : "cursor-default border-[var(--line)]"
            }`}
          >
            <p className="text-xs font-bold text-[var(--muted)]">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-[var(--text)]">{card.value}</p>
          </button>
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
            onClick={() => setError("")}
            className="cursor-pointer text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel">
        <div className="pagehead">
          <h2>Product categories</h2>
          <button
            type="button"
            className="primarybtn"
            onClick={handleOpenAdd}
          >
            + Add category
          </button>
        </div>

        <div className="toolbar">
          <input
            className="field"
            placeholder="Search category name or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page !== 1) setPage(1);
            }}
          />

          <select
            className="field"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (page !== 1) setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>

          {(search || statusFilter !== "all") && (
            <button
              type="button"
              className="outlinebtn"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          )}
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Order</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading categories...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    No categories match the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c._key}>
                    <td>
                      <div className="flex items-center gap-3">
                        {c._imageUrl ? (
                          <img
                            src={c._imageUrl}
                            alt={c._name}
                            className="h-9 w-9 shrink-0 rounded-lg border border-[var(--line)] object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--soft)] text-sm font-bold text-[var(--primary)]">
                            {c.icon || c._name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--text)]">
                            {c._name}
                          </div>
                          {(c._parentName || c.description) && (
                            <div className="max-w-[240px] truncate text-[11px] font-medium text-[var(--muted)]">
                              {c._parentName ? `Parent: ${c._parentName}` : c.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{c._slug}</td>
                    <td>
                      <div className="font-bold text-[var(--text)]">
                        {c._products}
                      </div>
                      {c._products > 0 && (
                        <div className="text-[11px] text-[var(--muted)]">
                          {c._publishedProducts} published
                        </div>
                      )}
                    </td>
                    <td>{c.sortOrder ?? 0}</td>
                    <td>
                      <span
                        className={`status ${c._isActive ? "green" : "amber"}`}
                      >
                        {c._status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btnsm"
                          disabled={saving}
                          onClick={() => handleOpenEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btnsm"
                          disabled={saving}
                          onClick={() => handleArchiveToggle(c)}
                        >
                          {c._isActive ? "Archive" : "Activate"}
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
          totalPages={effectiveTotalPages}
          totalItems={effectiveTotalItems}
          pageSize={limit}
          itemLabel="categories"
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingCat ? `Edit "${editingCat._name}"` : "Add Category"}
          size="md"
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="formgroup sm:col-span-2">
                <label>Category name *</label>
                <input
                  id="catName"
                  className="field full"
                  placeholder="e.g. Electronics"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="formgroup">
                <label>Slug (optional)</label>
                <input
                  className="field full"
                  placeholder={toSlugPreview(catName) || "auto-generated"}
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="formgroup">
                <label>Parent category</label>
                <select
                  className="field full"
                  value={catParent}
                  onChange={(e) => setCatParent(e.target.value)}
                  disabled={saving}
                >
                  <option value="">None (Top-level category)</option>
                  {parentOptions.map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {opt._name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formgroup">
                <label>Display order</label>
                <input
                  type="number"
                  className="field full"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="formgroup">
                <label>Emoji icon (optional)</label>
                <input
                  className="field full"
                  placeholder="e.g. 🎧 or 👗"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-3">
              <label className="block text-xs font-bold text-[var(--muted)]">
                Category image
              </label>

              {previewImageSrc && (
                <div className="flex items-center gap-3">
                  <img
                    src={previewImageSrc}
                    alt="Category preview"
                    className="h-12 w-12 rounded-lg border border-[var(--line)] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCatImageFile(null);
                      setCatImageUrl("");
                      setRemoveImage(true);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="btnsm cursor-pointer"
                  >
                    Remove image
                  </button>
                </div>
              )}

              <input
                className="field full"
                placeholder="Paste image URL (https://...) or upload below"
                value={catImageUrl}
                onChange={(e) => {
                  setCatImageUrl(e.target.value);
                  setCatImageFile(null);
                  setRemoveImage(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={saving}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    const msg = "Please select a valid image file (PNG, JPG, WEBP).";
                    setFormError(msg);
                    toast.error(msg);
                    e.target.value = "";
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    const msg = "Category image must be 5MB or smaller.";
                    setFormError(msg);
                    toast.error(msg);
                    e.target.value = "";
                    return;
                  }
                  setFormError("");
                  setCatImageFile(file);
                  setRemoveImage(false);
                }}
                disabled={saving}
                className="block w-full text-xs text-[var(--muted)]"
              />
            </div>

            <div className="formgroup">
              <label>Description</label>
              <textarea
                rows={3}
                className="field full"
                placeholder="Short category summary..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                disabled={saving}
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
              <input
                type="checkbox"
                checked={catActive}
                onChange={(e) => setCatActive(e.target.checked)}
                disabled={saving}
              />
              Active on storefront
            </label>

            {editingCat && confirmDelete && (
              <div className="flex flex-col gap-3 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-[#bd3345]">
                  {editingCat._products > 0
                    ? `"${editingCat._name}" has ${editingCat._products} assigned product(s). Archive instead of deleting.`
                    : `Delete "${editingCat._name}" permanently?`}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  {editingCat._products === 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      loading={saving}
                      onClick={() => handleDeleteCategory(editingCat)}
                    >
                      Confirm Delete
                    </Button>
                  )}
                </div>
              </div>
            )}

            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-3.5 py-2.5 text-xs font-semibold text-[#bd3345]"
              >
                {formError}
              </p>
            )}

            <div className="flex flex-wrap flex-col-reverse gap-2.5 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={handleCloseModal}
              >
                Cancel
              </Button>

              {editingCat && !confirmDelete && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={saving}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              )}

              <Button type="submit" loading={saving}>
                {editingCat ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Categories;
