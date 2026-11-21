import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";
import AdminPagination from "../../components/admin/AdminPagination";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatusLabel = (status) =>
  String(status || "pending")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const getStatusBadgeClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "processed" || s === "completed" || s === "approved") return "green";
  if (s === "pending" || s === "requested") return "amber";
  if (s === "rejected" || s === "failed") return "red";
  return "";
};

const Refunds = () => {
  const [activeTab, setActiveTab] = useState("refunds"); // "refunds" | "returns"

  const [refunds, setRefunds] = useState([]);
  const [returns, setReturns] = useState([]);
  const [refundSummary, setRefundSummary] = useState(null);
  const [returnSummary, setReturnSummary] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [viewingItem, setViewingItem] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [processRefundOnReturn, setProcessRefundOnReturn] = useState(false);
  const [modalError, setModalError] = useState("");

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newRefundForm, setNewRefundForm] = useState({
    orderId: "",
    amount: "",
    reason: "",
  });
  const [createError, setCreateError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTabData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      if (activeTab === "refunds") {
        const res = await adminService.getRefundRequests(params);
        const data = res?.data ?? res;
        const list = Array.isArray(data?.refunds)
          ? data.refunds
          : Array.isArray(data)
            ? data
            : [];
        setRefunds(list);
        if (data?.summary) setRefundSummary(data.summary);
        if (data?.pagination) {
          setPagination((prev) => ({ ...prev, ...data.pagination }));
        } else {
          setPagination({
            total: list.length,
            page: 1,
            limit,
            totalPages: Math.max(1, Math.ceil(list.length / limit)),
          });
        }
      } else {
        const res = await adminService.getReturnRequests(params);
        const data = res?.data ?? res;
        const list = Array.isArray(data?.returns)
          ? data.returns
          : Array.isArray(data)
            ? data
            : [];
        setReturns(list);
        if (data?.summary) setReturnSummary(data.summary);
        if (data?.pagination) {
          setPagination((prev) => ({ ...prev, ...data.pagination }));
        } else {
          setPagination({
            total: list.length,
            page: 1,
            limit,
            totalPages: Math.max(1, Math.ceil(list.length / limit)),
          });
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to load ${activeTab === "refunds" ? "refund" : "return"} requests`,
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchTabData();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [fetchTabData, search]);

  const rows = useMemo(() => {
    const source = activeTab === "refunds" ? refunds : returns;
    return (Array.isArray(source) ? source : []).map((r, i) => {
      const userObj =
        (r.userId && typeof r.userId === "object" && r.userId) ||
        (r.user && typeof r.user === "object" && r.user) ||
        null;
      const orderObj =
        (r.orderId && typeof r.orderId === "object" && r.orderId) ||
        (r.order && typeof r.order === "object" && r.order) ||
        null;

      const rawStatus = String(r.status || "pending").toLowerCase();
      const requestCode =
        activeTab === "refunds"
          ? r.refundCode ||
            (r._id ? `RF-${String(r._id).slice(-5).toUpperCase()}` : `RF-${101 + i}`)
          : r.returnCode ||
            (r._id ? `RT-${String(r._id).slice(-5).toUpperCase()}` : `RT-${101 + i}`);

      const orderNumber =
        r.orderNumber ||
        orderObj?.orderNumber ||
        (r.orderRefId
          ? `#SS-${String(r.orderRefId).slice(-5).toUpperCase()}`
          : "—");

      const customerName =
        r.customerName ||
        userObj?.fullName ||
        userObj?.name ||
        userObj?.username ||
        userObj?.email ||
        "Customer";

      const rawAmount = Number(
        r.amount ?? r.orderTotal ?? orderObj?.totalAmount ?? 0,
      );

      return {
        ...r,
        _key: r._id || requestCode || i,
        _kind: activeTab,
        _requestCode: requestCode,
        _orderNumber: orderNumber,
        _customerName: customerName,
        _customerEmail: r.customerEmail || userObj?.email || "",
        _customerPhone: r.customerPhone || userObj?.phone || "",
        _rawAmount: rawAmount,
        _amountLabel: money(rawAmount),
        _reason: r.reason || "Customer request",
        _rawStatus: rawStatus,
        _statusLabel: formatStatusLabel(rawStatus),
        _statusClass: getStatusBadgeClass(rawStatus),
        _createdLabel: formatDate(r.createdAt),
        _isPending:
          activeTab === "refunds"
            ? ["pending", "requested", "approved"].includes(rawStatus)
            : rawStatus === "pending",
      };
    });
  }, [activeTab, refunds, returns]);

  const openReviewModal = (item, openInRejectMode = false) => {
    setViewingItem(item);
    setRejectMode(openInRejectMode);
    setRejectReason("");
    setAdminNotes(item.adminNotes || "");
    setApproveAmount(item._rawAmount ? String(item._rawAmount) : "");
    setProcessRefundOnReturn(false);
    setModalError("");
  };

  const closeReviewModal = () => {
    if (saving) return;
    setViewingItem(null);
    setRejectMode(false);
    setRejectReason("");
    setAdminNotes("");
    setApproveAmount("");
    setProcessRefundOnReturn(false);
    setModalError("");
  };

  const handleSwitchTab = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setStatusFilter("all");
    setSearch("");
    setPage(1);
    setError("");
  };

  const handleApproveItem = async (item, fromModal = false) => {
    if (!item?._id || saving) return;

    try {
      setSaving(true);
      setModalError("");

      if (item._kind === "refunds") {
        const payload = {
          ...(fromModal && approveAmount
            ? { amount: Number(approveAmount) }
            : { amount: item._rawAmount || undefined }),
          ...(fromModal && adminNotes.trim()
            ? { adminNotes: adminNotes.trim() }
            : {}),
        };
        await adminService.approveRefundRequest(item._id, payload);
        toast.success("Refund approved & processed");
      } else {
        const payload = {
          ...(fromModal && adminNotes.trim()
            ? { adminNotes: adminNotes.trim() }
            : {}),
          ...(fromModal && processRefundOnReturn
            ? { processRefund: true, amount: approveAmount ? Number(approveAmount) : undefined }
            : {}),
        };
        await adminService.approveReturnRequest(item._id, payload);
        toast.success(
          fromModal && processRefundOnReturn
            ? "Return approved & refund processed"
            : "Return request approved",
        );
      }

      setViewingItem(null);
      await fetchTabData();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to approve request";
      if (fromModal) setModalError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectItem = async (item) => {
    if (!item?._id || saving) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setModalError("Please provide a rejection reason.");
      return;
    }

    try {
      setSaving(true);
      setModalError("");

      if (item._kind === "refunds") {
        await adminService.rejectRefundRequest(item._id, {
          reason,
          adminNotes: adminNotes.trim() || reason,
        });
        toast.success("Refund request rejected");
      } else {
        await adminService.rejectReturnRequest(item._id, {
          reason,
          adminNotes: adminNotes.trim() || reason,
        });
        toast.success("Return request rejected");
      }

      setViewingItem(null);
      setRejectMode(false);
      await fetchTabData();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to reject request";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateManualRefund = async (e) => {
    e?.preventDefault();
    if (saving) return;

    const orderIdentifier = newRefundForm.orderId.trim();
    if (!orderIdentifier) {
      setCreateError("Order ID or Order Number is required.");
      return;
    }

    const parsedAmount = newRefundForm.amount ? Number(newRefundForm.amount) : undefined;
    if (
      parsedAmount !== undefined &&
      (!Number.isFinite(parsedAmount) || parsedAmount <= 0)
    ) {
      setCreateError("Refund amount must be a positive number.");
      return;
    }

    try {
      setSaving(true);
      setCreateError("");
      await adminService.createManualRefund({
        orderId: orderIdentifier,
        ...(parsedAmount !== undefined ? { amount: parsedAmount } : {}),
        reason: newRefundForm.reason.trim() || "Admin processed refund",
      });
      toast.success("Refund processed successfully");
      setNewModalOpen(false);
      setNewRefundForm({ orderId: "", amount: "", reason: "" });
      if (activeTab !== "refunds") setActiveTab("refunds");
      await fetchTabData();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to process refund";
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const currentSummary = activeTab === "refunds" ? refundSummary : returnSummary;
  const kpiCards =
    activeTab === "refunds"
      ? [
          {
            label: "Total refunds",
            value: currentSummary?.total ?? pagination.total ?? rows.length,
            filter: "all",
          },
          {
            label: "Pending review",
            value:
              currentSummary?.pending ??
              rows.filter((r) => ["pending", "requested"].includes(r._rawStatus)).length,
            filter: "pending",
          },
          {
            label: "Processed",
            value:
              currentSummary?.processed ??
              rows.filter((r) => r._rawStatus === "processed").length,
            filter: "processed",
          },
          {
            label: "Rejected",
            value:
              currentSummary?.rejected ??
              rows.filter((r) => r._rawStatus === "rejected").length,
            filter: "rejected",
          },
          {
            label: "Refunded volume",
            value: money(currentSummary?.totalRefundedAmount ?? 0),
            filter: null,
          },
        ]
      : [
          {
            label: "Total returns",
            value: currentSummary?.total ?? pagination.total ?? rows.length,
            filter: "all",
          },
          {
            label: "Pending review",
            value:
              currentSummary?.pending ??
              rows.filter((r) => r._rawStatus === "pending").length,
            filter: "pending",
          },
          {
            label: "Approved",
            value:
              currentSummary?.approved ??
              rows.filter((r) => r._rawStatus === "approved").length,
            filter: "approved",
          },
          {
            label: "Completed",
            value:
              currentSummary?.completed ??
              rows.filter((r) => r._rawStatus === "completed").length,
            filter: "completed",
          },
          {
            label: "Rejected",
            value:
              currentSummary?.rejected ??
              rows.filter((r) => r._rawStatus === "rejected").length,
            filter: "rejected",
          },
        ];

  return (
    <div className="space-y-6">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Refund & return requests</h1>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => (
          <button
            key={card.label}
            type="button"
            disabled={!card.filter}
            onClick={() => {
              if (!card.filter) return;
              setStatusFilter(card.filter);
              setPage(1);
            }}
            className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition ${
              card.filter
                ? statusFilter === card.filter
                  ? "cursor-pointer border-[var(--primary)] ring-2 ring-[var(--soft)]"
                  : "cursor-pointer border-[var(--line)] hover:border-[var(--primary)]/50"
                : "cursor-default border-[var(--line)]"
            }`}
          >
            <p className="text-xs font-bold text-[var(--muted)]">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-[var(--text)]">{card.value}</p>
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-semibold text-[#bd3345]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="cursor-pointer text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              className={activeTab === "refunds" ? "primarybtn" : "outlinebtn"}
              onClick={() => handleSwitchTab("refunds")}
            >
              Refund requests
            </button>
            <button
              type="button"
              className={activeTab === "returns" ? "primarybtn" : "outlinebtn"}
              onClick={() => handleSwitchTab("returns")}
            >
              Return requests
            </button>
          </div>

          <button
            type="button"
            className="primarybtn"
            onClick={() => {
              setCreateError("");
              setNewModalOpen(true);
            }}
          >
            + Process refund
          </button>
        </div>

        <div className="toolbar">
          <input
            className="field"
            placeholder="Search order #, customer, email or reason..."
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
            <option value="all">All statuses</option>
            {activeTab === "refunds" ? (
              <>
                <option value="pending">Pending</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="processed">Processed</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
              </>
            ) : (
              <>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </>
            )}
          </select>

          {(search || statusFilter !== "all") && (
            <button
              type="button"
              className="outlinebtn"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </div>

        <div className="tablewrap">
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
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading {activeTab === "refunds" ? "refund" : "return"} requests...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[var(--muted)]">
                    No {activeTab === "refunds" ? "refund" : "return"} requests found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._key}>
                    <td>
                      <div className="font-bold text-[var(--text)]">{r._requestCode}</div>
                      <div className="text-[11px] text-[var(--muted)]">{r._createdLabel}</div>
                    </td>
                    <td>
                      <div className="font-bold text-[var(--text)]">{r._orderNumber}</div>
                      {r.paymentMethod && (
                        <div className="text-[11px] uppercase text-[var(--muted)]">
                          {r.paymentMethod} · {formatStatusLabel(r.paymentStatus || "pending")}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="font-semibold text-[var(--text)]">{r._customerName}</div>
                      {r._customerEmail && (
                        <div className="text-[11px] text-[var(--muted)]">{r._customerEmail}</div>
                      )}
                    </td>
                    <td className="font-bold text-[var(--text)]">{r._amountLabel}</td>
                    <td>
                      <div className="max-w-[240px] truncate" title={r._reason}>
                        {r._reason}
                      </div>
                    </td>
                    <td>
                      <span className={`status ${r._statusClass}`}>{r._statusLabel}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btnsm"
                          onClick={() => openReviewModal(r, false)}
                        >
                          View
                        </button>
                        {r._isPending && (
                          <>
                            <button
                              type="button"
                              className="btnsm primary"
                              disabled={saving}
                              onClick={() => handleApproveItem(r, false)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btnsm"
                              disabled={saving}
                              onClick={() => openReviewModal(r, true)}
                            >
                              Reject
                            </button>
                          </>
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
          currentPage={page}
          totalPages={
            pagination.totalPages ||
            Math.ceil((pagination.total || rows.length) / limit) ||
            1
          }
          totalItems={pagination.total ?? rows.length}
          pageSize={limit}
          itemLabel={activeTab === "refunds" ? "refund requests" : "return requests"}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {/* View / Approve / Reject Modal */}
      {viewingItem && (
        <Modal
          isOpen={Boolean(viewingItem)}
          onClose={closeReviewModal}
          title={`${viewingItem._kind === "refunds" ? "Refund" : "Return"} ${viewingItem._requestCode}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[#fcf9fa] p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Order</p>
                <p className="text-sm font-bold text-[var(--text)]">{viewingItem._orderNumber}</p>
                <p className="text-xs text-[var(--muted)]">
                  Order status: {formatStatusLabel(viewingItem.orderStatus || "—")}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Status</p>
                <span className={`status ${viewingItem._statusClass}`}>
                  {viewingItem._statusLabel}
                </span>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Amount: <b className="text-[var(--text)]">{viewingItem._amountLabel}</b>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Customer</p>
                <p className="text-xs font-bold text-[var(--text)]">{viewingItem._customerName}</p>
                {viewingItem._customerEmail && (
                  <p className="text-xs text-[var(--muted)]">{viewingItem._customerEmail}</p>
                )}
                {viewingItem._customerPhone && (
                  <p className="text-xs text-[var(--muted)]">{viewingItem._customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Payment</p>
                <p className="text-xs font-bold text-[var(--text)]">
                  {formatStatusLabel(viewingItem.paymentMethod || "Online")} ·{" "}
                  {formatStatusLabel(viewingItem.paymentStatus || (viewingItem.isPaid ? "paid" : "pending"))}
                </p>
                {viewingItem.razorpayRefundId && (
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    Razorpay Refund ID: {viewingItem.razorpayRefundId}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] p-3">
              <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Customer reason</p>
              <p className="mt-1 text-xs font-medium text-[var(--text)]">{viewingItem._reason}</p>
              {viewingItem.rejectionReason && (
                <p className="mt-2 text-xs font-semibold text-[#bd3345]">
                  Rejection reason: {viewingItem.rejectionReason}
                </p>
              )}
              {viewingItem.processedAt && (
                <p className="mt-2 text-[11px] text-[var(--muted)]">
                  Processed on {formatDate(viewingItem.processedAt)}
                  {viewingItem.processedByName ? ` by ${viewingItem.processedByName}` : ""}
                </p>
              )}
            </div>

            {viewingItem._isPending && (
              <div className="space-y-3 border-t border-[var(--line)] pt-3">
                {!rejectMode ? (
                  <>
                    {(viewingItem._kind === "refunds" || viewingItem.isPaid) && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="formgroup">
                          <label>Refund amount (₹)</label>
                          <input
                            type="number"
                            min="1"
                            max={viewingItem._rawAmount || undefined}
                            className="field full"
                            value={approveAmount}
                            onChange={(e) => setApproveAmount(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                        <div className="formgroup">
                          <label>Admin notes (optional)</label>
                          <input
                            className="field full"
                            placeholder="Internal note..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    )}

                    {viewingItem._kind === "returns" && viewingItem.isPaid && (
                      <label className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                        <input
                          type="checkbox"
                          checked={processRefundOnReturn}
                          onChange={(e) => setProcessRefundOnReturn(e.target.checked)}
                          disabled={saving}
                        />
                        Also process payment refund immediately on approval
                      </label>
                    )}
                  </>
                ) : (
                  <div className="formgroup">
                    <label>Rejection reason *</label>
                    <textarea
                      rows={3}
                      className="field full"
                      placeholder="Explain why this request is rejected..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                )}
              </div>
            )}

            {modalError && (
              <p
                role="alert"
                className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-3.5 py-2.5 text-xs font-semibold text-[#bd3345]"
              >
                {modalError}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-3">
              <Button variant="outline" disabled={saving} onClick={closeReviewModal}>
                Close
              </Button>

              {viewingItem._isPending && !rejectMode && (
                <>
                  <Button
                    variant="danger"
                    disabled={saving}
                    onClick={() => setRejectMode(true)}
                  >
                    Reject
                  </Button>
                  <Button
                    loading={saving}
                    onClick={() => handleApproveItem(viewingItem, true)}
                  >
                    {viewingItem._kind === "refunds"
                      ? "Approve & Process Refund"
                      : processRefundOnReturn
                        ? "Approve Return & Refund"
                        : "Approve Return"}
                  </Button>
                </>
              )}

              {viewingItem._isPending && rejectMode && (
                <>
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setRejectMode(false);
                      setModalError("");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="danger"
                    loading={saving}
                    onClick={() => handleRejectItem(viewingItem)}
                  >
                    Confirm Rejection
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Process Refund Modal */}
      {newModalOpen && (
        <Modal
          isOpen={newModalOpen}
          onClose={() => {
            if (!saving) setNewModalOpen(false);
          }}
          title="Process order refund"
          size="md"
        >
          <form onSubmit={handleCreateManualRefund} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="formgroup">
                <label>Order ID or Order Number *</label>
                <input
                  className="field full"
                  placeholder="e.g. ORD-1001 or Order ID"
                  value={newRefundForm.orderId}
                  onChange={(e) =>
                    setNewRefundForm((prev) => ({
                      ...prev,
                      orderId: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
              <div className="formgroup">
                <label>Amount (₹) (blank = full refundable)</label>
                <input
                  type="number"
                  min="1"
                  className="field full"
                  placeholder="Optional partial/full amount"
                  value={newRefundForm.amount}
                  onChange={(e) =>
                    setNewRefundForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="formgroup">
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
                disabled={saving}
              />
            </div>

            {createError && (
              <p
                role="alert"
                className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-3.5 py-2.5 text-xs font-semibold text-[#bd3345]"
              >
                {createError}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setNewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Submit refund
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Refunds;
