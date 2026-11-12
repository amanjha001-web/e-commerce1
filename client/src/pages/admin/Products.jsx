import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";

const DEMO_PRODUCTS = [
  {
    id: 1,
    name: "Classic Leather Tote",
    cat: "Fashion",
    price: 2499,
    old: 3299,
    icon: "👜",
    rating: 4.8,
    tag: "BESTSELLER",
    desc: "A refined everyday tote crafted for timeless style and practical elegance.",
    stock: 24,
    sku: "SS-BAG-001",
    isDemo: true,
  },
  {
    id: 2,
    name: "Aura Ceramic Table Lamp",
    cat: "Home & Living",
    price: 1899,
    old: 2499,
    icon: "💡",
    rating: 4.6,
    tag: "NEW",
    desc: "Warm ambient lighting with a minimal ceramic silhouette.",
    stock: 15,
    sku: "SS-LMP-002",
    isDemo: true,
  },
  {
    id: 3,
    name: "Studio Wireless Headphones",
    cat: "Electronics",
    price: 3499,
    old: 4499,
    icon: "🎧",
    rating: 4.7,
    tag: "POPULAR",
    desc: "Immersive sound, soft cushions and all-day comfort.",
    stock: 18,
    sku: "SS-AUD-003",
    isDemo: true,
  },
  {
    id: 4,
    name: "Minimal Gold Watch",
    cat: "Accessories",
    price: 2799,
    old: 3999,
    icon: "⌚",
    rating: 4.5,
    tag: "LIMITED",
    desc: "A sleek gold-tone watch for a polished everyday look.",
    stock: 9,
    sku: "SS-WTC-004",
    isDemo: true,
  },
  {
    id: 5,
    name: "Botanical Skin Care Set",
    cat: "Beauty",
    price: 1299,
    old: 1799,
    icon: "🧴",
    rating: 4.9,
    tag: "TOP RATED",
    desc: "A gentle daily-care set inspired by botanical ingredients.",
    stock: 32,
    sku: "SS-BTY-005",
    isDemo: true,
  },
  {
    id: 6,
    name: "Everyday Sneakers",
    cat: "Fashion",
    price: 2199,
    old: 2999,
    icon: "👟",
    rating: 4.4,
    tag: "SALE",
    desc: "Lightweight comfort with a clean versatile design.",
    stock: 20,
    sku: "SS-SNK-006",
    isDemo: true,
  },
  {
    id: 7,
    name: "Oak Desk Organizer",
    cat: "Home & Living",
    price: 899,
    old: 1199,
    icon: "🗃️",
    rating: 4.3,
    tag: "",
    desc: "Keep your workspace tidy with a warm oak finish.",
    stock: 14,
    sku: "SS-ORG-007",
    isDemo: true,
  },
  {
    id: 8,
    name: "Smart Fitness Band",
    cat: "Electronics",
    price: 1599,
    old: 2199,
    icon: "⌚",
    rating: 4.2,
    tag: "TRENDING",
    desc: "Track your daily activity with a lightweight smart band.",
    stock: 27,
    sku: "SS-BND-008",
    isDemo: true,
  },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [viewingProduct, setViewingProduct] = useState(null);
  const [approvedKeys, setApprovedKeys] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    stock: "",
    sku: "",
    description: "",
  });
  const [rejectReason, setRejectReason] = useState("");
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
      const response =
        statusFilter === "Pending approval"
          ? await adminService.getPendingProducts({ limit: 50 })
          : await adminService.getAdminProducts({ limit: 50 });
      const data = response?.data ?? response;
      if (Array.isArray(data?.products)) {
        setProducts(data.products);
      }
    } catch {
      // Fallback to demo products when unmapped/offline
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const rows = useMemo(() => {
    const source = products.length > 0 ? products : DEMO_PRODUCTS;
    return source.map((p, i) => {
      const key = p._id || p.id || `prod-${i}`;
      const name = p.name || p.productName || p.title || "Product";
      const category =
        p.cat || p.category?.name || p.categoryName || p.category || "General";
      const price = p.sellingPrice ?? p.salePrice ?? p.price ?? 0;
      const vendor =
        p.vendor?.shopName ||
        p.vendor?.fullName ||
        p.vendorName ||
        p.storeName ||
        "Northstar Store";
      const desc =
        p.desc ||
        p.description ||
        p.shortDescription ||
        "A thoughtfully curated everyday product.";

      const statusLabel = approvedKeys[key]
        ? "Published"
        : p.isDemo
          ? i % 3 === 0
            ? "Pending approval"
            : "Published"
          : p.status === "pending_approval" || p.status === "pending"
            ? "Pending approval"
            : p.status === "rejected"
              ? "Rejected"
              : "Published";

      return {
        ...p,
        _key: key,
        _name: name,
        _category: category,
        _price: price,
        _vendor: vendor,
        _desc: desc,
        _status: statusLabel,
      };
    });
  }, [products, approvedKeys]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (
        statusFilter !== "All statuses" &&
        r._status.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }
      if (search.trim()) {
        const text =
          `${r._name} ${r._category} ${r._vendor} ${r._status}`.toLowerCase();
        if (!text.includes(search.trim().toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  const handleOpenView = async (row) => {
    setViewingProduct(row);
    setEditMode(false);
    setRejectReason("");
    setStockAdjust({ quantity: "", mode: "delta", reason: "" });
    setInventoryInfo(null);
    setMovements([]);
    setEditForm({
      name: row._name || "",
      price: String(row._price ?? 0),
      stock: String(row.stock ?? 0),
      sku: row.sku || "",
      description: row._desc || "",
    });

    if (!row.isDemo && row._id) {
      try {
        const [prodRes, invRes, movRes] = await Promise.allSettled([
          adminService.getProductById(row._id),
          adminService.getInventoryByProductId(row._id),
          adminService.getInventoryMovements(row._id, { limit: 5 }),
        ]);

        if (prodRes.status === "fulfilled") {
          const detail = prodRes.value?.data ?? prodRes.value;
          if (detail && typeof detail === "object") {
            setViewingProduct((prev) => (prev ? { ...prev, ...detail } : prev));
            setEditForm({
              name: detail.name || row._name || "",
              price: String(detail.price ?? row._price ?? 0),
              stock: String(detail.stock ?? row.stock ?? 0),
              sku: detail.sku || row.sku || "",
              description: detail.description || row._desc || "",
            });
          }
        }
        if (invRes.status === "fulfilled") {
          setInventoryInfo(invRes.value?.data ?? invRes.value);
        }
        if (movRes.status === "fulfilled") {
          const movData = movRes.value?.data ?? movRes.value;
          setMovements(movData?.movements || []);
        }
      } catch {
        // Ignore detail fetch error
      }
    }
  };

  const handleApprove = async (row) => {
    setApprovedKeys((prev) => ({ ...prev, [row._key]: true }));
    if (!row.isDemo && row._id) {
      try {
        await adminService.approveProduct(row._id);
        toast.success("Product approved");
        fetchProducts();
        return;
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to approve product",
        );
        return;
      }
    }
    toast.success("Product approved");
  };

  const handleReject = async () => {
    if (!viewingProduct) return;
    const reason =
      rejectReason.trim().length >= 5
        ? rejectReason.trim()
        : "Product rejected by admin moderation";
    if (!viewingProduct.isDemo && viewingProduct._id) {
      try {
        setSaving(true);
        await adminService.rejectProduct(viewingProduct._id, reason);
        toast.success("Product rejected");
        setViewingProduct(null);
        fetchProducts();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to reject product");
      } finally {
        setSaving(false);
      }
    } else {
      toast.success("Product rejected");
      setViewingProduct(null);
    }
  };

  const handleToggleActive = async () => {
    if (!viewingProduct) return;
    const nextActive = !(viewingProduct.isActive ?? true);
    if (!viewingProduct.isDemo && viewingProduct._id) {
      try {
        setSaving(true);
        await adminService.updateProductStatus(viewingProduct._id, nextActive);
        toast.success(nextActive ? "Product enabled" : "Product disabled");
        setViewingProduct((prev) =>
          prev ? { ...prev, isActive: nextActive } : prev,
        );
        fetchProducts();
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to update product status",
        );
      } finally {
        setSaving(false);
      }
    } else {
      toast.success(nextActive ? "Product enabled" : "Product disabled");
    }
  };

  const handleSaveProductEdit = async () => {
    if (!viewingProduct) return;
    if (!viewingProduct.isDemo && viewingProduct._id) {
      try {
        setSaving(true);
        await adminService.updateProduct(viewingProduct._id, {
          name: editForm.name.trim(),
          price: Number(editForm.price) || 0,
          stock: Number(editForm.stock) || 0,
          sku: editForm.sku.trim() || undefined,
          description: editForm.description.trim(),
        });
        toast.success("Product updated");
        setEditMode(false);
        fetchProducts();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to update product");
      } finally {
        setSaving(false);
      }
    } else {
      toast.success("Product updated");
      setEditMode(false);
    }
  };

  const handleAdjustInventory = async () => {
    if (!viewingProduct || !stockAdjust.quantity) return;
    if (!viewingProduct.isDemo && viewingProduct._id) {
      try {
        setSaving(true);
        await adminService.adjustInventoryStock(viewingProduct._id, {
          quantity: Number(stockAdjust.quantity),
          mode: stockAdjust.mode,
          reason: stockAdjust.reason.trim() || "Admin stock adjustment",
        });
        toast.success("Inventory stock adjusted");
        setStockAdjust({ quantity: "", mode: "delta", reason: "" });
        fetchProducts();
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to adjust inventory",
        );
      } finally {
        setSaving(false);
      }
    } else {
      toast.success("Inventory stock adjusted");
      setStockAdjust({ quantity: "", mode: "delta", reason: "" });
    }
  };

  const handleDeleteProduct = async () => {
    if (!viewingProduct) return;
    if (
      !window.confirm(`Delete "${viewingProduct._name || "this product"}"?`)
    ) {
      return;
    }
    if (!viewingProduct.isDemo && viewingProduct._id) {
      try {
        setSaving(true);
        await adminService.deleteProduct(viewingProduct._id);
        toast.success("Product deleted");
        setViewingProduct(null);
        fetchProducts();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to delete product");
      } finally {
        setSaving(false);
      }
    } else {
      toast.success("Product deleted");
      setViewingProduct(null);
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Products</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All statuses</option>
            <option>Published</option>
            <option>Pending approval</option>
            <option>Rejected</option>
          </select>
          <button
            type="button"
            className="outlinebtn"
            onClick={() => toast.success("Product export prepared in demo")}
          >
            Export
          </button>
        </div>

        <div id="productTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((p) => (
                <tr key={p._key}>
                  <td>{p._name}</td>
                  <td>{p._category}</td>
                  <td>{money(p._price)}</td>
                  <td>{p._vendor}</td>
                  <td>
                    <span
                      className={`status ${
                        p._status === "Pending approval"
                          ? "amber"
                          : p._status === "Rejected"
                            ? "red"
                            : "green"
                      }`}
                    >
                      {p._status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleOpenView(p)}
                    >
                      View
                    </button>{" "}
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleApprove(p)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingProduct && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingProduct(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{viewingProduct._name}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setViewingProduct(null)}
              >
                ✕
              </button>
            </div>

            {!editMode ? (
              <>
                <p>{viewingProduct.description || viewingProduct._desc}</p>
                <p>
                  <b>Price:</b> {money(viewingProduct._price)} · <b>Stock:</b>{" "}
                  {inventoryInfo?.stock ?? viewingProduct.stock ?? "—"} ·{" "}
                  <b>SKU:</b> {viewingProduct.sku || "—"}
                </p>
                <p>
                  <b>Category:</b> {viewingProduct._category} · <b>Vendor:</b>{" "}
                  {viewingProduct._vendor}
                </p>
                <p>
                  <b>Status:</b>{" "}
                  <span
                    className={`status ${
                      viewingProduct._status === "Pending approval"
                        ? "amber"
                        : viewingProduct._status === "Rejected"
                          ? "red"
                          : "green"
                    }`}
                  >
                    {viewingProduct._status}
                  </span>{" "}
                  · <b>Active:</b>{" "}
                  {viewingProduct.isActive === false ? "Disabled" : "Enabled"}
                </p>

                {movements.length > 0 && (
                  <div className="notice" style={{ marginTop: "10px" }}>
                    <b>Recent stock movements:</b>{" "}
                    {movements
                      .slice(0, 3)
                      .map(
                        (m) =>
                          `${m.type} (${m.quantity > 0 ? `+${m.quantity}` : m.quantity}: ${m.reason})`,
                      )
                      .join(" · ")}
                  </div>
                )}

                <div
                  className="formgrid"
                  style={{ marginTop: "12px", alignItems: "end" }}
                >
                  <div className="formgroup">
                    <label>Adjust stock (qty)</label>
                    <input
                      type="number"
                      className="field full"
                      placeholder="e.g. 10 or -5"
                      value={stockAdjust.quantity}
                      onChange={(e) =>
                        setStockAdjust((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="formgroup">
                    <label>Adjustment reason</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        className="field full"
                        placeholder="Restock / audit"
                        value={stockAdjust.reason}
                        onChange={(e) =>
                          setStockAdjust((prev) => ({
                            ...prev,
                            reason: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="btnsm"
                        disabled={saving}
                        onClick={handleAdjustInventory}
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                </div>

                <div className="formgroup" style={{ marginTop: "10px" }}>
                  <label>Rejection reason (if rejecting)</label>
                  <input
                    className="field full"
                    placeholder="Reason for rejecting product..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    className="btnsm primary"
                    disabled={saving}
                    onClick={() => handleApprove(viewingProduct)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={handleReject}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={handleToggleActive}
                  >
                    {viewingProduct.isActive === false ? "Enable" : "Disable"}
                  </button>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={handleDeleteProduct}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="formgrid">
                  <div className="formgroup">
                    <label>Product name</label>
                    <input
                      className="field full"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="formgroup">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      className="field full"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="formgroup">
                    <label>Stock</label>
                    <input
                      type="number"
                      className="field full"
                      value={editForm.stock}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          stock: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="formgroup">
                    <label>SKU</label>
                    <input
                      className="field full"
                      value={editForm.sku}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          sku: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="formgroup" style={{ marginTop: "10px" }}>
                  <label>Description</label>
                  <textarea
                    className="field full"
                    style={{ width: "100%" }}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    className="primarybtn"
                    disabled={saving}
                    onClick={handleSaveProductEdit}
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="outlinebtn"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
