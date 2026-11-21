import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import productService from "../../services/product.service";
import AdminPagination from "../../components/admin/AdminPagination";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Pending approval", value: "pending_approval" },
  { label: "Draft", value: "draft" },
  { label: "Rejected", value: "rejected" },
  { label: "Low stock", value: "low_stock" },
  { label: "Archived", value: "archived" },
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "latest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name: A–Z", value: "name_asc" },
  { label: "Oldest first", value: "oldest" },
];

const STATUS_META = {
  published: { label: "Published", cls: "green" },
  active: { label: "Published", cls: "green" },
  pending_approval: { label: "Pending approval", cls: "amber" },
  pending: { label: "Pending approval", cls: "amber" },
  draft: { label: "Draft", cls: "amber" },
  rejected: { label: "Rejected", cls: "red" },
  archived: { label: "Archived", cls: "" },
  inactive: { label: "Archived", cls: "" },
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const Products = ({ products: propProducts = [] }) => {
  const hasPropProducts = Array.isArray(propProducts) && propProducts.length > 0;

  const [apiProducts, setApiProducts] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
    rejected: 0,
    lowStock: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(!hasPropProducts);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockDraft, setStockDraft] = useState("");
  const [savingStock, setSavingStock] = useState(false);

  const loadProducts = useCallback(
    async (opts = {}) => {
      const targetPage = opts.page ?? page;
      const targetLimit = opts.limit ?? limit;
      const targetSearch = opts.search ?? search;
      const targetStatus = opts.status ?? statusFilter;
      const targetSort = opts.sortBy ?? sortBy;

      try {
        setLoading(true);
        setError("");
        const res = await productService.getVendorProducts({
          page: targetPage,
          limit: targetLimit,
          search: targetSearch.trim() || undefined,
          status: targetStatus !== "all" ? targetStatus : undefined,
          sortBy: targetSort,
        });

        const payload = res?.data ?? res;
        const list = Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload)
            ? payload
            : [];
        const pag = payload?.pagination || {};
        const sum = payload?.summary || null;

        setApiProducts(list);
        setPagination({
          total: Number(pag.total ?? list.length),
          page: Number(pag.page ?? targetPage),
          limit: Number(pag.limit ?? targetLimit),
          totalPages: Math.max(
            1,
            Number(pag.totalPages ?? Math.ceil((pag.total ?? list.length) / targetLimit)),
          ),
        });
        if (sum) {
          setSummary(sum);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to load products";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter, sortBy],
  );

  useEffect(() => {
    if (hasPropProducts) return undefined;
    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      loadProducts();
    }, delay);
    return () => clearTimeout(timer);
  }, [hasPropProducts, loadProducts, search]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const handleDelete = async (product) => {
    if (!product?._id) return;
    if (!window.confirm(`Delete "${product._name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(product._id);
      await productService.deleteProduct(product._id);
      toast.success("Product deleted successfully");
      const nextPage = apiProducts.length <= 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadProducts({ page: nextPage });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete product");
    } finally {
      setDeletingId("");
    }
  };

  const openStockModal = (product) => {
    setStockModalProduct(product);
    setStockDraft(String(product._stock ?? 0));
  };

  const handleSaveStock = async (event) => {
    event.preventDefault();
    if (!stockModalProduct?._id || savingStock) return;
    const nextStock = Number(stockDraft);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      toast.error("Stock must be a whole number (0 or greater)");
      return;
    }
    try {
      setSavingStock(true);
      await productService.updateProductStock(stockModalProduct._id, nextStock);
      toast.success("Stock updated");
      setStockModalProduct(null);
      await loadProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update stock");
    } finally {
      setSavingStock(false);
    }
  };

  const rows = useMemo(() => {
    const source = hasPropProducts ? propProducts : apiProducts;
    return source.map((p) => {
      const name = p.name || p.title || "Product";
      const category = p.category?.name || p.categoryName || (typeof p.category === "string" ? p.category : "General");
      const price = Number(p.price ?? 0);
      const compareAtPrice = Number(p.compareAtPrice ?? 0);
      const stock = Number(p.stockQuantity ?? p.stock ?? 0);
      const rawStatus = String(p.status || "pending_approval").toLowerCase();
      const statusMeta = STATUS_META[rawStatus] || {
        label: rawStatus.replace(/[_-]+/g, " "),
        cls: "",
      };
      const imageUrl = p.images?.[0]?.url || p.images?.[0]?.secure_url || "";

      return {
        ...p,
        _id: p._id || p.id,
        _name: name,
        _cat: category,
        _price: price,
        _compareAtPrice: compareAtPrice,
        _stock: stock,
        _rawStatus: rawStatus,
        _status: statusMeta.label,
        _statusClass: statusMeta.cls,
        _image: imageUrl,
      };
    });
  }, [hasPropProducts, propProducts, apiProducts]);

  const displayedRows = useMemo(() => {
    if (!hasPropProducts) return rows;
    return rows.filter((p) => {
      if (statusFilter === "low_stock" && p._stock > 10) return false;
      if (
        statusFilter !== "all" &&
        statusFilter !== "low_stock" &&
        p._rawStatus !== statusFilter
      ) {
        return false;
      }
      if (search.trim()) {
        const text = `${p._name} ${p._cat} ${p._status} ${p.sku || ""}`.toLowerCase();
        if (!text.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [hasPropProducts, rows, statusFilter, search]);

  const tabCounts = {
    all: summary.total ?? pagination.total,
    published: summary.published,
    pending_approval: summary.pending,
    draft: summary.draft,
    rejected: summary.rejected,
    low_stock: summary.lowStock,
  };

  return (
    <div>
      <div className="pagehead flex-wrap gap-3">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>My products</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => loadProducts()}
            className="outlinebtn cursor-pointer disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <Link
            to="/vendor/products/add"
            className="primarybtn inline-block cursor-pointer text-center"
          >
            + Add product
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 text-xs font-bold text-[var(--red)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadProducts()}
            className="btnsm text-[var(--red)]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="panel">
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const count = tabCounts[tab.value];
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={`btnsm cursor-pointer ${active ? "primary" : ""}`}
              >
                {tab.label}
                {typeof count === "number" ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        <div className="toolbar">
          <input
            className="field"
            placeholder="Search by product name, SKU, or tag..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <select
            className="field"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div id="vendorProductTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading your products...
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    <p className="mb-3 font-medium">
                      {search.trim() || statusFilter !== "all"
                        ? "No products match the selected filters."
                        : "You haven't added any products yet."}
                    </p>
                    <Link to="/vendor/products/add" className="primarybtn inline-block">
                      + Add your first product
                    </Link>
                  </td>
                </tr>
              ) : (
                displayedRows.map((p, i) => (
                  <tr key={p._id || p._name || i}>
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
                          <div className="max-w-[220px] truncate font-bold text-[var(--text)]">
                            {p._name}
                          </div>
                          <div className="text-[11px] font-medium text-[var(--muted)]">
                            {p.sku || "No SKU"}
                            {p.brand?.name ? ` · ${p.brand.name}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{p._cat}</td>
                    <td>
                      <div className="font-bold text-[var(--text)]">{money(p._price)}</div>
                      {p._compareAtPrice > p._price && (
                        <div className="text-[11px] text-[var(--muted)] line-through">
                          {money(p._compareAtPrice)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            p._stock <= 0
                              ? "text-[var(--red)]"
                              : p._stock <= 10
                                ? "text-amber-700"
                                : "text-[var(--text)]"
                          }`}
                        >
                          {p._stock}
                        </span>
                        {p._id && (
                          <button
                            type="button"
                            onClick={() => openStockModal(p)}
                            className="btnsm"
                            title="Quick stock update"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status ${p._statusClass}`}>{p._status}</span>
                      {p._rawStatus === "rejected" && p.rejectionReason && (
                        <div
                          className="mt-1 max-w-[180px] truncate text-[11px] text-[var(--red)]"
                          title={p.rejectionReason}
                        >
                          {p.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/vendor/products/edit/${p._id}`}
                          className="btnsm inline-block"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === p._id}
                          className="btnsm text-[var(--red)] hover:bg-[#fff0f1] disabled:opacity-50"
                          onClick={() => handleDelete(p)}
                        >
                          {deletingId === p._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!hasPropProducts && (
          <AdminPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={limit}
            itemLabel="products"
            loading={loading}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      {stockModalProduct && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingStock) {
              setStockModalProduct(null);
            }
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Update stock · {stockModalProduct._name}</h2>
              <button
                type="button"
                className="iconbtn"
                disabled={savingStock}
                onClick={() => setStockModalProduct(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStock}>
              <div className="formgroup">
                <label htmlFor="quickStockInput">Available quantity</label>
                <input
                  id="quickStockInput"
                  className="field full"
                  type="number"
                  min="0"
                  step="1"
                  value={stockDraft}
                  onChange={(e) => setStockDraft(e.target.value)}
                  required
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="outlinebtn"
                  disabled={savingStock}
                  onClick={() => setStockModalProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primarybtn"
                  disabled={savingStock}
                >
                  {savingStock ? "Saving..." : "Save stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
