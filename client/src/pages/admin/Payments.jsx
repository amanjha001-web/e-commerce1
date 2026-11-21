import { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminPagination from "../../components/admin/AdminPagination";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (date, withTime = false) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleString(withTime ? "en-IN" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const formatLabel = (value, fallback = "—") => {
  if (!value) return fallback;
  return String(value)
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const normalizeStatusKey = (raw) => {
  const s = String(raw || "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["paid", "completed", "captured", "successful"].includes(s)) {
    return "success";
  }
  return s || "pending";
};

const getPaymentBadgeClass = (statusKey) => {
  if (statusKey === "success") return "green";
  if (
    ["failed", "refunded", "cancelled"].includes(statusKey)
  ) {
    return "red";
  }
  if (
    ["pending", "processing", "refund_pending", "partially_refunded"].includes(
      statusKey,
    )
  ) {
    return "amber";
  }
  return "";
};

const getPayoutBadgeClass = (status) => {
  const s = String(status || "PENDING").toUpperCase();
  if (s === "PAID") return "green";
  if (s === "REJECTED" || s === "CANCELLED") return "red";
  if (s === "PENDING" || s === "PROCESSING") return "amber";
  return "";
};

const AdminPayments = ({
  payments = [],
  summary = null,
  vendorPayouts = [],
  payoutSummary = null,
  selectedPayment = null,
  selectedPayout = null,
  loading = false,
  saving = false,
  detailsLoading = false,
  error = null,
  pagination = {},
  payoutPagination = {},
  filters = { search: "", status: "all", method: "all", dateRange: "all", page: 1, limit: 10 },
  payoutFilters = { search: "", status: "all", page: 1, limit: 10 },
  onClearError,
  onFilterChange,
  onPayoutFilterChange,
  onViewPayment,
  onRefundPayment,
  onReconcilePayment,
  onViewPayout,
  onUpdatePayoutStatus,
}) => {
  const [activeTab, setActiveTab] = useState("payments"); // "payments" | "payouts"
  const [viewingPayment, setViewingPayment] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [actionError, setActionError] = useState("");

  const [viewingPayout, setViewingPayout] = useState(null);
  const [payoutRef, setPayoutRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const rows = useMemo(() => {
    return (Array.isArray(payments) ? payments : []).map((p, i) => {
      const orderObj =
        (typeof p.orderId === "object" && p.orderId !== null && p.orderId) ||
        (typeof p.order === "object" && p.order !== null && p.order) ||
        null;
      const userObj =
        (typeof p.userId === "object" && p.userId !== null && p.userId) ||
        (typeof p.user === "object" && p.user !== null && p.user) ||
        null;

      const rawOrderRef =
        p.orderRefId ||
        orderObj?._id ||
        (typeof p.orderId === "string" ? p.orderId : "") ||
        (typeof p.order === "string" ? p.order : "");

      const orderLabel =
        orderObj?.orderNumber ||
        p.orderNumber ||
        (rawOrderRef
          ? `#SS-${String(rawOrderRef).slice(-5).toUpperCase()}`
          : "—");

      const paymentId =
        p.paymentCode ||
        p.razorpayPaymentId ||
        p.transactionId ||
        p.paymentId ||
        (p._id
          ? `PAY-${String(p._id).slice(-5).toUpperCase()}`
          : `PAY-${101 + i}`);

      const customerName =
        p.customerName ||
        userObj?.fullName ||
        userObj?.name ||
        userObj?.username ||
        orderObj?.shippingAddress?.fullName ||
        userObj?.email ||
        "—";

      const customerEmail = p.customerEmail || userObj?.email || "";
      const methodRaw =
        p.paymentMethod || p.method || p.mode || orderObj?.paymentMethod || "";
      const method = methodRaw ? formatLabel(methodRaw) : "—";
      const rawAmount = Number(
        p.amount ?? p.totalAmount ?? orderObj?.totalAmount ?? orderObj?.total ?? 0,
      );
      const statusKey = normalizeStatusKey(p.status || p.paymentStatus);
      const statusLabel = formatLabel(statusKey, "Pending");
      const statusClass = getPaymentBadgeClass(statusKey);
      const date = formatDate(p.createdAt || p.paymentDate || p.date);
      const isRefundable = ["success", "partially_refunded"].includes(statusKey);

      return {
        ...p,
        _key: p._id || paymentId || i,
        _paymentId: paymentId,
        _order: orderLabel,
        _orderRefId: rawOrderRef,
        _customer: customerName,
        _customerEmail: customerEmail,
        _method: method,
        _rawAmount: rawAmount,
        _amount: money(rawAmount),
        _date: date,
        _statusKey: statusKey,
        _status: statusLabel,
        _statusClass: statusClass,
        _isRefundable: isRefundable && Boolean(rawOrderRef),
      };
    });
  }, [payments]);

  const payoutRows = useMemo(() => {
    return (Array.isArray(vendorPayouts) ? vendorPayouts : []).map((vp, i) => {
      const vendorObj =
        (typeof vp.vendorId === "object" && vp.vendorId !== null && vp.vendorId) ||
        (typeof vp.vendor === "object" && vp.vendor !== null && vp.vendor) ||
        null;
      const vendorName =
        vp.vendorName ||
        vendorObj?.storeName ||
        vendorObj?.shopName ||
        vendorObj?.businessName ||
        vendorObj?.fullName ||
        "Vendor";
      const payoutCode =
        vp.payoutCode ||
        (vp._id ? `PO-${String(vp._id).slice(-5).toUpperCase()}` : `PO-${101 + i}`);
      const statusUpper = String(vp.status || "PENDING").trim().toUpperCase();
      const bank = vp.bankDetails || {};
      const bankLabel = bank.bankName
        ? `${bank.bankName}${bank.accountNumber ? ` · ****${String(bank.accountNumber).slice(-4)}` : ""}`
        : formatLabel(vp.paymentMethod || "BANK_TRANSFER");
      const isTerminal = ["PAID", "REJECTED", "CANCELLED"].includes(statusUpper);

      return {
        ...vp,
        _key: vp._id || payoutCode || i,
        _code: payoutCode,
        _vendorName: vendorName,
        _vendorEmail: vendorObj?.email || "",
        _bankLabel: bankLabel,
        _rawAmount: Number(vp.amount || 0),
        _amount: money(vp.amount || 0),
        _date: formatDate(vp.createdAt),
        _status: statusUpper,
        _statusClass: getPayoutBadgeClass(statusUpper),
        _isTerminal: isTerminal,
      };
    });
  }, [vendorPayouts]);

  const activePayment =
    selectedPayment &&
    viewingPayment &&
    selectedPayment._id === viewingPayment._id
      ? { ...viewingPayment, ...selectedPayment }
      : viewingPayment;

  const activePaymentStatus = activePayment
    ? normalizeStatusKey(activePayment.status || activePayment._statusKey)
    : "pending";
  const activePaymentRefundable =
    Boolean(activePayment) &&
    ["success", "partially_refunded"].includes(activePaymentStatus) &&
    Boolean(
      activePayment._orderRefId ||
        activePayment.orderRefId ||
        activePayment.orderId ||
        activePayment.order,
    );

  const activePayout =
    selectedPayout &&
    viewingPayout &&
    selectedPayout._id === viewingPayout._id
      ? { ...viewingPayout, ...selectedPayout }
      : viewingPayout;

  const totalCollected = summary?.totalCollectedAmount ??
    rows
      .filter((r) => r._statusKey === "success")
      .reduce((sum, r) => sum + r._rawAmount, 0);
  const successCount =
    summary?.successCount ?? rows.filter((r) => r._statusKey === "success").length;
  const pendingCount =
    summary?.pendingCount ??
    rows.filter((r) => ["pending", "processing"].includes(r._statusKey)).length;
  const failedRefundedCount =
    summary !== null
      ? Number(summary.failedCount || 0) + Number(summary.refundedCount || 0)
      : rows.filter((r) =>
          ["failed", "refunded", "partially_refunded", "cancelled"].includes(
            r._statusKey,
          ),
        ).length;

  const pendingPayoutsCount =
    payoutSummary?.pending ??
    payoutRows.filter((p) => p._status === "PENDING").length;

  const handleOpenPayment = (row) => {
    setActionError("");
    setViewingPayment(row);
    setRefundAmount(String(row._rawAmount || ""));
    setRefundReason("");
    if (row._id) {
      onViewPayment?.(row);
    }
  };

  const handleOpenPayout = (vp) => {
    setActionError("");
    setViewingPayout(vp);
    setPayoutRef(vp.transactionReference || "");
    setPayoutNotes(vp.notes || "");
    if (vp._id) {
      onViewPayout?.(vp._id);
    }
  };

  const handleRefundSubmit = async () => {
    if (!activePayment?._id || saving) return;
    setActionError("");

    const parsedAmt = refundAmount ? Number(refundAmount) : undefined;
    if (
      parsedAmt !== undefined &&
      (!Number.isFinite(parsedAmt) ||
        parsedAmt <= 0 ||
        (activePayment._rawAmount > 0 && parsedAmt > activePayment._rawAmount))
    ) {
      const msg =
        activePayment._rawAmount > 0
          ? `Refund amount must be between ₹1 and ${money(activePayment._rawAmount)}`
          : "Refund amount must be greater than 0";
      setActionError(msg);
      toast.error(msg);
      return;
    }

    try {
      await onRefundPayment?.(
        activePayment._id,
        parsedAmt,
        refundReason.trim() || "Admin initiated payment refund",
      );
      toast.success("Payment refund processed");
      setViewingPayment(null);
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to process refund";
      setActionError(msg);
      toast.error(msg);
    }
  };

  const handleReconcileSubmit = async () => {
    if (!activePayment?._id || saving) return;
    setActionError("");

    try {
      const result = await onReconcilePayment?.(activePayment._id);
      if (result?.reconciled === false) {
        toast.info(result?.reason || "Payment could not be reconciled");
      } else if (result?.updated) {
        toast.success(`Payment status synced to ${formatLabel(result.localStatus)}`);
      } else {
        toast.success("Payment verified with Razorpay gateway (already in sync)");
      }
      onViewPayment?.(activePayment);
    } catch (err) {
      const msg =
        typeof err === "string" ? err : err?.message || "Failed to reconcile payment";
      setActionError(msg);
      toast.error(msg);
    }
  };

  const handlePayoutAction = async (payoutId, status) => {
    if (!payoutId || saving) return;
    setActionError("");
    try {
      await onUpdatePayoutStatus?.(payoutId, {
        status,
        transactionReference: payoutRef.trim(),
        notes: payoutNotes.trim(),
      });
      toast.success(`Vendor payout marked ${status}`);
      setViewingPayout(null);
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to update payout";
      setActionError(msg);
      toast.error(msg);
    }
  };

  const hasPaymentFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== "all") ||
      (filters.method && filters.method !== "all") ||
      (filters.dateRange && filters.dateRange !== "all"),
  );

  return (
    <div className="space-y-6">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Payments</h1>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-[var(--muted)]">Total collected</p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {money(totalCollected)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveTab("payments");
            onFilterChange?.({ status: "success" });
          }}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            activeTab === "payments" && filters.status === "success"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">Successful</p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {successCount}
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("payments");
            onFilterChange?.({ status: "pending" });
          }}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            activeTab === "payments" && filters.status === "pending"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">Pending</p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {pendingCount}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payouts")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            activeTab === "payouts"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">
            Failed / Refunded
          </p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {failedRefundedCount}
          </p>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={activeTab === "payments" ? "primarybtn" : "outlinebtn"}
        >
          Transactions ({pagination?.total ?? rows.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payouts")}
          className={activeTab === "payouts" ? "primarybtn" : "outlinebtn"}
        >
          Vendor Payouts ({payoutPagination?.total ?? payoutRows.length})
          {pendingPayoutsCount > 0 && (
            <span className="ml-2 rounded-full bg-[#fff4df] px-2 py-0.5 text-[11px] font-bold text-[#9b6814]">
              {pendingPayoutsCount} pending
            </span>
          )}
        </button>
      </div>

      {(error || actionError) && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-semibold text-[#bd3345]"
        >
          <span>{actionError || error}</span>
          <button
            type="button"
            onClick={() => {
              setActionError("");
              onClearError?.();
            }}
            className="cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      {activeTab === "payments" ? (
        <div className="panel">
          <div className="toolbar">
            <input
              className="field"
              placeholder="Search payment ID, order #, customer..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange?.({ search: e.target.value })}
            />
            <select
              className="field"
              value={filters.status || "all"}
              onChange={(e) => onFilterChange?.({ status: e.target.value })}
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refund_pending">Refund Pending</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="field"
              value={filters.method || "all"}
              onChange={(e) => onFilterChange?.({ method: e.target.value })}
            >
              <option value="all">All methods</option>
              <option value="razorpay">Razorpay</option>
              <option value="cod">COD</option>
              <option value="wallet">Wallet</option>
              <option value="stripe">Stripe</option>
            </select>
            <select
              className="field"
              value={filters.dateRange || "all"}
              onChange={(e) => onFilterChange?.({ dateRange: e.target.value })}
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            {hasPaymentFilters && (
              <button
                type="button"
                className="outlinebtn"
                onClick={() =>
                  onFilterChange?.({
                    search: "",
                    status: "all",
                    method: "all",
                    dateRange: "all",
                    page: 1,
                  })
                }
              >
                Reset
              </button>
            )}
          </div>

          <div id="simpleTable" className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-sm text-[var(--muted)]"
                    >
                      Loading payment transactions...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-sm text-[var(--muted)]"
                    >
                      No payments match the selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p._key}>
                      <td className="font-mono text-xs font-bold text-[var(--text)]">
                        {p._paymentId}
                      </td>
                      <td className="font-semibold text-[var(--text)]">
                        {p._order}
                      </td>
                      <td>
                        <div className="font-medium text-[var(--text)]">
                          {p._customer}
                        </div>
                        {p._customerEmail && (
                          <div className="text-[11px] text-[var(--muted)]">
                            {p._customerEmail}
                          </div>
                        )}
                      </td>
                      <td>{p._method}</td>
                      <td className="font-bold">{p._amount}</td>
                      <td>{p._date}</td>
                      <td>
                        <span className={`status ${p._statusClass}`}>
                          {p._status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btnsm"
                          onClick={() => handleOpenPayment(p)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={pagination?.page || filters.page || 1}
            totalPages={
              pagination?.totalPages ||
              Math.ceil((pagination?.total || rows.length) / (pagination?.limit || filters.limit || 10)) ||
              1
            }
            totalItems={pagination?.total ?? rows.length}
            pageSize={pagination?.limit || filters.limit || 10}
            itemLabel="payments"
            loading={loading}
            onPageChange={(nextPage) => onFilterChange?.({ page: nextPage })}
            onPageSizeChange={(nextLimit) =>
              onFilterChange?.({ limit: nextLimit, page: 1 })
            }
          />
        </div>
      ) : (
        <div className="panel">
          <div className="toolbar">
            <input
              className="field"
              placeholder="Search vendor, ref #, notes..."
              value={payoutFilters.search || ""}
              onChange={(e) =>
                onPayoutFilterChange?.({ search: e.target.value })
              }
            />
            <select
              className="field"
              value={payoutFilters.status || "all"}
              onChange={(e) =>
                onPayoutFilterChange?.({ status: e.target.value })
              }
            >
              <option value="all">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {(payoutFilters.search || payoutFilters.status !== "all") && (
              <button
                type="button"
                className="outlinebtn"
                onClick={() =>
                  onPayoutFilterChange?.({
                    search: "",
                    status: "all",
                    page: 1,
                  })
                }
              >
                Reset
              </button>
            )}
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Payout ID</th>
                  <th>Vendor</th>
                  <th>Bank / Method</th>
                  <th>Amount</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payoutRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-[var(--muted)]"
                    >
                      No vendor payout requests match the selected filters.
                    </td>
                  </tr>
                ) : (
                  payoutRows.map((vp) => (
                    <tr key={vp._key}>
                      <td className="font-mono text-xs font-bold text-[var(--text)]">
                        {vp._code}
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--text)]">
                          {vp._vendorName}
                        </div>
                        {vp._vendorEmail && (
                          <div className="text-[11px] text-[var(--muted)]">
                            {vp._vendorEmail}
                          </div>
                        )}
                      </td>
                      <td>{vp._bankLabel}</td>
                      <td className="font-bold">{vp._amount}</td>
                      <td>{vp._date}</td>
                      <td>
                        <span className={`status ${vp._statusClass}`}>
                          {formatLabel(vp._status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleOpenPayout(vp)}
                          >
                            View
                          </button>
                          {!vp._isTerminal && (
                            <button
                              type="button"
                              className="btnsm primary"
                              disabled={saving}
                              onClick={() => handlePayoutAction(vp._id, "PAID")}
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={payoutPagination?.page || payoutFilters.page || 1}
            totalPages={
              payoutPagination?.totalPages ||
              Math.ceil(
                (payoutPagination?.total || payoutRows.length) /
                  (payoutPagination?.limit || payoutFilters.limit || 10),
              ) ||
              1
            }
            totalItems={payoutPagination?.total ?? payoutRows.length}
            pageSize={payoutPagination?.limit || payoutFilters.limit || 10}
            itemLabel="payouts"
            loading={loading}
            onPageChange={(nextPage) =>
              onPayoutFilterChange?.({ page: nextPage })
            }
            onPageSizeChange={(nextLimit) =>
              onPayoutFilterChange?.({ limit: nextLimit, page: 1 })
            }
          />
        </div>
      )}

      {/* Payment Details & Actions Modal */}
      {activePayment && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setViewingPayment(null);
            }
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Payment {activePayment._paymentId}</h2>
              <button
                type="button"
                className="iconbtn"
                disabled={saving}
                onClick={() => setViewingPayment(null)}
              >
                ✕
              </button>
            </div>

            {detailsLoading && !selectedPayment ? (
              <p className="muted">Loading full payment record...</p>
            ) : (
              <>
                <div className="space-y-1.5 text-sm">
                  <p>
                    <b>Order:</b> {activePayment._order} · <b>Method:</b>{" "}
                    {activePayment._method}
                  </p>
                  <p>
                    <b>Customer:</b> {activePayment._customer}
                    {activePayment._customerEmail
                      ? ` (${activePayment._customerEmail})`
                      : ""}
                  </p>
                  <p>
                    <b>Amount:</b> {activePayment._amount} · <b>Date:</b>{" "}
                    {formatDate(activePayment.createdAt || activePayment._date, true)}
                  </p>
                  <p>
                    <b>Status:</b>{" "}
                    <span className={`status ${getPaymentBadgeClass(activePaymentStatus)}`}>
                      {formatLabel(activePaymentStatus)}
                    </span>{" "}
                    {activePayment.isVerified && (
                      <span className="status green">Verified</span>
                    )}
                  </p>
                  {(activePayment.razorpayOrderId || activePayment.razorpayPaymentId) && (
                    <p className="text-xs text-[var(--muted)]">
                      {activePayment.razorpayOrderId &&
                        `Razorpay Order: ${activePayment.razorpayOrderId}`}
                      {activePayment.razorpayOrderId &&
                        activePayment.razorpayPaymentId &&
                        " · "}
                      {activePayment.razorpayPaymentId &&
                        `Razorpay Payment: ${activePayment.razorpayPaymentId}`}
                    </p>
                  )}
                  {activePayment.failureReason && (
                    <p className="rounded-lg bg-[#fff0f1] px-3 py-2 text-xs font-semibold text-[#bd3345]">
                      Failure reason: {activePayment.failureReason}
                    </p>
                  )}
                </div>

                {Array.isArray(activePayment.refundHistory) &&
                  activePayment.refundHistory.length > 0 && (
                    <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--soft)]/40 p-3 text-xs">
                      <p className="font-bold text-[var(--text)]">
                        Refund history (Total refunded:{" "}
                        {money(activePayment.totalRefunded || 0)})
                      </p>
                      <ul className="mt-1 space-y-1">
                        {activePayment.refundHistory.map((rf) => (
                          <li key={rf._id}>
                            {money(rf.amount ?? rf.refundAmount ?? 0)} —{" "}
                            {formatLabel(rf.status)} ({rf.reason || "Refund"})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {activePaymentRefundable ? (
                  <div className="formgrid" style={{ marginTop: "14px" }}>
                    <div className="formgroup">
                      <label>Refund amount (₹)</label>
                      <input
                        type="number"
                        className="field full"
                        min={1}
                        max={activePayment._rawAmount || undefined}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                    </div>
                    <div className="formgroup">
                      <label>Refund reason</label>
                      <input
                        className="field full"
                        placeholder="Reason for refund"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="notice" style={{ marginTop: "12px" }}>
                    {activePaymentStatus === "refunded"
                      ? "This transaction has already been fully refunded."
                      : "Refunds can only be issued on successful or partially refunded payments."}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  {activePaymentRefundable && (
                    <button
                      type="button"
                      className="btnsm primary"
                      disabled={saving}
                      onClick={handleRefundSubmit}
                    >
                      {saving ? "Processing..." : "Issue Refund"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={handleReconcileSubmit}
                  >
                    Reconcile Gateway
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vendor Payout Review Modal */}
      {activePayout && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setViewingPayout(null);
            }
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Payout {activePayout._code}</h2>
              <button
                type="button"
                className="iconbtn"
                disabled={saving}
                onClick={() => setViewingPayout(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-sm">
              <p>
                <b>Vendor:</b> {activePayout._vendorName} · <b>Amount:</b>{" "}
                {activePayout._amount}
              </p>
              <p>
                <b>Requested:</b> {formatDate(activePayout.createdAt, true)} ·{" "}
                <b>Status:</b>{" "}
                <span className={`status ${getPayoutBadgeClass(activePayout.status)}`}>
                  {formatLabel(activePayout.status)}
                </span>
              </p>
              {activePayout.bankDetails &&
                (activePayout.bankDetails.bankName ||
                  activePayout.bankDetails.accountNumber) && (
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)]/40 p-3 text-xs">
                    <p className="font-bold text-[var(--text)]">Bank Details</p>
                    <p className="mt-1">
                      Holder: {activePayout.bankDetails.accountHolderName || "—"} ·
                      Bank: {activePayout.bankDetails.bankName || "—"}
                    </p>
                    <p>
                      A/C: {activePayout.bankDetails.accountNumber || "—"} · IFSC:{" "}
                      {activePayout.bankDetails.ifscCode || "—"}
                    </p>
                  </div>
                )}
            </div>

            {!activePayout._isTerminal ? (
              <>
                <div className="formgrid" style={{ marginTop: "12px" }}>
                  <div className="formgroup">
                    <label>Transaction Reference</label>
                    <input
                      className="field full"
                      placeholder="UTR / NEFT / IMPS Ref #"
                      value={payoutRef}
                      onChange={(e) => setPayoutRef(e.target.value)}
                    />
                  </div>
                  <div className="formgroup">
                    <label>Admin Notes</label>
                    <input
                      className="field full"
                      placeholder="Optional note for vendor"
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    className="btnsm primary"
                    disabled={saving}
                    onClick={() => handlePayoutAction(activePayout._id, "PAID")}
                  >
                    {saving ? "Updating..." : "Mark Paid"}
                  </button>
                  {activePayout._status !== "PROCESSING" && (
                    <button
                      type="button"
                      className="btnsm"
                      disabled={saving}
                      onClick={() =>
                        handlePayoutAction(activePayout._id, "PROCESSING")
                      }
                    >
                      Mark Processing
                    </button>
                  )}
                  <button
                    type="button"
                    className="btnsm"
                    style={{ color: "var(--red)" }}
                    disabled={saving}
                    onClick={() =>
                      handlePayoutAction(activePayout._id, "REJECTED")
                    }
                  >
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <div className="notice" style={{ marginTop: "12px" }}>
                This payout was finalized as{" "}
                <b>{formatLabel(activePayout.status)}</b>
                {activePayout.transactionReference
                  ? ` (Ref: ${activePayout.transactionReference})`
                  : ""}
                .
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
