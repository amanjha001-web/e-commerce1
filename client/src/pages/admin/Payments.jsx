import { useMemo, useState } from "react";
import { toast } from "sonner";

const DEMO_PAYMENTS = [
  {
    paymentId: "PAY-201",
    order: "#SS-10482",
    method: "UPI",
    amount: "₹4,298",
    rawAmount: 4298,
    date: "11 Nov 2026",
    status: "Success",
    statusClass: "green",
    isDemo: true,
  },
  {
    paymentId: "PAY-202",
    order: "#SS-10481",
    method: "Card",
    amount: "₹1,899",
    rawAmount: 1899,
    date: "10 Nov 2026",
    status: "Success",
    statusClass: "green",
    isDemo: true,
  },
  {
    paymentId: "PAY-203",
    order: "#SS-10480",
    method: "COD",
    amount: "₹3,499",
    rawAmount: 3499,
    date: "09 Nov 2026",
    status: "Pending",
    statusClass: "amber",
    isDemo: true,
  },
];

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

const AdminPayments = ({
  payments = [],
  vendorPayouts = [],
  selectedPayment = null,
  saving = false,
  onViewPayment,
  onRefundPayment,
  onReconcilePayment,
  onUpdatePayoutStatus,
}) => {
  const [search, setSearch] = useState("");
  const [viewingPayment, setViewingPayment] = useState(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const rows = useMemo(() => {
    const source = payments.length > 0 ? payments : DEMO_PAYMENTS;
    return source.map((p, i) => {
      if (p.paymentId && p.order && p.statusClass) return p;

      const paymentId =
        p.transactionId ||
        p.razorpayPaymentId ||
        p.paymentId ||
        (p._id
          ? `PAY-${String(p._id).slice(-3).toUpperCase()}`
          : `PAY-${201 + i}`);
      const order =
        p.order?.orderNumber ||
        p.orderNumber ||
        (p.orderId
          ? `#SS-${String(p.orderId).slice(-5).toUpperCase()}`
          : "#SS-10482");
      const method = p.method || p.paymentMethod || "UPI";
      const rawAmount = Number(p.amount || 0);
      const amount = `₹${rawAmount.toLocaleString("en-IN")}`;
      const date = formatDate(p.createdAt || p.date);
      const rawStatus = String(p.status || "Success").toLowerCase();
      const status =
        rawStatus === "completed" ||
        rawStatus === "paid" ||
        rawStatus === "success"
          ? "Success"
          : rawStatus === "failed"
            ? "Failed"
            : rawStatus === "refunded"
              ? "Refunded"
              : "Pending";
      const statusClass =
        status === "Success"
          ? "green"
          : status === "Failed" || status === "Refunded"
            ? "red"
            : "amber";

      return {
        ...p,
        paymentId,
        order,
        method,
        amount,
        rawAmount,
        date,
        status,
        statusClass,
      };
    });
  }, [payments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      `${r.paymentId} ${r.order} ${r.method} ${r.amount} ${r.date} ${r.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const handleOpenPayment = (p) => {
    setViewingPayment(p);
    setRefundAmount(String(p.rawAmount || ""));
    setRefundReason("");
    if (!p.isDemo && p._id) {
      onViewPayment?.(p);
    }
  };

  const activePayment =
    selectedPayment &&
    viewingPayment &&
    selectedPayment._id === viewingPayment._id
      ? { ...viewingPayment, ...selectedPayment }
      : viewingPayment;

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Payments</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="primarybtn"
            onClick={() => {
              setPayoutModalOpen(true);
              toast.success("New payments form opened");
            }}
          >
            + Add new
          </button>
        </div>

        <div id="simpleTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p._id || p.paymentId}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleOpenPayment(p)}
                >
                  <td>{p.paymentId}</td>
                  <td>{p.order}</td>
                  <td>{p.method}</td>
                  <td>{p.amount}</td>
                  <td>{p.date}</td>
                  <td>
                    <span className={`status ${p.statusClass}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activePayment && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingPayment(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Payment {activePayment.paymentId}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setViewingPayment(null)}
              >
                ✕
              </button>
            </div>
            <p>
              <b>Order:</b> {activePayment.order} · <b>Method:</b>{" "}
              {activePayment.method}
            </p>
            <p>
              <b>Amount:</b> {activePayment.amount} · <b>Date:</b>{" "}
              {activePayment.date}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span className={`status ${activePayment.statusClass}`}>
                {activePayment.status}
              </span>
            </p>

            <div className="formgrid" style={{ marginTop: "12px" }}>
              <div className="formgroup">
                <label>Refund amount (₹)</label>
                <input
                  type="number"
                  className="field full"
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

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                className="btnsm primary"
                disabled={saving}
                onClick={async () => {
                  if (!activePayment.isDemo && activePayment._id) {
                    try {
                      await onRefundPayment?.(
                        activePayment._id,
                        refundAmount ? Number(refundAmount) : undefined,
                        refundReason.trim() || "Admin payment refund",
                      );
                      toast.success("Payment refunded");
                      setViewingPayment(null);
                    } catch (err) {
                      toast.error(err?.message || "Failed to refund payment");
                    }
                  } else {
                    toast.success("Payment refunded");
                    setViewingPayment(null);
                  }
                }}
              >
                Refund payment
              </button>
              <button
                type="button"
                className="btnsm"
                disabled={saving}
                onClick={async () => {
                  if (!activePayment.isDemo && activePayment._id) {
                    try {
                      await onReconcilePayment?.(activePayment._id);
                      toast.success("Payment reconciled with gateway");
                    } catch (err) {
                      toast.error(
                        err?.message || "Failed to reconcile payment",
                      );
                    }
                  } else {
                    toast.success("Payment reconciled with gateway");
                  }
                }}
              >
                Reconcile gateway
              </button>
            </div>
          </div>
        </div>
      )}

      {payoutModalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayoutModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Vendor payouts & reconciliation</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setPayoutModalOpen(false)}
              >
                ✕
              </button>
            </div>
            {vendorPayouts.length === 0 ? (
              <p className="muted">
                All vendor payouts are up to date. Select any payment row in the
                table to reconcile or issue a gateway refund.
              </p>
            ) : (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorPayouts.map((vp) => (
                      <tr key={vp._id}>
                        <td>
                          {vp.vendor?.shopName ||
                            vp.vendor?.fullName ||
                            "Vendor"}
                        </td>
                        <td>
                          ₹{Number(vp.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span className="status amber">
                            {vp.status || "PENDING"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btnsm primary"
                            disabled={saving || vp.status === "PAID"}
                            onClick={async () => {
                              try {
                                await onUpdatePayoutStatus?.(vp._id, "PAID");
                                toast.success("Vendor payout marked PAID");
                              } catch (err) {
                                toast.error(
                                  err?.message || "Failed to update payout",
                                );
                              }
                            }}
                          >
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
