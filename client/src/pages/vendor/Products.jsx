import { useMemo, useState } from "react";
import { toast } from "sonner";

const DEMO_VENDOR_PRODUCTS = [
  { name: "Classic Leather Tote", cat: "Fashion", price: 2499, stock: 24, status: "Published", statusClass: "green" },
  { name: "Aura Ceramic Table Lamp", cat: "Home & Living", price: 1899, stock: 8, status: "Published", statusClass: "green" },
  { name: "Studio Wireless Headphones", cat: "Electronics", price: 3499, stock: 36, status: "Published", statusClass: "green" },
  { name: "Minimal Gold Watch", cat: "Accessories", price: 2799, stock: 12, status: "Published", statusClass: "green" },
  { name: "Botanical Skin Care Set", cat: "Beauty", price: 1299, stock: 4, status: "Low stock", statusClass: "amber" },
  { name: "Everyday Sneakers", cat: "Fashion", price: 2199, stock: 19, status: "Published", statusClass: "green" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const Products = ({ products = [] }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [modalTitle, setModalTitle] = useState("");

  const rows = useMemo(() => {
    const source = products.length > 0 ? products : DEMO_VENDOR_PRODUCTS;
    return source.map((p, i) => {
      const name = p.name || "Product";
      const cat = p.cat || p.category?.name || p.category || "General";
      const price = p.price ?? 0;
      const stock = p.stock ?? [24, 8, 36, 12, 4, 19][i % 6];
      const status =
        p.status || (stock <= 5 ? "Low stock" : "Published");
      const statusClass =
        p.statusClass || (status === "Low stock" ? "amber" : "green");

      return {
        ...p,
        _name: name,
        _cat: cat,
        _price: price,
        _stock: stock,
        _status: status,
        _statusClass: statusClass,
      };
    });
  }, [products]);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (
        statusFilter !== "All statuses" &&
        p._status.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }
      if (search.trim()) {
        const text = `${p._name} ${p._cat} ${p._status}`.toLowerCase();
        if (!text.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>My products</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search your products..."
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
            <option>Draft</option>
            <option>Pending approval</option>
          </select>
          <button
            type="button"
            className="primarybtn"
            onClick={() => setModalTitle("Add product")}
          >
            + Add product
          </button>
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
              {filtered.map((p, i) => (
                <tr key={p._id || p._name || i}>
                  <td>{p._name}</td>
                  <td>{p._cat}</td>
                  <td>{money(p._price)}</td>
                  <td>{p._stock}</td>
                  <td>
                    <span className={`status ${p._statusClass}`}>
                      {p._status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => setModalTitle("Edit product")}
                    >
                      Edit
                    </button>{" "}
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => toast.success("Product archived")}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalTitle && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalTitle("");
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{modalTitle}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setModalTitle("")}
              >
                ✕
              </button>
            </div>
            <div className="formgroup">
              <label>Product name</label>
              <input className="field full" placeholder="Product name" />
            </div>
            <div className="formgrid" style={{ marginTop: "10px" }}>
              <div className="formgroup">
                <label>Price</label>
                <input className="field full" type="number" placeholder="Price" />
              </div>
              <div className="formgroup">
                <label>Stock</label>
                <input
                  className="field full"
                  type="number"
                  placeholder="Quantity"
                />
              </div>
            </div>
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Description</label>
              <textarea
                className="field full"
                placeholder="Product description"
              />
            </div>
            <button
              type="button"
              className="primarybtn"
              style={{ marginTop: "14px" }}
              onClick={() => {
                setModalTitle("");
                toast.success("Product saved as draft");
              }}
            >
              Save product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
