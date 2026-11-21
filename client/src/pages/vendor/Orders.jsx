import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import orderService from "../../services/order.service";
import AdminPagination from "../../components/admin/AdminPagination";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const ALL_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Out For Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Return Requested", value: "return_requested" },
  { label: "Returned", value: "returned" },
];

const FULFILLMENT_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Out For Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "latest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Amount: High to Low", value: "amount_desc" },
  { label: "Amount: Low to High", value: "amount_asc" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const normalizeStatusKey = (s) =>
  String(s || "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const formatStatusLabel = (s) =>
  normalizeStatusKey(s)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const formatOrderDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClass = (raw) => {
  const s = normalizeStatusKey(raw);
  if (["delivered", "active", "resolved", "published", "return_approved"].includes(s)) {
    return "green";
  }
  if (
    [
      "pending",
      "processing",
      "confirmed",
      "packed",
      "shipped",
      "out_for_delivery",
      "return_requested",
      "refund_pending",
    ].includes(s)
  ) {
    return "amber";
  }
  if (["blocked", "cancelled", "canceled", "rejected", "refunded", "returned", "return_rejected"].includes(s)) {
    return "red";
  }
  return "";
};

const Orders = ({ orders: propOrders = [] }) => {
  const hasPropOrders = Array.isArray(propOrders) && propOrders.length > 0;

  const [apiOrders, setApiOrders] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
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
  const [loading, setLoading] = useState(!hasPropOrders);
  const [error, setError] = useState("");

  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("processing");
  const [statusNote, setStatusNote] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(
    async (opts = {}) => {
      const targetPage = opts.page ?? page;
      const targetLimit = opts.limit ?? limit;
      const targetSearch = opts.search ?? search;
      const targetStatus = opts.status ?? statusFilter;
      const targetSort = opts.sortBy ?? sortBy;

      try {
        setLoading(true);
        setError("");
        const res = await orderService.getVendorOrders({
          page: targetPage,
          limit: targetLimit,
          search: targetSearch.trim() || undefined,
          status: targetStatus !== "all" ? targetStatus : undefined,
          sortBy: targetSort,
        });

        const payload = res?.data ?? res;
        const list = Array.isArray(payload?.orders)
          ? payload.orders
          : Array.isArray(payload)
            ? payload
            : [];
        const pag = payload?.pagination || {};
        const sum = payload?.summary || null;

        setApiOrders(list);
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
          err?.response?.data?.message || err?.message || "Failed to load vendor orders",
        );
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter, sortBy],
  );

  useEffect(() => {
    if (hasPropOrders) return undefined;
    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      loadOrders();
    }, delay);
    return () => clearTimeout(timer);
  }, [hasPropOrders, loadOrders, search]);

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

  const openUpdateModal = (orderRow) => {
    setUpdatingOrder(orderRow);
    setNewStatus(normalizeStatusKey(orderRow._rawStatus || orderRow.status));
    setStatusNote("");
    setCarrier(orderRow._raw?.tracking?.carrier || "");
    setTrackingNumber(orderRow._raw?.tracking?.trackingNumber || "");
  };

  const handleSaveStatus = async (event) => {
    event.preventDefault();
    if (!updatingOrder?.orderId || saving) return;

    const trackingPayload =
      (carrier.trim() || trackingNumber.trim()) &&
      ["shipped", "out_for_delivery"].includes(newStatus)
        ? {
            ...(carrier.trim() ? { carrier: carrier.trim() } : {}),
            ...(trackingNumber.trim() ? { trackingNumber: trackingNumber.trim() } : {}),
          }
        : undefined;

    try {
      setSaving(true);
      await orderService.updateOrderStatus(
        updatingOrder.orderId,
        newStatus,
        statusNote.trim(),
        trackingPayload,
      );
      toast.success(`Order status updated to ${formatStatusLabel(newStatus)}`);
      setUpdatingOrder(null);
      await loadOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => {
    const source = hasPropOrders ? propOrders : apiOrders;
    return source.map((o, i) => {
      const rawStatus = normalizeStatusKey(o.orderStatus || o.status || "pending");
      const customerName =
        o.customer?.fullName ||
        o.customer?.name ||
        o.userId?.fullName ||
        o.userId?.name ||
        o.shippingAddress?.fullName ||
        o.user?.fullName ||
        "Customer";
      const customerSub =
        o.customer?.email ||
        o.userId?.email ||
        o.customer?.phone ||
        o.shippingAddress?.phone ||
        "";
      const itemsCount =
        o.vendorItemsCount ?? (Array.isArray(o.items) ? o.items.length : 1);

      return {
        _raw: o,
        orderId: o._id || o.id || null,
        id:
          o.orderNumber ||
          o.id ||
          (o._id ? `#SS-${String(o._id).slice(-5).toUpperCase()}` : `Order ${i + 1}`),
        customer: customerName,
        customerSub,
        itemsCount,
        date: o.date || formatOrderDate(o.createdAt),
        amount: o.vendorOrderTotal ?? o.amount ?? o.totalAmount ?? 0,
        paymentMethod: String(o.paymentMethod || o.payment?.method || "cod").toUpperCase(),
        paymentStatus: formatStatusLabel(
          o.paymentStatus || o.payment?.status || (o.isPaid ? "paid" : "pending"),
        ),
        _rawStatus: rawStatus,
        status: formatStatusLabel(rawStatus),
      };
    });
  }, [hasPropOrders, propOrders, apiOrders]);

  const displayedRows = useMemo(() => {
    if (!hasPropOrders) return rows;
    return rows.filter((o) => {
      if (statusFilter !== "all" && o._rawStatus !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const text = `${o.id} ${o.customer} ${o.customerSub} ${o.status}`.toLowerCase();
        if (!text.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [hasPropOrders, rows, statusFilter, search]);

  const tabCounts = {
    all: summary.total ?? pagination.total,
    pending: summary.pending,
    processing: summary.processing,
    shipped: summary.shipped,
    delivered: summary.delivered,
    cancelled: summary.cancelled,
  };

  return (
    <div>
      <div className="pagehead flex-wrap gap-3">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Orders</h1>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => loadOrders()}
          className="outlinebtn cursor-pointer disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 text-xs font-bold text-[var(--red)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadOrders()}
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
            placeholder="Search order #, customer, phone, or product..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <select
            className="field"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Filter by order status"
          >
            {ALL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            aria-label="Sort orders"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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
              {loading && displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading vendor orders...
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                    {search.trim() || statusFilter !== "all"
                      ? "No orders match the selected filters."
                      : "No orders have been placed for your products yet."}
                  </td>
                </tr>
              ) : (
                displayedRows.map((o) => (
                  <tr key={o.orderId || o.id}>
                    <td>
                      {o.orderId ? (
                        <Link
                          to={`/vendor/orders/${o.orderId}`}
                          className="font-bold text-[var(--primary)] hover:underline"
                        >
                          {o.id}
                        </Link>
                      ) : (
                        <span className="font-bold">{o.id}</span>
                      )}
                      <div className="text-[11px] font-medium text-[var(--muted)]">
                        {o.itemsCount} item{o.itemsCount === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-[var(--text)]">{o.customer}</div>
                      {o.customerSub && (
                        <div className="text-[11px] font-medium text-[var(--muted)]">
                          {o.customerSub}
                        </div>
                      )}
                    </td>
                    <td>{o.date}</td>
                    <td>
                      <div className="font-bold text-[var(--text)]">{money(o.amount)}</div>
                      <div className="text-[11px] font-medium text-[var(--muted)]">
                        {o.paymentMethod} · {o.paymentStatus}
                      </div>
                    </td>
                    <td>
                      <span className={`status ${statusClass(o._rawStatus)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {o.orderId && (
                          <Link
                            to={`/vendor/orders/${o.orderId}`}
                            className="btnsm inline-block"
                          >
                            View
                          </Link>
                        )}
                        <button
                          type="button"
                          className="btnsm"
                          onClick={() => openUpdateModal(o)}
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!hasPropOrders && (
          <AdminPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={limit}
            itemLabel="orders"
            loading={loading}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      {updatingOrder && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setUpdatingOrder(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Update fulfillment · {updatingOrder.id}</h2>
              <button
                type="button"
                className="iconbtn"
                disabled={saving}
                onClick={() => setUpdatingOrder(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-3">
              <div className="formgroup">
                <label htmlFor="orderStatusSelect">New status</label>
                <select
                  id="orderStatusSelect"
                  className="field full"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {FULFILLMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {["shipped", "out_for_delivery"].includes(newStatus) && (
                <div className="formgrid">
                  <div className="formgroup">
                    <label htmlFor="orderCarrier">Courier / Carrier (Optional)</label>
                    <input
                      id="orderCarrier"
                      className="field full"
                      placeholder="e.g. Delhivery, BlueDart"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    />
                  </div>
                  <div className="formgroup">
                    <label htmlFor="orderTrackingNum">Tracking number</label>
                    <input
                      id="orderTrackingNum"
                      className="field full"
                      placeholder="AWB / Tracking ID"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="formgroup">
                <label htmlFor="orderStatusNote">Fulfillment note (Optional)</label>
                <textarea
                  id="orderStatusNote"
                  rows={2}
                  className="field full"
                  placeholder="Note visible in customer order timeline"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="outlinebtn"
                  disabled={saving}
                  onClick={() => setUpdatingOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primarybtn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
