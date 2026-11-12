import { useState } from "react";
import { toast } from "sonner";

const DEMO_INVENTORY = [
  { name: "Classic Leather Tote", sku: "SS-300", available: 24, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Aura Ceramic Table Lamp", sku: "SS-301", available: 8, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Studio Wireless Headphones", sku: "SS-302", available: 36, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Minimal Gold Watch", sku: "SS-303", available: 12, threshold: 10, status: "In stock", statusClass: "green" },
  { name: "Botanical Skin Care Set", sku: "SS-304", available: 4, threshold: 10, status: "Low stock", statusClass: "amber" },
  { name: "Everyday Sneakers", sku: "SS-305", available: 19, threshold: 10, status: "In stock", statusClass: "green" },
];

const Inventory = () => {
  const [updatingItem, setUpdatingItem] = useState(null);
  const [qty, setQty] = useState(24);

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Inventory</h1>
        </div>
      </div>

      <div className="stats">
        {[
          ["Total SKUs", "42"],
          ["In stock", "35"],
          ["Low stock", "5"],
          ["Out of stock", "2"],
        ].map((x) => (
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
              {DEMO_INVENTORY.map((item) => (
                <tr key={item.sku}>
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
                      className="btnsm"
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
                className="primarybtn"
                onClick={() => {
                  setUpdatingItem(null);
                  toast.success("Stock updated");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
