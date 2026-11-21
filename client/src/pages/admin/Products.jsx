import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import AdminPagination from "../../components/admin/AdminPagination";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const extractImageUrl = (product) => {
  if (!product) return "";
  if (typeof product.thumbnail === "string" && product.thumbnail) {
    return product.thumbnail;
  }
  const first = Array.isArray(product.images) ? product.images[0] : null;
  if (typeof first === "string") return first;
  if (first && typeof first === "object") return first.url || first.secure_url || "";
  return "";
};

const formatStatusLabel = (status, isActive = true) => {
  const s = String(status || "pending_approval")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!isActive && s === "published") return "Disabled";
  if (s === "pending_approval" || s === "pending") return "Pending approval";
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const getStatusBadgeVariant = (status, isActive = true) => {
  const s = String(status || "").toLowerCase();
  if (!isActive || s === "rejected" || s === "disabled") return "danger";
  if (s === "published" || s === "active") return "success";
  if (s === "pending_approval" || s === "pending" || s === "draft") return "warning";
  return "default";
};

const csvCell = (val) => {
  const s = String(val ?? "");
  return `"${s.replace(/"/g, '""')}"`;
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [viewingProduct, setViewingProduct] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    sku: "",
    category: "",
    shortDescription: "",
    description: "",
    isActive: true,
    isFeatured: false,
  });
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stockAdjust, setStockAdjust] = useState({
    quantity: "",
    mode: "delta",
    reason: "",
  });
  const [inventoryInfo, setInventoryInfo] = useState(null);
  const [movements, setMovements] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (stockFilter !== "all") params.stock = stockFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;

      const response =
        statusFilter === "pending_approval" &&
        !search.trim() &&
        stockFilter === "all" &&
        categoryFilter === "all"
          ? await adminService.getPendingProducts(params)
          : await adminService.getAdminProducts(params);

      const data = response?.data ?? response;
      setProducts(Array.isArray(data?.products) ? data.products : []);
      if (data?.summary) setSummary(data.summary);
      if (data?.pagination) {
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load products",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, stockFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchProducts();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [fetchProducts, search]);

  useEffect(() => {
    adminService
      .getCategories({ limit: 100 })
      .then((res) => {
        const list = res?.data?.categories || res?.data || [];
        if (Array.isArray(list)) setCategories(list);
      })
      .catch(() => {});
  }, []);

  const rows = useMemo(() => {
    return (Array.isArray(products) ? products : []).map((p, i) => {
      const key = p._id || p.id || `prod-${i}`;
      const name = p.name || p.productName || p.title || "Product";
      const categoryName =
        p.category?.name || p.categoryName || p.cat || "Uncategorized";
      const categoryId =
        typeof p.category === "object" ? p.category?._id || "" : p.category || "";
      const price = p.sellingPrice ?? p.salePrice ?? p.price ?? 0;
      const vendorName =
        p.vendorId?.storeName ||
        p.vendor?.storeName ||
        p.vendor?.shopName ||
        p.vendorName ||
        p.storeName ||
        "Unassigned";
      const desc =
        p.description ||
        p.shortDescription ||
        "No description provided.";
      const isActive = p.isActive !== false;
      const canonicalStatus = String(p.status || "pending_approval")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
      const statusLabel = formatStatusLabel(canonicalStatus, isActive);
      const imageUrl = extractImageUrl(p);

      return {
        ...p,
        _key: key,
        _name: name,
        _category: categoryName,
        _categoryId: categoryId,
        _price: price,
        _vendor: vendorName,
        _desc: desc,
        _isActive: isActive,
        _canonicalStatus: canonicalStatus,
        _status: statusLabel,
        _image: imageUrl,
      };
    });
  }, [products]);

  const hydrateEditForm = (product) => ({
    name: product.name || product._name || "",
    price: String(product.price ?? product._price ?? 0),
    compareAtPrice: String(product.compareAtPrice ?? 0),
    stock: String(product.stock ?? 0),
    sku: product.sku || "",
    category:
      (typeof product.category === "object"
        ? product.category?._id
        : product.category) ||
      product._categoryId ||
      "",
    shortDescription: product.shortDescription || "",
    description: product.description || product._desc || "",
    isActive: product.isActive !== false,
    isFeatured: Boolean(product.isFeatured),
  });

  const refreshInventoryDetails = async (productId) => {
    const [invRes, movRes] = await Promise.allSettled([
      adminService.getInventoryByProductId(productId),
      adminService.getInventoryMovements(productId, { limit: 6 }),
    ]);
    if (invRes.status === "fulfilled") {
      setInventoryInfo(invRes.value?.data ?? invRes.value);
    }
    if (movRes.status === "fulfilled") {
      const movData = movRes.value?.data ?? movRes.value;
      setMovements(Array.isArray(movData) ? movData : movData?.movements || []);
    }
  };

  const handleOpenView = async (row) => {
    setViewingProduct(row);
    setEditMode(false);
    setRejectMode(false);
    setConfirmDelete(false);
    setRejectReason(row.rejectionReason || "");
    setStockAdjust({ quantity: "", mode: "delta", reason: "" });
    setInventoryInfo(null);
    setMovements([]);
    setEditForm(hydrateEditForm(row));

    if (row._id) {
      try {
        setDetailsLoading(true);
        const [prodRes, invRes, movRes] = await Promise.allSettled([
          adminService.getProductById(row._id),
          adminService.getInventoryByProductId(row._id),
          adminService.getInventoryMovements(row._id, { limit: 6 }),
        ]);

        if (prodRes.status === "fulfilled") {
          const detail = prodRes.value?.data ?? prodRes.value;
          if (detail && typeof detail === "object") {
            const merged = {
              ...row,
              ...detail,
              _name: detail.name || row._name,
              _category: detail.category?.name || detail.categoryName || row._category,
              _price: detail.price ?? row._price,
              _vendor:
                detail.vendorId?.storeName ||
                detail.vendor?.storeName ||
                detail.vendorName ||
                row._vendor,
              _isActive: detail.isActive !== false,
              _canonicalStatus: String(detail.status || row._canonicalStatus).toLowerCase(),
              _status: formatStatusLabel(
                detail.status || row._canonicalStatus,
                detail.isActive !== false,
              ),
              _image: extractImageUrl(detail) || row._image,
            };
            setViewingProduct(merged);
            setEditForm(hydrateEditForm(merged));
          }
        }
        if (invRes.status === "fulfilled") {
          setInventoryInfo(invRes.value?.data ?? invRes.value);
        }
        if (movRes.status === "fulfilled") {
          const movData = movRes.value?.data ?? movRes.value;
          setMovements(Array.isArray(movData) ? movData : movData?.movements || []);
        }
      } catch {
        // Non-blocking enrichment failure
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    if (saving) return;
    setViewingProduct(null);
    setEditMode(false);
    setRejectMode(false);
    setConfirmDelete(false);
  };

  const handleApprove = async (row) => {
    if (!row?._id || saving) return;
    try {
      setSaving(true);
      const res = await adminService.approveProduct(row._id);
      const updated = res?.data ?? res;
      toast.success("Product approved & published");
      if (viewingProduct?._id === row._id && updated && typeof updated === "object") {
        setViewingProduct((prev) =>
          prev
            ? {
                ...prev,
                ...updated,
                _isActive: true,
                _canonicalStatus: "published",
                _status: "Published",
              }
            : prev,
        );
      }
      await fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve product");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!viewingProduct?._id || saving) return;
    const reason = rejectReason.trim() || "Product rejected by admin moderation";

    try {
      setSaving(true);
      await adminService.rejectProduct(viewingProduct._id, reason);
      toast.success("Product rejected");
      setViewingProduct(null);
      setRejectMode(false);
      await fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject product");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (targetRow = viewingProduct) => {
    if (!targetRow?._id || saving) return;
    const nextActive = !(targetRow.isActive !== false);

    try {
      setSaving(true);
      const res = await adminService.updateProductStatus(targetRow._id, nextActive);
      const updated = res?.data ?? res;
      toast.success(nextActive ? "Product enabled" : "Product disabled");

      if (viewingProduct?._id === targetRow._id) {
        setViewingProduct((prev) =>
          prev
            ? {
                ...prev,
                ...(updated && typeof updated === "object" ? updated : {}),
                isActive: nextActive,
                _isActive: nextActive,
                _status: formatStatusLabel(
                  updated?.status || prev._canonicalStatus,
                  nextActive,
                ),
              }
            : prev,
        );
      }
      await fetchProducts();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update product status",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProductEdit = async () => {
    if (!viewingProduct?._id || saving) return;
    if (!editForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (Number(editForm.price) < 0 || Number.isNaN(Number(editForm.price))) {
      toast.error("Price must be a valid non-negative number");
      return;
    }
    if (Number(editForm.stock) < 0 || Number.isNaN(Number(editForm.stock))) {
      toast.error("Stock must be a valid non-negative number");
      return;
    }

    try {
      setSaving(true);
      const res = await adminService.updateProduct(viewingProduct._id, {
        name: editForm.name.trim(),
        price: Number(editForm.price),
        compareAtPrice:
          editForm.compareAtPrice === "" ? 0 : Number(editForm.compareAtPrice),
        stock: Number(editForm.stock),
        sku: editForm.sku.trim() || undefined,
        ...(editForm.category ? { category: editForm.category } : {}),
        shortDescription: editForm.shortDescription.trim(),
        description: editForm.description.trim() || viewingProduct._desc,
        isActive: editForm.isActive,
        isFeatured: editForm.isFeatured,
      });

      const updated = res?.data ?? res;
      if (updated && typeof updated === "object") {
        const refreshed = {
          ...viewingProduct,
          ...updated,
          _name: updated.name || editForm.name.trim(),
          _category:
            updated.category?.name || updated.categoryName || viewingProduct._category,
          _price: updated.price ?? Number(editForm.price),
          _vendor:
            updated.vendorId?.storeName ||
            updated.vendor?.storeName ||
            viewingProduct._vendor,
          _desc: updated.description || editForm.description.trim(),
          _isActive: updated.isActive !== false,
          _canonicalStatus: String(updated.status || viewingProduct._canonicalStatus).toLowerCase(),
          _status: formatStatusLabel(
            updated.status || viewingProduct._canonicalStatus,
            updated.isActive !== false,
          ),
        };
        setViewingProduct(refreshed);
        setEditForm(hydrateEditForm(refreshed));
      }

      toast.success("Product updated");
      setEditMode(false);
      await Promise.all([
        fetchProducts(),
        refreshInventoryDetails(viewingProduct._id),
      ]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustInventory = async () => {
    if (!viewingProduct?._id || saving) return;
    if (stockAdjust.quantity === "" || Number.isNaN(Number(stockAdjust.quantity))) {
      toast.error("Please enter a valid stock quantity");
      return;
    }

    try {
      setSaving(true);
      const res = await adminService.adjustInventoryStock(viewingProduct._id, {
        quantity: Number(stockAdjust.quantity),
        mode: stockAdjust.mode,
        reason: stockAdjust.reason.trim() || "Admin stock adjustment",
      });
      const updatedInv = res?.data ?? res;
      const resolvedStock =
        updatedInv?.stock ?? updatedInv?.quantity ?? viewingProduct.stock;

      setInventoryInfo((prev) => ({ ...(prev || {}), ...updatedInv }));
      setViewingProduct((prev) =>
        prev ? { ...prev, stock: resolvedStock } : prev,
      );
      setEditForm((prev) => ({ ...prev, stock: String(resolvedStock) }));
      setStockAdjust({ quantity: "", mode: stockAdjust.mode, reason: "" });
      toast.success(`Stock updated to ${resolvedStock}`);

      await Promise.all([
        fetchProducts(),
        refreshInventoryDetails(viewingProduct._id),
      ]);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to adjust inventory",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!viewingProduct?._id || saving) return;

    try {
      setSaving(true);
      await adminService.deleteProduct(viewingProduct._id);
      toast.success("Product deleted");
      setViewingProduct(null);
      setConfirmDelete(false);
      if (page > 1 && rows.length <= 1) {
        setPage((p) => p - 1);
      } else {
        await fetchProducts();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (rows.length === 0) {
      toast.error("No products available to export");
      return;
    }
    const headers = [
      "Name",
      "SKU",
      "Category",
      "Vendor",
      "Price",
      "Stock",
      "Status",
      "Active",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          csvCell(r._name),
          csvCell(r.sku || ""),
          csvCell(r._category),
          csvCell(r._vendor),
          Number(r._price || 0),
          Number(r.stock ?? 0),
          csvCell(r._status),
          r._isActive ? "Yes" : "No",
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products-catalog.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} products`);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setStockFilter("all");
    setCategoryFilter("all");
    setPage(1);
  };

  const statTotal = summary?.total ?? pagination.total ?? rows.length;
  const statPublished =
    summary?.published ??
    rows.filter((r) => r._canonicalStatus === "published" && r._isActive).length;
  const statPending =
    summary?.pendingApproval ??
    rows.filter((r) =>
      ["pending_approval", "pending"].includes(r._canonicalStatus),
    ).length;
  const statLowOrOut =
    summary !== null && summary !== undefined
      ? (summary.lowStock || 0) + (summary.outOfStock || 0)
      : rows.filter((r) => Number(r.stock ?? 0) <= 10).length;

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    stockFilter !== "all" ||
    categoryFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Products</h1>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total products",
            value: statTotal,
            active: statusFilter === "all" && stockFilter === "all",
            onClick: () => {
              setStatusFilter("all");
              setStockFilter("all");
              setPage(1);
            },
          },
          {
            label: "Published",
            value: statPublished,
            active: statusFilter === "published",
            onClick: () => {
              setStatusFilter("published");
              setStockFilter("all");
              setPage(1);
            },
          },
          {
            label: "Pending approval",
            value: statPending,
            active: statusFilter === "pending_approval",
            onClick: () => {
              setStatusFilter("pending_approval");
              setStockFilter("all");
              setPage(1);
            },
          },
          {
            label: "Low / Out of stock",
            value: statLowOrOut,
            active: stockFilter === "low_stock" || stockFilter === "out_of_stock",
            onClick: () => {
              setStatusFilter("all");
              setStockFilter("low_stock");
              setPage(1);
            },
          },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className={`cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-xs transition ${
              card.active
                ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
                : "border-[var(--line)] hover:border-[var(--primary)]/50"
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
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search name, SKU, vendor, category..."
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
            <option value="published">Published</option>
            <option value="pending_approval">Pending approval</option>
            <option value="rejected">Rejected</option>
            <option value="disabled">Disabled</option>
            <option value="draft">Draft</option>
          </select>

          <select
            className="field"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              if (page !== 1) setPage(1);
            }}
          >
            <option value="all">All stock</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock (≤10)</option>
            <option value="out_of_stock">Out of stock</option>
          </select>

          {categories.length > 0 && (
            <select
              className="field"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                if (page !== 1) setPage(1);
              }}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              type="button"
              className="outlinebtn"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          )}

          <button
            type="button"
            className="outlinebtn"
            onClick={handleExportCsv}
          >
            Export CSV
          </button>
        </div>

        <div id="productTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price / Stock</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading products...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    No products match the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const stockCount = Number(p.stock ?? 0);
                  const needsApproval =
                    p._canonicalStatus === "pending_approval" ||
                    p._canonicalStatus === "pending" ||
                    p._canonicalStatus === "draft";
                  const isRejected = p._canonicalStatus === "rejected";

                  return (
                    <tr key={p._key}>
                      <td>
                        <div className="flex items-center gap-3">
                          {p._image ? (
                            <img
                              src={p._image}
                              alt={p._name}
                              className="h-9 w-9 shrink-0 rounded-lg border border-[var(--line)] object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--soft)] text-xs font-extrabold text-[var(--primary)]">
                              {p._name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="max-w-[210px] truncate font-bold text-[var(--text)]">
                              {p._name}
                            </div>
                            <div className="text-[11px] font-medium text-[var(--muted)]">
                              {p.sku || "No SKU"}
                              {p.brand?.name || p.brandName
                                ? ` · ${p.brand?.name || p.brandName}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{p._category}</td>
                      <td>
                        <div className="font-bold text-[var(--text)]">
                          {money(p._price)}
                        </div>
                        <div
                          className={`text-[11px] font-semibold ${
                            stockCount <= 0
                              ? "text-[#bd3345]"
                              : stockCount <= 10
                                ? "text-[#9b6814]"
                                : "text-[#16845b]"
                          }`}
                        >
                          {stockCount <= 0
                            ? "Out of stock"
                            : stockCount <= 10
                              ? `Low: ${stockCount}`
                              : `Stock: ${stockCount}`}
                        </div>
                      </td>
                      <td>{p._vendor}</td>
                      <td>
                        <span
                          className={`status ${
                            !p._isActive || isRejected
                              ? "red"
                              : needsApproval
                                ? "amber"
                                : "green"
                          }`}
                        >
                          {p._status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleOpenView(p)}
                          >
                            View
                          </button>

                          {needsApproval ? (
                            <button
                              type="button"
                              className="btnsm primary"
                              disabled={saving}
                              onClick={() => handleApprove(p)}
                            >
                              Approve
                            </button>
                          ) : isRejected ? (
                            <button
                              type="button"
                              className="btnsm primary"
                              disabled={saving}
                              onClick={() => handleApprove(p)}
                            >
                              Re-approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btnsm"
                              disabled={saving}
                              onClick={() => handleToggleActive(p)}
                            >
                              {p._isActive ? "Disable" : "Enable"}
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
          currentPage={page}
          totalPages={
            pagination.totalPages ||
            Math.ceil((pagination.total || rows.length) / limit) ||
            1
          }
          totalItems={pagination.total ?? rows.length}
          pageSize={limit}
          itemLabel="products"
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Product View / Edit / Moderate Modal */}
      {viewingProduct && (
        <Modal
          isOpen={Boolean(viewingProduct)}
          onClose={handleCloseModal}
          title={editMode ? "Edit Product" : viewingProduct._name}
          size="lg"
        >
          {!editMode ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[#fcf9fa] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {viewingProduct._image ? (
                    <img
                      src={viewingProduct._image}
                      alt={viewingProduct._name}
                      className="h-16 w-16 shrink-0 rounded-2xl border border-[var(--line)] object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft)] text-xl font-bold text-[var(--primary)]">
                      {viewingProduct._name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[var(--text)]">
                      {viewingProduct._name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      SKU: {viewingProduct.sku || "—"} · Vendor:{" "}
                      {viewingProduct._vendor}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={getStatusBadgeVariant(
                      viewingProduct._canonicalStatus,
                      viewingProduct._isActive,
                    )}
                  >
                    {viewingProduct._status}
                  </Badge>
                  <Badge variant={viewingProduct._isActive ? "success" : "danger"}>
                    {viewingProduct._isActive ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              {detailsLoading && (
                <p className="text-xs font-medium text-[var(--muted)]">
                  Refreshing full product & inventory details...
                </p>
              )}

              {viewingProduct.rejectionReason && (
                <div className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs text-[#bd3345]">
                  <span className="font-bold">Rejection Reason:</span>{" "}
                  {viewingProduct.rejectionReason}
                </div>
              )}

              {/* Info Grid */}
              <div className="grid gap-4 rounded-2xl border border-[var(--line)] p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">Price</p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--text)]">
                    {money(viewingProduct._price)}
                    {Number(viewingProduct.compareAtPrice || 0) >
                    Number(viewingProduct._price || 0) ? (
                      <span className="ml-2 text-xs font-normal text-[var(--muted)] line-through">
                        {money(viewingProduct.compareAtPrice)}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    Current Stock
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--text)]">
                    {inventoryInfo?.stock ??
                      inventoryInfo?.quantity ??
                      viewingProduct.stock ??
                      0}{" "}
                    units
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    Category & Brand
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                    {viewingProduct._category}
                    {viewingProduct.brand?.name || viewingProduct.brandName
                      ? ` · ${viewingProduct.brand?.name || viewingProduct.brandName}`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    Vendor Store
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                    {viewingProduct._vendor}
                    {viewingProduct.vendor?.email || viewingProduct.vendorId?.email
                      ? ` (${viewingProduct.vendor?.email || viewingProduct.vendorId?.email})`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    Rating & Flags
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text)]">
                    ★ {Number(viewingProduct.rating || 0).toFixed(1)} (
                    {viewingProduct.numReviews || 0} reviews)
                    {viewingProduct.isFeatured ? " · Featured" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    Description
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text)]">
                    {viewingProduct.description || viewingProduct._desc}
                  </p>
                </div>
              </div>

              {/* Inventory Adjustment */}
              <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[#fcf9fa] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Quick Inventory Adjustment
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <select
                    className="field full"
                    value={stockAdjust.mode}
                    onChange={(e) =>
                      setStockAdjust((prev) => ({
                        ...prev,
                        mode: e.target.value,
                      }))
                    }
                  >
                    <option value="delta">Add / Subtract (±)</option>
                    <option value="set">Set Exact Stock</option>
                  </select>

                  <input
                    type="number"
                    className="field full"
                    placeholder={stockAdjust.mode === "delta" ? "e.g. 10 or -5" : "e.g. 25"}
                    value={stockAdjust.quantity}
                    onChange={(e) =>
                      setStockAdjust((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                  />

                  <input
                    className="field full sm:col-span-2"
                    placeholder="Reason (e.g. Restock / Audit)"
                    value={stockAdjust.reason}
                    onChange={(e) =>
                      setStockAdjust((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[var(--muted)]">
                    {movements.length > 0 && (
                      <span>
                        Last movement: {movements[0].type} (
                        {movements[0].quantity > 0
                          ? `+${movements[0].quantity}`
                          : movements[0].quantity}
                        : {movements[0].reason})
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={saving}
                    onClick={handleAdjustInventory}
                  >
                    Apply Stock Update
                  </Button>
                </div>
              </div>

              {/* Inline Reject Box */}
              {rejectMode && (
                <div className="space-y-3 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] p-4">
                  <label className="block text-xs font-bold text-[#bd3345]">
                    Rejection Reason
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Incomplete product images or description",
                      "Invalid pricing or duplicate SKU",
                      "Policy / restricted item violation",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectReason(preset)}
                        className="cursor-pointer rounded-full border border-[#f3cbd0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#bd3345] hover:bg-[#ffe3e6]"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    disabled={saving}
                    placeholder="Reason visible to vendor..."
                    className="w-full rounded-xl border border-[#f3cbd0] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => setRejectMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      loading={saving}
                      onClick={handleReject}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {/* Inline Delete Confirmation */}
              {confirmDelete && (
                <div className="flex flex-col gap-3 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-[#bd3345]">
                    Delete &ldquo;{viewingProduct._name}&rdquo; permanently? Inventory record will also be removed.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Keep
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      loading={saving}
                      onClick={handleDeleteProduct}
                    >
                      Confirm Delete
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap flex-col-reverse gap-2.5 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleCloseModal}
                >
                  Close
                </Button>

                {!confirmDelete && (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={saving}
                    onClick={() => {
                      setRejectMode(false);
                      setConfirmDelete(true);
                    }}
                  >
                    Delete
                  </Button>
                )}

                {viewingProduct._canonicalStatus !== "rejected" && !rejectMode && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setConfirmDelete(false);
                      setRejectMode(true);
                    }}
                  >
                    Reject
                  </Button>
                )}

                {(viewingProduct._canonicalStatus !== "published" ||
                  !viewingProduct._isActive) && (
                  <Button
                    type="button"
                    variant="success"
                    loading={saving}
                    onClick={() => handleApprove(viewingProduct)}
                  >
                    {viewingProduct._canonicalStatus === "rejected"
                      ? "Re-approve & Publish"
                      : "Approve & Publish"}
                  </Button>
                )}

                {viewingProduct._canonicalStatus === "published" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => handleToggleActive(viewingProduct)}
                  >
                    {viewingProduct._isActive ? "Disable" : "Enable"}
                  </Button>
                )}

                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setEditForm(hydrateEditForm(viewingProduct));
                    setEditMode(true);
                  }}
                >
                  Edit Product
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="formgroup">
                  <label>Product name *</label>
                  <input
                    className="field full"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>SKU</label>
                  <input
                    className="field full"
                    value={editForm.sku}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, sku: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    className="field full"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Compare at price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="field full"
                    value={editForm.compareAtPrice}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        compareAtPrice: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Stock</label>
                  <input
                    type="number"
                    min="0"
                    className="field full"
                    value={editForm.stock}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, stock: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Category</label>
                  <select
                    className="field full"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    <option value="">Keep current category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="formgroup">
                <label>Short description</label>
                <input
                  className="field full"
                  value={editForm.shortDescription}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="formgroup">
                <label>Description</label>
                <textarea
                  rows={3}
                  className="field full"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Active in storefront
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        isFeatured: e.target.checked,
                      }))
                    }
                  />
                  Featured product
                </label>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  loading={saving}
                  onClick={handleSaveProductEdit}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Products;
