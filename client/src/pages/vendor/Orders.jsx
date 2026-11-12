import { useMemo, useState } from "react";
import { toast } from "sonner";

const INITIAL_DEMO_ORDERS = [
  { id: "#SS-10482", customer: "Riya Sharma", date: "11 Nov 2026", amount: 4298, status: "Processing" },
  { id: "#SS-10481", customer: "Arjun Verma", date: "10 Nov 2026", amount: 1899, status: "Shipped" },
  { id: "#SS-10480", customer: "Neha Singh", date: "09 Nov 2026", amount: 3499, status: "Delivered" },
  { id: "#SS-10479", customer: "Kabir Das", date: "08 Nov 2026", amount: 1299, status: "Pending" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const statusClass = (s) =>
  s === "Delivered" || s === "Active" || s === "Resolved" || s === "Published"
    ? "green"
    : s === "Pending" || s === "Processing" || s === "Open"
      ? "amber"
      : s === "Blocked" || s === "Cancelled" || s === "Rejected"
        ? "red"
        : "";

const Orders = ({ orders: propOrders = [] }) => {
  const [demoOrders, setDemoOrders] = useState(INITIAL_DEMO_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("Processing");

  const rows = useMemo(() => {
    const source = propOrders.length > 0 ? propOrders : demoOrders;
    return source.map((o, i) => ({
      id:
        o.id ||
        o.orderNumber ||
        (o._id ? `#SS-${String(o._id).slice(-5).toUpperCase()}` : `#SS-${10482 - i}`),
      customer:
        o.customer?.fullName ||
        o.user?.fullName ||
        (typeof o.customer === "string" ? o.customer : "Customer"),
      date: o.date || "11 Nov 2026",
      amount: o.amount ?? o.totalAmount ?? 0,
      status: o.status || o.orderStatus || "Processing",
    }));
  }, [propOrders, demoOrders]);

  const filtered = useMemo(() => {
    return rows.filter((o) => {
      if (statusFilter !== "All statuses" && o.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const text = `${o.id} ${o.customer} ${o.date} ${o.status}`.toLowerCase();
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
          <h1>Orders</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All statuses</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
          </select>
        </div>

        <div id="vendorOrderTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{o.date}</td>
                  <td>{money(o.amount)}</td>
                  <td>
                    <span className={`status ${statusClass(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => {
                        setUpdatingOrder(o);
                        setNewStatus(o.status);
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

      {updatingOrder && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUpdatingOrder(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Update fulfilment</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setUpdatingOrder(null)}
              >
                ✕
              </button>
            </div>
            <label>New status</label>
            <select
              className="field full"
              style={{ marginTop: "6px" }}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
            <button
              type="button"
              className="primarybtn"
              style={{ marginTop: "12px" }}
              onClick={() => {
                setDemoOrders((prev) =>
                  prev.map((x) =>
                    x.id === updatingOrder.id ? { ...x, status: newStatus } : x,
                  ),
                );
                setUpdatingOrder(null);
                toast.success("Order updated");
              }}
            >
              Save status
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
