import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import orderService from "../../services/order.service";

const INITIAL_DEMO_ORDERS = [
  { id: "#SS-10482", customer: "Riya Sharma", date: "11 Nov 2026", amount: 4298, status: "Processing" },
  { id: "#SS-10481", customer: "Arjun Verma", date: "10 Nov 2026", amount: 1899, status: "Shipped" },
  { id: "#SS-10480", customer: "Neha Singh", date: "09 Nov 2026", amount: 3499, status: "Delivered" },
  { id: "#SS-10479", customer: "Kabir Das", date: "08 Nov 2026", amount: 1299, status: "Pending" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatStatusLabel = (s) =>
  String(s || "Processing")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const formatOrderDate = (date) => {
  if (!date) return "11 Nov 2026";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClass = (s) =>
  s === "Delivered" || s === "Active" || s === "Resolved" || s === "Published"
    ? "green"
    : s === "Pending" || s === "Processing" || s === "Confirmed" || s === "Packed" || s === "Open"
      ? "amber"
      : s === "Blocked" || s === "Cancelled" || s === "Rejected" || s === "Refunded"
        ? "red"
        : "";

const Orders = ({ orders: propOrders = [] }) => {
  const [apiOrders, setApiOrders] = useState([]);
  const [loading, setLoading] = useState(!propOrders?.length);
  const [demoOrders, setDemoOrders] = useState(INITIAL_DEMO_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("Processing");
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getVendorOrders({ limit: 50 });
      const list = res?.data?.orders || res?.data || res?.orders || [];
      if (Array.isArray(list) && list.length > 0) {
        setApiOrders(list);
      }
    } catch (err) {
      console.error("Vendor orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propOrders || propOrders.length === 0) {
      fetchOrders();
    }
  }, [propOrders]);

  const rows = useMemo(() => {
    const source = propOrders.length > 0 ? propOrders : (apiOrders.length > 0 ? apiOrders : demoOrders);
    return source.map((o, i) => ({
      _raw: o,
      orderId: o._id || o.id,
      id:
        o.orderNumber ||
        o.id ||
        (o._id ? `#SS-${String(o._id).slice(-5).toUpperCase()}` : `#SS-${10482 - i}`),
      customer:
        o.customer?.fullName ||
        o.customer?.name ||
        o.userId?.name ||
        o.user?.fullName ||
        (typeof o.customer === "string" ? o.customer : "Customer"),
      date: o.date || formatOrderDate(o.createdAt),
      amount: o.amount ?? o.totalAmount ?? 0,
      status: formatStatusLabel(o.status || o.orderStatus || "Processing"),
    }));
  }, [propOrders, apiOrders, demoOrders]);

  const filtered = useMemo(() => {
    return rows.filter((o) => {
      if (
        statusFilter !== "All statuses" &&
        o.status.toLowerCase() !== statusFilter.toLowerCase()
      ) {
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
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Processing</option>
            <option>Packed</option>
            <option>Shipped</option>
            <option>Out For Delivery</option>
            <option>Delivered</option>
            <option>Cancelled</option>
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
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Processing</option>
              <option>Packed</option>
              <option>Shipped</option>
              <option>Out For Delivery</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
            <button
              type="button"
              className="primarybtn"
              style={{ marginTop: "12px" }}
              disabled={saving}
              onClick={async () => {
                if (updatingOrder?._raw?._id) {
                  try {
                    setSaving(true);
                    await orderService.updateOrderStatus(updatingOrder._raw._id, newStatus);
                    toast.success("Order updated");
                    setUpdatingOrder(null);
                    await fetchOrders();
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Failed to update order");
                  } finally {
                    setSaving(false);
                  }
                  return;
                }

                setDemoOrders((prev) =>
                  prev.map((x) =>
                    x.id === updatingOrder.id ? { ...x, status: newStatus } : x,
                  ),
                );
                setUpdatingOrder(null);
                toast.success("Order updated");
              }}
            >
              {saving ? "Saving..." : "Save status"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
