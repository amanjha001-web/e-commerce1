import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import inventoryService from "../../services/inventory.service";
import AdminPagination from "../../components/admin/AdminPagination";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "In stock", value: "in_stock" },
  { label: "Low stock", value: "low_stock" },
  { label: "Out of stock", value: "out_of_stock" },
];

const SORT_OPTIONS = [
  { label: "Recently updated", value: "latest" },
  { label: "Stock: Low to High", value: "stock_asc" },
  { label: "Stock: High to Low", value: "stock_desc" },
  { label: "Name: A–Z", value: "name_asc" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const Inventory = () => {
  const [apiItems, setApiItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalUnits: 0,
    totalInventoryValue: 0,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stock adjustment modal state
  const [updatingItem, setUpdatingItem] = useState(null);
  const [adjustMode, setAdjustMode] = useState("set"); // "set" | "add" | "deduct"
  const [qty, setQty] = useState("0");
  const [thresholdInput, setThresholdInput] = useState("10");
  const [reasonInput, setReasonInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Stock movement history modal state
  const [historyItem, setHistoryItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadInventory = useCallback(
    async (opts = {}) => {
      const targetPage = opts.page ?? page;
      const targetLimit = opts.limit ?? limit;
      const targetSearch = opts.search ?? search;
      const targetStatus = opts.status ?? statusFilter;
      const targetSort = opts.sortBy ?? sortBy;

      try {
        setLoading(true);
        setError("");
        const res = await inventoryService.getVendorInventory({
          page: targetPage,
          limit: targetLimit,
          search: targetSearch.trim() || undefined,
          status: targetStatus !== "all" ? targetStatus : undefined,
          sortBy: targetSort,
        });

        const payload = res?.data ?? res;
        const list = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.inventory)
            ? payload.inventory
            : Array.isArray(payload)
              ? payload
              : [];
        const pag = payload?.pagination || {};
        const sum = payload?.summary || null;

        setApiItems(list);
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
        setError(
          err?.response?.data?.message || err?.message || "Failed to load vendor inventory",
        );
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter, sortBy],
  );

  useEffect(() => {
    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      loadInventory();
    }, delay);
    return () => clearTimeout(timer);
  }, [loadInventory, search]);

  const items = useMemo(() => {
    return apiItems.map((item) => {
      const prod =
        item.productId && typeof item.productId === "object"
          ? item.productId
          : item.product && typeof item.product === "object"
            ? item.product
            : {};
      const productId = prod._id || item.productId || item._id;
      const quantity = Number(item.quantity ?? prod.stock ?? 0);
      const reserved = Number(item.reservedQuantity ?? 0);
      const available = Number(
        item.availableStock ?? Math.max(0, quantity - reserved),
      );
      const threshold = Number(item.lowStockThreshold ?? item.threshold ?? 10);
      const status =
        available <= 0
          ? "Out of stock"
          : available <= threshold
            ? "Low stock"
            : "In stock";
      const statusClass =
        available <= 0 ? "red" : available <= threshold ? "amber" : "green";
      const imageUrl = prod.images?.[0]?.url || prod.images?.[0]?.secure_url || "";

      return {
        _id: item._id || productId,
        productId,
        name: prod.name || prod.title || "Product SKU",
        categoryName: prod.category?.name || "",
        sku: prod.sku || item.sku || "No SKU",
        price: Number(prod.price || 0),
        image: imageUrl,
        quantity,
        reserved,
        available,
        threshold,
        status,
        statusClass,
      };
    });
  }, [apiItems]);

  const statCards = [
    {
      label: "Total SKUs",
      value: Number(summary.total ?? pagination.total ?? 0).toLocaleString("en-IN"),
      sub: `${Number(summary.totalUnits || 0).toLocaleString("en-IN")} total units · ${money(summary.totalInventoryValue || 0)}`,
      filter: "all",
      tone: "var(--primary)",
    },
    {
      label: "In stock",
      value: Number(summary.inStock ?? 0).toLocaleString("en-IN"),
      sub: "Healthy stock level",
      filter: "in_stock",
      tone: "var(--green)",
    },
    {
      label: "Low stock",
      value: Number(summary.lowStock ?? 0).toLocaleString("en-IN"),
      sub: "At or below threshold",
      filter: "low_stock",
      tone: "#b45309",
    },
    {
      label: "Out of stock",
      value: Number(summary.outOfStock ?? 0).toLocaleString("en-IN"),
      sub: "Needs restock",
      filter: "out_of_stock",
      tone: "var(--red)",
    },
  ];

  const openUpdateModal = (item) => {
    setUpdatingItem(item);
    setAdjustMode("set");
    setQty(String(item.quantity));
    setThresholdInput(String(item.threshold));
    setReasonInput("");
  };

  const previewStock = useMemo(() => {
    if (!updatingItem) return 0;
    const val = Number(qty || 0);
    if (!Number.isFinite(val)) return updatingItem.quantity;
    if (adjustMode === "add") return updatingItem.quantity + Math.trunc(val);
    if (adjustMode === "deduct") return updatingItem.quantity - Math.trunc(val);
    return Math.trunc(val);
  }, [updatingItem, adjustMode, qty]);

  const handleSaveStock = async (event) => {
    event.preventDefault();
    if (!updatingItem?.productId || saving) return;

    const numQty = Number(qty);
    const numThreshold = Number(thresholdInput);
    if (!Number.isInteger(numQty) || numQty < 0) {
      toast.error("Quantity must be a whole number (0 or greater)");
      return;
    }
    if (!Number.isInteger(numThreshold) || numThreshold < 0) {
      toast.error("Threshold must be 0 or greater");
      return;
    }
    if (previewStock < 0) {
      toast.error("Resulting stock cannot be negative");
      return;
    }

    const payload =
      adjustMode === "set"
        ? {
            mode: "set",
            quantity: numQty,
            lowStockThreshold: numThreshold,
            reason: reasonInput.trim() || "Direct stock update by vendor",
          }
        : {
            mode: "delta",
            quantity: adjustMode === "add" ? numQty : -numQty,
            lowStockThreshold: numThreshold,
            reason:
              reasonInput.trim() ||
              (adjustMode === "add" ? "Vendor stock restock" : "Vendor stock deduction"),
          };

    try {
      setSaving(true);
      await inventoryService.updateVendorInventory(updatingItem.productId, payload);
      toast.success("Inventory updated successfully");
      setUpdatingItem(null);
      await loadInventory();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update inventory");
    } finally {
      setSaving(false);
    }
  };

  const openHistoryModal = async (item) => {
    if (!item?.productId) return;
    setHistoryItem(item);
    setMovements([]);
    try {
      setHistoryLoading(true);
      const res = await inventoryService.getVendorMovements(item.productId, { limit: 30 });
      const list = res?.data || res || [];
      setMovements(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load movement history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const tabCounts = {
    all: summary.total,
    in_stock: summary.inStock,
    low_stock: summary.lowStock,
    out_of_stock: summary.outOfStock,
  };

  return (
    <div>
      <div className="pagehead flex-wrap gap-3">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Inventory</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => loadInventory()}
            className="outlinebtn cursor-pointer disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <Link to="/vendor/products/add" className="primarybtn inline-block">
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
            onClick={() => loadInventory()}
            className="btnsm text-[var(--red)]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="stats">
        {statCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => {
              setStatusFilter(card.filter);
              setPage(1);
            }}
            className="stat cursor-pointer text-left transition hover:-translate-y-0.5"
          >
            <span className="label">{card.label}</span>
            <strong>{loading && !apiItems.length ? "—" : card.value}</strong>
            <span className="trend" style={{ color: card.tone }}>
              {card.sub}
            </span>
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const count = tabCounts[tab.value];
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
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
            placeholder="Search by product name, SKU, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="field"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            aria-label="Sort inventory"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div id="vendorInventoryTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Available</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading inventory...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    <p className="mb-3 font-medium">
                      {search.trim() || statusFilter !== "all"
                        ? "No inventory items match your filter."
                        : "No products in your inventory yet."}
                    </p>
                    <Link to="/vendor/products/add" className="primarybtn inline-block">
                      + Add your first product
                    </Link>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id || item.productId}>
                    <td>
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-9 w-9 shrink-0 rounded-lg border border-[var(--line)] object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--soft)] text-xs font-extrabold text-[var(--primary)]">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/vendor/products/edit/${item.productId}`}
                            className="block max-w-[220px] truncate font-bold text-[var(--text)] hover:text-[var(--primary)] hover:underline"
                          >
                            {item.name}
                          </Link>
                          <div className="text-[11px] font-medium text-[var(--muted)]">
                            {item.categoryName ? `${item.categoryName} · ` : ""}
                            {money(item.price)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{item.sku}</td>
                    <td>
                      <span className="font-bold text-[var(--text)]">{item.available}</span>
                      {item.reserved > 0 && (
                        <div className="text-[11px] text-[var(--muted)]">
                          ({item.reserved} reserved)
                        </div>
                      )}
                    </td>
                    <td>{item.threshold}</td>
                    <td>
                      <span className={`status ${item.statusClass}`}>{item.status}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btnsm cursor-pointer"
                          onClick={() => openUpdateModal(item)}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="btnsm cursor-pointer"
                          onClick={() => openHistoryModal(item)}
                        >
                          History
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
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          itemLabel="SKUs"
          loading={loading}
          onPageChange={(nextPage) => setPage(nextPage)}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {updatingItem && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setUpdatingItem(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Update stock · {updatingItem.name}</h2>
              <button
                type="button"
                className="iconbtn"
                disabled={saving}
                onClick={() => setUpdatingItem(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-3">
              <div className="flex gap-2">
                {[
                  { label: "Set exact", value: "set" },
                  { label: "+ Add stock", value: "add" },
                  { label: "− Deduct", value: "deduct" },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setAdjustMode(m.value);
                      setQty(m.value === "set" ? String(updatingItem.quantity) : "1");
                    }}
                    className={`btnsm flex-1 cursor-pointer ${adjustMode === m.value ? "primary" : ""}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="formgrid">
                <div className="formgroup">
                  <label htmlFor="invQtyInput">
                    {adjustMode === "set"
                      ? "New stock quantity"
                      : adjustMode === "add"
                        ? "Units to add"
                        : "Units to deduct"}
                  </label>
                  <input
                    id="invQtyInput"
                    className="field full"
                    type="number"
                    min="0"
                    step="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                  />
                </div>

                <div className="formgroup">
                  <label htmlFor="invThresholdInput">Low stock threshold</label>
                  <input
                    id="invThresholdInput"
                    className="field full"
                    type="number"
                    min="0"
                    step="1"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg bg-[var(--soft)] px-3 py-2 text-xs font-bold text-[var(--text)]">
                Current: {updatingItem.quantity} → New total:{" "}
                <span className={previewStock < 0 ? "text-[var(--red)]" : "text-[var(--primary)]"}>
                  {previewStock}
                </span>
              </div>

              <div className="formgroup">
                <label htmlFor="invReasonInput">Reason (Optional)</label>
                <input
                  id="invReasonInput"
                  className="field full"
                  placeholder="e.g. New warehouse batch received"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="outlinebtn"
                  disabled={saving}
                  onClick={() => setUpdatingItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primarybtn" disabled={saving}>
                  {saving ? "Saving..." : "Save update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyItem && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryItem(null);
          }}
        >
          <div className="modal" style={{ maxWidth: "620px" }}>
            <div className="modalhead">
              <h2>Stock movement history · {historyItem.name}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setHistoryItem(null)}
              >
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-xs text-[var(--muted)]">
                Loading stock movements...
              </div>
            ) : movements.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted)]">
                No stock movements recorded yet for this product.
              </div>
            ) : (
              <div className="tablewrap max-h-[360px] overflow-y-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Change</th>
                      <th>Stock</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((mv, idx) => (
                      <tr key={mv._id || idx}>
                        <td className="text-xs">
                          {mv.createdAt
                            ? new Date(mv.createdAt).toLocaleString("en-IN")
                            : "—"}
                        </td>
                        <td>
                          <span className="status amber">{mv.type || "ADJUSTMENT"}</span>
                        </td>
                        <td
                          className={`font-bold ${
                            Number(mv.quantity) > 0
                              ? "text-[var(--green)]"
                              : Number(mv.quantity) < 0
                                ? "text-[var(--red)]"
                                : ""
                          }`}
                        >
                          {Number(mv.quantity) > 0 ? `+${mv.quantity}` : mv.quantity}
                        </td>
                        <td className="text-xs">
                          {mv.previousStock} → <strong>{mv.newStock}</strong>
                        </td>
                        <td className="text-xs text-[var(--muted)]">
                          {mv.reason || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
