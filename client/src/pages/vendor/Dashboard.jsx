import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchVendorDashboard } from "../../store/slices/vendorDashboardSlice";

const DEMO_ORDERS = [
  { id: "#SS-10482", customer: "Riya Sharma", date: "11 Nov 2026", amount: 4298, status: "Processing" },
  { id: "#SS-10481", customer: "Arjun Verma", date: "10 Nov 2026", amount: 1899, status: "Shipped" },
  { id: "#SS-10480", customer: "Neha Singh", date: "09 Nov 2026", amount: 3499, status: "Delivered" },
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

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: dashboardData } = useSelector(
    (state) => state.vendorDashboard || {},
  );

  useEffect(() => {
    dispatch(fetchVendorDashboard());
  }, [dispatch]);

  const stats = dashboardData?.stats;
  const earnings = dashboardData?.earnings;
  const recentOrders =
    Array.isArray(dashboardData?.recentOrders) &&
    dashboardData.recentOrders.length > 0
      ? dashboardData.recentOrders.slice(0, 3).map((o, i) => ({
          id:
            o.orderNumber ||
            (o._id ? `#SS-${String(o._id).slice(-5).toUpperCase()}` : `#SS-${10482 - i}`),
          customer: o.customer?.fullName || o.user?.fullName || "Customer",
          date: o.createdAt
            ? new Date(o.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "11 Nov 2026",
          amount: o.vendorOrderTotal ?? o.totalAmount ?? o.amount ?? 0,
          status: o.orderStatus
            ? String(o.orderStatus).charAt(0).toUpperCase() +
              String(o.orderStatus).slice(1).toLowerCase()
            : "Processing",
        }))
      : DEMO_ORDERS;

  const statItems = [
    [
      "Gross sales",
      stats?.totalSales ? money(stats.totalSales) : "₹84,590",
      "+14.2%",
    ],
    [
      "Orders",
      stats?.totalOrders ? String(stats.totalOrders) : "128",
      "+8 this week",
    ],
    [
      "Products",
      stats?.totalProducts ? String(stats.totalProducts) : "42",
      "3 low stock",
    ],
    [
      "Pending payouts",
      earnings?.pending ? money(earnings.pending) : "₹12,450",
      "Next payout 15 Nov",
    ],
  ];

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Dashboard</h1>
        </div>
      </div>

      <div className="notice" style={{ marginBottom: "16px" }}>
        Your shop is active. Keep your inventory and order status up to date.
      </div>

      <div className="stats">
        {statItems.map((x) => (
          <div key={x[0]} className="stat">
            <span className="label">{x[0]}</span>
            <strong>{x[1]}</strong>
            <span className="trend">{x[2]}</span>
          </div>
        ))}
      </div>

      <div className="twocol">
        <div className="panel">
          <h2>Sales performance</h2>
          <div
            style={{
              height: "170px",
              display: "flex",
              alignItems: "end",
              gap: "12px",
            }}
          >
            {[35, 55, 42, 78, 62, 90, 70, 100].map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${v}%`,
                  background: "linear-gradient(var(--secondary),var(--primary))",
                  borderRadius: "6px 6px 0 0",
                }}
              />
            ))}
          </div>
          <p className="small muted">Last 8 weeks · Demo analytics</p>
        </div>

        <div className="panel">
          <h2>Quick actions</h2>
          <p>
            <button
              type="button"
              className="primarybtn"
              onClick={() => navigate("/vendor/products")}
            >
              Manage products
            </button>
          </p>
          <p>
            <button
              type="button"
              className="outlinebtn"
              onClick={() => navigate("/vendor/orders")}
            >
              View new orders
            </button>
          </p>
          <p>
            <button
              type="button"
              className="outlinebtn"
              onClick={() => navigate("/vendor/earnings")}
            >
              View earnings
            </button>
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>Recent orders</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
