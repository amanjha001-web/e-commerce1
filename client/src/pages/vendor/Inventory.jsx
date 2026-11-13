import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService from "../../services/inventory.service";

const DEMO_INVENTORY = [
  { name: "Classic Leather Tote", sku: "SS-300", available: 24, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Aura Ceramic Table Lamp", sku: "SS-301", available: 8, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Studio Wireless Headphones", sku: "SS-302", available: 36, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Minimal Gold Watch", sku: "SS-303", available: 12, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Botanical Skin Care Set", sku: "SS-304", available: 4, threshold: 10, status: "Low stock", statusClass: "amber" },
  { name: "Everyday Sneakers", sku: "SS-305", available: 19, threshold: 10, status: "In stock", statusClass: "green" },
];

const Inventory = () => {
  const [apiInventory, setApiInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [qty, setQty] = useState(24);
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getVendorInventory();
      const list = res?.data?.inventory || res?.data || res?.items || [];
      if (Array.isArray(list) && list.length > 0) {
        setApiInventory(list);
      }
    } catch (err) {
      console.error("Failed to fetch vendor inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const items = useMemo(() => {
    if (apiInventory.length > 0) {
      return apiInventory.map((item) => {
        const prod = item.productId || item.product || {};
        const available = item.availableStock ?? item.quantity ?? prod.stockQuantity ?? prod.stock ?? 0;
        const threshold = item.lowStockThreshold ?? item.threshold ?? 10;
        const status = available <= 0 ? "Out of stock" : available <= threshold ? "Low stock" : "In stock";
        const statusClass = available <= 0 ? "red" : available <= threshold ? "amber" : "green";
        return {
          _id: item._id || prod._id,
          productId: prod._id || item.productId,
          name: prod.name || prod.title || "Product SKU",
          sku: prod.sku || item.sku || `SKU-${String(item._id).slice(-4)}`,
          available,
          threshold,
          status,
          statusClass,
        };
      });
    }
    return DEMO_INVENTORY;
  }, [apiInventory]);

  const stats = useMemo(() => {
    const total = items.length;
    const inStock = items.filter((x) => x.status === "In stock").length;
    const lowStock = items.filter((x) => x.status === "Low stock").length;
    const outStock = items.filter((x) => x.status === "Out of stock").length;
    return [
      ["Total SKUs", String(total)],
      ["In stock", String(inStock)],
      ["Low stock", String(lowStock)],
      ["Out of stock", String(outStock)],
    ];
  }, [items]);

  const handleSaveStock = async () => {
    if (!updatingItem) return;
    try {
      setSaving(true);
      const targetId = updatingItem.productId || updatingItem._id;
      if (targetId) {
        await inventoryService.updateVendorInventory(targetId, {
          quantity: Number(qty),
        });
        toast.success("Stock updated successfully");
        await fetchInventory();
      } else {
        toast.success("Stock adjusted");
      }
      setUpdatingItem(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Inventory</h1>
        </div>
      </div>

      <div className="stats">
        {stats.map((x) => (
          <div key={x[0]} className="stat">
            <span className="label">{x[0]}</span>
            <strong>{x[1]}</strong>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Inventory management</h2>

        <div className="tablewrap">
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
              {items.map((item, idx) => (
                <tr key={item._id || item.sku || idx}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.available}</td>
                  <td>{item.threshold}</td>
                  <td>
                    <span className={`status ${item.statusClass}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm cursor-pointer"
                      onClick={() => {
                        setUpdatingItem(item);
                        setQty(item.available);
                      }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {updatingItem && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUpdatingItem(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Update stock</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setUpdatingItem(null)}
              >
                ✕
              </button>
            </div>
            <label>New quantity</label>
            <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
              <input
                className="field"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <button
                type="button"
                className="primarybtn cursor-pointer"
                disabled={saving}
                onClick={handleSaveStock}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
