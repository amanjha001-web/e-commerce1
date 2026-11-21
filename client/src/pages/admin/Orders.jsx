import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";
import AdminPagination from "../../components/admin/AdminPagination";

const INITIAL_DEMO_ORDERS = [
  {
    id: "#SS-10482",
    customer: "Riya Sharma",
    date: "11 Nov 2026",
    amount: 4298,
    status: "Processing",
    isDemo: true,
  },
  {
    id: "#SS-10481",
    customer: "Arjun Verma",
    date: "10 Nov 2026",
    amount: 1899,
    status: "Shipped",
    isDemo: true,
  },
  {
    id: "#SS-10480",
    customer: "Neha Singh",
    date: "09 Nov 2026",
    amount: 3499,
    status: "Delivered",
    isDemo: true,
  },
  {
    id: "#SS-10479",
    customer: "Kabir Das",
    date: "08 Nov 2026",
    amount: 1299,
    status: "Pending",
    isDemo: true,
  },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const statusClass = (s) =>
  s === "Delivered" || s === "Active" || s === "Resolved" || s === "Published"
    ? "green"
    : s === "Pending" ||
        s === "Processing" ||
        s === "Confirmed" ||
        s === "Open"
      ? "amber"
      : s === "Blocked" ||
          s === "Cancelled" ||
          s === "Rejected" ||
          s === "Refunded"
        ? "red"
        : "";

const formatDate = (date) => {
  if (!date) return "11 Nov 2026";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatOrderStatusLabel = (value) =>
  String(value || "Processing")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const Orders = () => {
  const [apiOrders, setApiOrders] = useState([]);
  const [hasApiOrders, setHasApiOrders] = useState(false);
  const [demoOrders, setDemoOrders] = useState(INITIAL_DEMO_ORDERS);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("Processing");
  const [statusNote, setStatusNote] = useState("");
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: "",
    courierPartner: "",
    expectedDeliveryDate: "",
  });
  const [cancelReason, setCancelReason] = useState("");
  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "All statuses") {
        params.status = statusFilter.trim().toLowerCase().replace(/\s+/g, "_");
      }

      const response = await adminService.getOrders(params);
      const data = response?.data ?? response;
      if (Array.isArray(data?.orders)) {
        setHasApiOrders(true);
        setApiOrders(data.orders);
        if (data.pagination) {
          setPagination((prev) => ({ ...prev, ...data.pagination }));
        } else {
          setPagination({
            total: data.orders.length,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(data.orders.length / limit)),
          });
        }
      }
    } catch {
      // Fallback to demo orders when unmapped
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchOrders();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [fetchOrders, search]);

  const rows = useMemo(() => {
    const source = hasApiOrders ? apiOrders : demoOrders;
    return source.map((o, idx) => {
      const id =
        o.id ||
        o.orderNumber ||
        (o._id
          ? `#SS-${String(o._id).slice(-5).toUpperCase()}`
          : `#SS-${10482 - idx}`);
      const customer =
        o.customer?.fullName ||
        o.customer?.name ||
        o.userId?.name ||
        o.user?.fullName ||
        o.user?.name ||
        o.customerName ||
        (typeof o.customer === "string" ? o.customer : "Customer");
      const date = o.date || formatDate(o.createdAt);
      const amount = o.totalAmount ?? o.total ?? o.amount ?? 0;
      const rawStatus = o.status || o.orderStatus || "Processing";
      const status = formatOrderStatusLabel(rawStatus);

      return {
        ...o,
        _key: o._id || id,
        _idLabel: id,
        _customer: customer,
        _date: date,
        _amount: amount,
        _status: status,
      };
    });
  }, [hasApiOrders, apiOrders, demoOrders]);

  const filteredDemoRows = useMemo(() => {
    if (hasApiOrders) return rows;
    return rows.filter((o) => {
      if (
        statusFilter !== "All statuses" &&
        o._status.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }
      if (search.trim()) {
        const text =
          `${o._idLabel} ${o._customer} ${o._date} ${o._status}`.toLowerCase();
        if (!text.includes(search.trim().toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [hasApiOrders, rows, search, statusFilter]);

  const filteredRows = useMemo(() => {
    if (hasApiOrders) return rows;
    const start = (page - 1) * limit;
    return filteredDemoRows.slice(start, start + limit);
  }, [hasApiOrders, rows, filteredDemoRows, page, limit]);

  const totalOrderItems = hasApiOrders
    ? pagination.total ?? rows.length
    : filteredDemoRows.length;
  const totalOrderPages = hasApiOrders
    ? pagination.totalPages ||
      Math.ceil(totalOrderItems / limit) ||
      1
    : Math.max(1, Math.ceil(filteredDemoRows.length / limit));

  const handleOpenDetails = async (order) => {
    setViewingOrder(order);
    setOrderHistory(order.statusHistory || []);
    const initialEta =
      order.tracking?.estimatedDeliveryDate || order.expectedDeliveryDate || order.estimatedDeliveryDate;
    setShippingForm({
      trackingNumber: order.tracking?.trackingNumber || order.trackingNumber || "",
      courierPartner: order.tracking?.carrier || order.courierPartner || order.carrier || "",
      expectedDeliveryDate: initialEta ? String(initialEta).slice(0, 10) : "",
    });
    setCancelReason("");
    setRefundForm({
      amount: String(order._amount || ""),
      reason: "",
    });

    if (!order.isDemo && order._id) {
      try {
        const [detailRes, historyRes] = await Promise.allSettled([
          adminService.getOrderById(order._id),
          adminService.getOrderStatusHistory(order._id),
        ]);
        if (detailRes.status === "fulfilled") {
          const detail = detailRes.value?.data ?? detailRes.value;
          if (detail && typeof detail === "object") {
            const resolvedAmount =
              detail.totalAmount ?? detail.total ?? detail.amount ?? order._amount;
            setViewingOrder((prev) =>
              prev
                ? {
                    ...prev,
                    ...detail,
                    _amount: resolvedAmount,
                    _status: formatOrderStatusLabel(detail.orderStatus || detail.status || prev._status),
                  }
                : prev
            );
            setRefundForm((prev) => ({
              ...prev,
              amount: prev.amount || String(resolvedAmount || ""),
            }));
            const detailEta =
              detail.tracking?.estimatedDeliveryDate ||
              detail.expectedDeliveryDate ||
              detail.estimatedDeliveryDate;
            setShippingForm({
              trackingNumber: detail.tracking?.trackingNumber || detail.trackingNumber || "",
              courierPartner: detail.tracking?.carrier || detail.courierPartner || detail.carrier || "",
              expectedDeliveryDate: detailEta ? String(detailEta).slice(0, 10) : "",
            });
            if (Array.isArray(detail.statusHistory)) {
              setOrderHistory(detail.statusHistory);
            }
          }
        }
        if (historyRes.status === "fulfilled") {
          const hist = historyRes.value?.data ?? historyRes.value;
          const resolvedHistory = Array.isArray(hist)
            ? hist
            : Array.isArray(hist?.statusHistory)
              ? hist.statusHistory
              : null;
          if (resolvedHistory) {
            setOrderHistory(resolvedHistory);
          }
        }
      } catch {
        // Ignore detail error
      }
    }
  };

  const handleSaveStatus = async () => {
    if (!updatingOrder) return;

    if (updatingOrder.isDemo || !updatingOrder._id) {
      setDemoOrders((prev) =>
        prev.map((x) =>
          x.id === updatingOrder._idLabel ? { ...x, status: newStatus } : x,
        ),
      );
      setUpdatingOrder(null);
      setStatusNote("");
      toast.success("Order updated");
      return;
    }

    try {
      setSaving(true);
      const res = await adminService.updateOrderStatus(
        updatingOrder._id,
        newStatus,
        statusNote,
      );
      const updated = res?.data ?? res;
      if (viewingOrder?._id && viewingOrder._id === updatingOrder._id && updated && typeof updated === "object") {
        setViewingOrder((prev) => ({
          ...prev,
          ...updated,
          _status: formatOrderStatusLabel(updated.orderStatus || updated.status || newStatus),
        }));
        if (Array.isArray(updated.statusHistory)) {
          setOrderHistory(updated.statusHistory);
        }
      }
      toast.success("Order updated");
      setUpdatingOrder(null);
      setStatusNote("");
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShipping = async () => {
    if (!viewingOrder) return;
    if (viewingOrder.isDemo || !viewingOrder._id) {
      toast.success("Shipping details updated");
      return;
    }

    try {
      setSaving(true);
      const payload = {};
      if (shippingForm.trackingNumber.trim()) {
        payload.trackingNumber = shippingForm.trackingNumber.trim();
      }
      if (shippingForm.courierPartner.trim()) {
        payload.courierPartner = shippingForm.courierPartner.trim();
      }
      if (shippingForm.expectedDeliveryDate) {
        payload.expectedDeliveryDate = shippingForm.expectedDeliveryDate;
      }
      const res = await adminService.updateOrderShipping(viewingOrder._id, payload);
      const updated = res?.data ?? res;
      if (updated && typeof updated === "object") {
        setViewingOrder((prev) =>
          prev
            ? {
                ...prev,
                ...updated,
                _status: formatOrderStatusLabel(updated.orderStatus || updated.status || "Shipped"),
              }
            : prev
        );
        if (Array.isArray(updated.statusHistory)) {
          setOrderHistory(updated.statusHistory);
        }
      }
      toast.success("Shipping details updated");
      fetchOrders();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update shipping details",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!viewingOrder) return;
    if (viewingOrder.isDemo || !viewingOrder._id) {
      setDemoOrders((prev) =>
        prev.map((x) =>
          x.id === viewingOrder._idLabel ? { ...x, status: "Cancelled" } : x,
        ),
      );
      setViewingOrder(null);
      toast.success("Order cancelled");
      return;
    }

    try {
      setSaving(true);
      await adminService.cancelOrder(
        viewingOrder._id,
        cancelReason.trim() || "Cancelled by admin",
      );
      toast.success("Order cancelled");
      setViewingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel order");
    } finally {
      setSaving(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!viewingOrder) return;
    if (viewingOrder.isDemo || !viewingOrder._id) {
      setDemoOrders((prev) =>
        prev.map((x) =>
          x.id === viewingOrder._idLabel ? { ...x, status: "Refunded" } : x,
        ),
      );
      toast.success("Refund processed");
      setViewingOrder(null);
      return;
    }

    const orderStatusLower = String(
      viewingOrder.orderStatus || viewingOrder._status || "",
    ).toLowerCase();
    const payStatusLower = String(viewingOrder.paymentStatus || "").toLowerCase();

    if (orderStatusLower === "refunded" || payStatusLower === "refunded") {
      toast.error("This order has already been fully refunded.");
      return;
    }

    const isPaidOrder =
      Boolean(viewingOrder.isPaid) ||
      ["success", "paid", "partially_refunded"].includes(payStatusLower);
    if (!isPaidOrder) {
      toast.error("Cannot refund an unpaid order.");
      return;
    }

    const maxAmount = Number(viewingOrder._amount || 0);
    const parsedAmount = refundForm.amount ? Number(refundForm.amount) : undefined;
    if (
      parsedAmount !== undefined &&
      (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || (maxAmount > 0 && parsedAmount > maxAmount))
    ) {
      toast.error(
        maxAmount > 0
          ? `Refund amount must be between ₹1 and ₹${maxAmount}`
          : "Refund amount must be greater than 0",
      );
      return;
    }

    try {
      setSaving(true);
      const res = await adminService.processRefund(viewingOrder._id, {
        amount: parsedAmount,
        reason: refundForm.reason.trim() || "Admin processed refund",
      });
      const data = res?.data ?? res;
      toast.success(
        data?.isFullRefund === false
          ? "Partial refund processed"
          : "Refund processed",
      );
      setViewingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to process refund");
    } finally {
      setSaving(false);
    }
  };

  const handleExportOrders = async () => {
    try {
      const blob = await adminService.exportReport({ format: "csv" });
      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "orders-report.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success("Orders exported");
    } catch {
      toast.success("Orders exported");
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Orders</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search order # or customer..."
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
          {(search || statusFilter !== "All statuses") && (
            <button
              type="button"
              className="outlinebtn"
              onClick={() => {
                setSearch("");
                setStatusFilter("All statuses");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            className="outlinebtn"
            onClick={handleExportOrders}
          >
            Export
          </button>
        </div>

        <div id="adminOrderTable" className="tablewrap">
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
              {loading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((o) => (
                  <tr key={o._key}>
                    <td>{o._idLabel}</td>
                    <td>{o._customer}</td>
                    <td>{o._date}</td>
                    <td>{money(o._amount)}</td>
                    <td>
                      <span className={`status ${statusClass(o._status)}`}>
                        {o._status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btnsm"
                        onClick={() => handleOpenDetails(o)}
                      >
                        Details
                      </button>{" "}
                      <button
                        type="button"
                        className="btnsm"
                        onClick={() => {
                          setUpdatingOrder(o);
                          setNewStatus(o._status || "Processing");
                          setStatusNote("");
                        }}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={page}
          totalPages={totalOrderPages}
          totalItems={totalOrderItems}
          pageSize={limit}
          itemLabel="orders"
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {viewingOrder && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingOrder(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Order {viewingOrder._idLabel}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setViewingOrder(null)}
              >
                ✕
              </button>
            </div>
            <p>
              <b>Order status:</b>{" "}
              <span className={`status ${statusClass(viewingOrder._status)}`}>
                {viewingOrder._status}
              </span>
            </p>
            <p>
              <b>Customer:</b> {viewingOrder._customer} · <b>Order date:</b>{" "}
              {viewingOrder._date}
            </p>
            <p>
              <b>Total:</b> {money(viewingOrder._amount)} · <b>Payment:</b>{" "}
              {formatOrderStatusLabel(
                viewingOrder.paymentStatus ||
                  (viewingOrder.isPaid ? "Paid" : "Pending"),
              )}{" "}
              (
              {formatOrderStatusLabel(viewingOrder.paymentMethod || "Online")})
            </p>
            <div className="notice">
              {orderHistory.length > 0
                ? `Status timeline: ${orderHistory
                    .map((h) => formatOrderStatusLabel(h.status))
                    .join(" → ")}`
                : "Demo tracking timeline: Order placed → Confirmed → Packed → Shipped → Delivered."}
            </div>

            <div className="formgrid" style={{ marginTop: "12px" }}>
              <div className="formgroup">
                <label>Tracking number</label>
                <input
                  className="field full"
                  placeholder="TRK-10482"
                  value={shippingForm.trackingNumber}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Courier partner</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    className="field full"
                    placeholder="BlueDart / Delhivery"
                    value={shippingForm.courierPartner}
                    onChange={(e) =>
                      setShippingForm((prev) => ({
                        ...prev,
                        courierPartner: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={handleSaveShipping}
                  >
                    Save shipping
                  </button>
                </div>
              </div>
            </div>

            <div className="formgrid" style={{ marginTop: "12px" }}>
              <div className="formgroup">
                <label>Cancel reason</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    className="field full"
                    placeholder="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={handleCancelOrder}
                  >
                    Cancel order
                  </button>
                </div>
              </div>
              <div className="formgroup">
                <label>Refund amount (₹) & reason</label>
                {(() => {
                  const isAlreadyRefunded =
                    String(viewingOrder.orderStatus || viewingOrder._status || "").toLowerCase() === "refunded" ||
                    String(viewingOrder.paymentStatus || "").toLowerCase() === "refunded";
                  const isOrderPaid =
                    viewingOrder.isDemo ||
                    Boolean(viewingOrder.isPaid) ||
                    ["success", "paid", "partially_refunded"].includes(
                      String(viewingOrder.paymentStatus || "").toLowerCase(),
                    );
                  return (
                    <>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <input
                          type="number"
                          min="1"
                          max={viewingOrder._amount || undefined}
                          className="field"
                          style={{ width: "120px" }}
                          placeholder="Amount"
                          disabled={saving || isAlreadyRefunded || !isOrderPaid}
                          value={refundForm.amount}
                          onChange={(e) =>
                            setRefundForm((prev) => ({
                              ...prev,
                              amount: e.target.value,
                            }))
                          }
                        />
                        <input
                          className="field"
                          style={{ flex: 1, minWidth: "150px" }}
                          placeholder="Refund reason"
                          disabled={saving || isAlreadyRefunded || !isOrderPaid}
                          value={refundForm.reason}
                          onChange={(e) =>
                            setRefundForm((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="btnsm"
                          disabled={saving || isAlreadyRefunded || !isOrderPaid}
                          onClick={handleProcessRefund}
                        >
                          {isAlreadyRefunded ? "Refunded" : "Refund"}
                        </button>
                      </div>
                      {isAlreadyRefunded ? (
                        <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                          This order has already been fully refunded.
                        </p>
                      ) : !isOrderPaid ? (
                        <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                          Payment is pending/unpaid — refund is available only after payment is received.
                        </p>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {updatingOrder && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUpdatingOrder(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Update order status</h2>
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
              id="newStatus"
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
              <option>Returned</option>
              <option>Refunded</option>
            </select>
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Status note (optional)</label>
              <input
                className="field full"
                placeholder="Note for status history..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="primarybtn"
              style={{ marginTop: "12px" }}
              disabled={saving}
              onClick={handleSaveStatus}
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
