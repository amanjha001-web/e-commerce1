import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";

const DEMO_REFUNDS = [
  {
    request: "RF-101",
    order: "#SS-10470",
    customer: "Riya Sharma",
    amount: "₹2,499",
    rawAmount: 2499,
    reason: "Damaged item",
    status: "Pending",
    statusClass: "amber",
    isDemo: true,
  },
  {
    request: "RF-102",
    order: "#SS-10461",
    customer: "Kabir Das",
    amount: "₹899",
    rawAmount: 899,
    reason: "Wrong item",
    status: "Approved",
    statusClass: "green",
    isDemo: true,
  },
];

const Refunds = () => {
  const [apiRefunds, setApiRefunds] = useState([]);
  const [demoRefunds, setDemoRefunds] = useState(DEMO_REFUNDS);
  const [search, setSearch] = useState("");
  const [viewingRefund, setViewingRefund] = useState(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newRefundForm, setNewRefundForm] = useState({
    orderId: "",
    amount: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchRefunds = useCallback(async () => {
    try {
      const response = await adminService.getRefundRequests({ limit: 50 });
      const data = response?.data ?? response;
      const list = data?.orders || data?.refunds || data || [];
      if (Array.isArray(list) && list.length > 0) {
        setApiRefunds(list);
      }
    } catch {
      // Fallback to demo refunds when unmapped
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const rows = useMemo(() => {
    const source = apiRefunds.length > 0 ? apiRefunds : demoRefunds;
    return source.map((r, i) => {
      if (r.request && r.order && r.statusClass) return r;

      const request =
        r.refundId ||
        r.request ||
        (r._id ? `RF-${String(r._id).slice(-3).toUpperCase()}` : `RF-${101 + i}`);
      const order =
        r.orderNumber ||
        r.order?.orderNumber ||
        (r._id ? `#SS-${String(r._id).slice(-5).toUpperCase()}` : "#SS-10470");
      const customer =
        r.user?.fullName ||
        r.customer?.fullName ||
        r.customer ||
        "Customer";
      const rawAmount = r.refundAmount || r.totalAmount || r.amount || 0;
      const amount = `₹${Number(rawAmount).toLocaleString("en-IN")}`;
      const reason = r.refundReason || r.reason || r.notes || "Customer return";
      const isApproved =
        r.paymentStatus === "Refunded" ||
        r.orderStatus === "Refunded" ||
        r.status === "Approved";
      const status = isApproved
        ? "Approved"
        : r.status === "Rejected"
          ? "Rejected"
          : "Pending";
      const statusClass =
        status === "Approved"
          ? "green"
          : status === "Rejected"
            ? "red"
            : "amber";

      return {
        ...r,
        request,
        order,
        customer,
        amount,
        rawAmount,
        reason,
        status,
        statusClass,
      };
    });
  }, [apiRefunds, demoRefunds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      `${r.request} ${r.order} ${r.customer} ${r.amount} ${r.reason} ${r.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const handleApproveRefund = async (r) => {
    if (!r.isDemo && r._id) {
      try {
        setSaving(true);
        await adminService.processRefund(r._id, {
          amount: r.rawAmount || undefined,
          reason: r.reason || "Approved by admin",
        });
        toast.success("Refund approved");
        fetchRefunds();
        return;
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to approve refund");
        return;
      } finally {
        setSaving(false);
      }
    }

    setDemoRefunds((prev) =>
      prev.map((item) =>
        item.request === r.request
          ? { ...item, status: "Approved", statusClass: "green" }
          : item,
      ),
    );
    toast.success("Refund approved");
  };

  const handleRejectRefund = (r) => {
    setDemoRefunds((prev) =>
      prev.map((item) =>
        item.request === r.request
          ? { ...item, status: "Rejected", statusClass: "red" }
          : item,
      ),
    );
    toast.success("Refund rejected");
  };

  const handleCreateRefund = async () => {
    if (!newRefundForm.orderId.trim()) {
      setNewModalOpen(false);
      return;
    }
    try {
      setSaving(true);
      await adminService.processRefund(newRefundForm.orderId.trim(), {
        amount: newRefundForm.amount ? Number(newRefundForm.amount) : undefined,
        reason: newRefundForm.reason.trim() || "Manual admin refund",
      });
      toast.success("Refund processed");
      fetchRefunds();
    } catch {
      setDemoRefunds((prev) => [
        {
          request: `RF-${101 + prev.length}`,
          order: newRefundForm.orderId.trim(),
          customer: "Customer",
          amount: `₹${Number(newRefundForm.amount || 0).toLocaleString("en-IN")}`,
          rawAmount: Number(newRefundForm.amount || 0),
          reason: newRefundForm.reason.trim() || "Damaged item",
          status: "Pending",
          statusClass: "amber",
          isDemo: true,
        },
        ...prev,
      ]);
      toast.success("Refund request added");
    } finally {
      setSaving(false);
      setNewModalOpen(false);
      setNewRefundForm({ orderId: "", amount: "", reason: "" });
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Refund requests</h1>
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
              setNewModalOpen(true);
              toast.success("New refund requests form opened");
            }}
          >
            + Add new
          </button>
        </div>

        <div id="simpleTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id || r.request}>
                  <td>{r.request}</td>
                  <td>{r.order}</td>
                  <td>{r.customer}</td>
                  <td>{r.amount}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span className={`status ${r.statusClass}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "Pending" ? (
                      <>
                        <button
                          type="button"
                          className="btnsm primary"
                          disabled={saving}
                          onClick={() => handleApproveRefund(r)}
                        >
                          Approve
                        </button>{" "}
                        <button
                          type="button"
                          className="btnsm"
                          disabled={saving}
                          onClick={() => handleRejectRefund(r)}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btnsm"
                        onClick={() => setViewingRefund(r)}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingRefund && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingRefund(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{viewingRefund.request}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setViewingRefund(null)}
              >
                ✕
              </button>
            </div>
            <p>
              <b>Order:</b> {viewingRefund.order}
            </p>
            <p>
              <b>Customer:</b> {viewingRefund.customer}
            </p>
            <p>
              <b>Amount:</b> {viewingRefund.amount}
            </p>
            <p>
              <b>Reason:</b> {viewingRefund.reason}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span className={`status ${viewingRefund.statusClass}`}>
                {viewingRefund.status}
              </span>
            </p>
          </div>
        </div>
      )}

      {newModalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Process order refund</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setNewModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="formgrid">
              <div className="formgroup">
                <label>Order ID</label>
                <input
                  className="field full"
                  placeholder="Order ID or #SS-10470"
                  value={newRefundForm.orderId}
                  onChange={(e) =>
                    setNewRefundForm((prev) => ({
                      ...prev,
                      orderId: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  className="field full"
                  placeholder="2499"
                  value={newRefundForm.amount}
                  onChange={(e) =>
                    setNewRefundForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Refund reason</label>
              <input
                className="field full"
                placeholder="Damaged item / customer return"
                value={newRefundForm.reason}
                onChange={(e) =>
                  setNewRefundForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>
            <button
              type="button"
              className="primarybtn"
              style={{ marginTop: "14px" }}
              disabled={saving}
              onClick={handleCreateRefund}
            >
              Submit refund
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Refunds;
