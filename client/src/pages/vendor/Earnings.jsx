import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import vendorService from "../../services/vendor.service";
import AdminPagination from "../../components/admin/AdminPagination";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Paid", value: "PAID" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatStatusLabel = (s) => {
  const clean = String(s || "PENDING").trim().toLowerCase().replace(/[_-]+/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const statusClass = (raw) => {
  const s = String(raw || "").toUpperCase();
  if (s === "PAID") return "green";
  if (s === "PENDING" || s === "PROCESSING") return "amber";
  if (s === "REJECTED" || s === "CANCELLED") return "red";
  return "";
};

const Earnings = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Request Payout modal state
  const [requestOpen, setRequestOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [notesInput, setNotesInput] = useState("");
  const [requesting, setRequesting] = useState(false);

  // View Payout modal state
  const [viewingPayout, setViewingPayout] = useState(null);

  const loadData = useCallback(
    async (opts = {}) => {
      const targetPage = opts.page ?? page;
      const targetLimit = opts.limit ?? limit;
      const targetStatus = opts.status ?? statusFilter;
      const targetSearch = opts.search ?? search;

      try {
        setLoading(true);
        setError("");
        const [earnRes, payRes] = await Promise.all([
          vendorService.getEarnings(),
          vendorService.getPayouts({
            page: targetPage,
            limit: targetLimit,
            status: targetStatus !== "all" ? targetStatus : undefined,
            search: targetSearch.trim() || undefined,
          }),
        ]);

        const earnPayload = earnRes?.data ?? earnRes ?? {};
        setEarningsData(earnPayload);

        const payPayload = payRes?.data ?? payRes ?? {};
        const list = Array.isArray(payPayload?.payouts)
          ? payPayload.payouts
          : Array.isArray(payPayload)
            ? payPayload
            : [];
        const pag = payPayload?.pagination || {};
        setPayouts(list);
        setPagination({
          total: Number(pag.total ?? list.length),
          page: Number(pag.page ?? targetPage),
          limit: Number(pag.limit ?? targetLimit),
          totalPages: Math.max(
            1,
            Number(pag.totalPages ?? Math.ceil((pag.total ?? list.length) / targetLimit)),
          ),
        });
      } catch (err) {
        setError(
          err?.response?.data?.message || err?.message || "Failed to load earnings data",
        );
      } finally {
        setLoading(false);
      }
    },
    [page, limit, statusFilter, search],
  );

  useEffect(() => {
    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      loadData();
    }, delay);
    return () => clearTimeout(timer);
  }, [loadData, search]);

  const gross = Number(earningsData?.totalRevenue ?? 0);
  const fees = Number(earningsData?.totalCommission ?? 0);
  const net = Number(earningsData?.netEarnings ?? Math.max(0, gross - fees));
  const available = Number(earningsData?.availableBalance ?? 0);
  const pending = Number(earningsData?.pendingBalance ?? 0);
  const withdrawn = Number(earningsData?.totalWithdrawn ?? 0);
  const pendingOrderRev = Number(earningsData?.pendingOrderRevenue ?? 0);
  const commissionRate = Number(earningsData?.commissionRate ?? 10);
  const earnedOrdersCount = Number(earningsData?.earnedOrdersCount ?? 0);
  const bankDetails = earningsData?.bankDetails || {};

  const statCards = useMemo(
    () => [
      {
        label: "Gross revenue",
        value: money(gross),
        sub: `${earnedOrdersCount} settled order${earnedOrdersCount === 1 ? "" : "s"}`,
        tone: "var(--primary)",
      },
      {
        label: "Platform fees",
        value: money(fees),
        sub: `${commissionRate}% commission rate`,
        tone: "var(--muted)",
      },
      {
        label: "Net earnings",
        value: money(net),
        sub: `Withdrawn: ${money(withdrawn)}`,
        tone: "var(--green)",
      },
      {
        label: "Available payout",
        value: money(available),
        sub: `Pending requests: ${money(pending)}`,
        tone: available > 0 ? "var(--green)" : "var(--muted)",
      },
    ],
    [gross, earnedOrdersCount, fees, commissionRate, net, withdrawn, available, pending],
  );

  const openRequestModal = () => {
    setAmountInput(available > 0 ? String(available) : "");
    setPaymentMethod("BANK_TRANSFER");
    setNotesInput("");
    setRequestOpen(true);
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    if (requesting) return;

    const amt = Number(amountInput);
    if (!Number.isFinite(amt) || amt < 1) {
      toast.error("Payout amount must be at least ₹1");
      return;
    }
    if (amt > available) {
      toast.error(`Amount exceeds available balance (${money(available)})`);
      return;
    }

    try {
      setRequesting(true);
      await vendorService.requestPayout({
        amount: amt,
        paymentMethod,
        notes: notesInput.trim(),
      });
      toast.success("Payout request submitted successfully");
      setRequestOpen(false);
      setAmountInput("");
      setNotesInput("");
      setPage(1);
      await loadData({ page: 1 });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to submit payout request",
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div>
      <div className="pagehead flex-wrap gap-3">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Earnings</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => loadData()}
            className="outlinebtn cursor-pointer disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <button
            type="button"
            disabled={loading || available < 1}
            onClick={openRequestModal}
            className="primarybtn cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Request payout
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 text-xs font-bold text-[var(--red)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadData()}
            className="btnsm text-[var(--red)]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="notice flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: "16px" }}>
        <span>
          {bankDetails?.configured
            ? `Payout bank account: ${bankDetails.bankName || "Bank"} (${bankDetails.accountNumberMasked})${pendingOrderRev > 0 ? ` · ${money(pendingOrderRev)} in-flight order value awaiting payment/delivery.` : ""}`
            : `Configure your bank account in Shop profile before requesting a payout.${pendingOrderRev > 0 ? ` (${money(pendingOrderRev)} in-flight order value awaiting payment/delivery.)` : ""}`}
        </span>
        <Link to="/vendor/profile" className="btnsm">
          {bankDetails?.configured ? "Bank settings" : "Add bank details"}
        </Link>
      </div>

      <div className="stats">
        {statCards.map((c) => (
          <div key={c.label} className="stat">
            <span className="label">{c.label}</span>
            <strong>{loading && !earningsData ? "—" : c.value}</strong>
            <span className="trend" style={{ color: c.tone }}>
              {c.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 style={{ margin: 0 }}>Payout history</h2>
            <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
              Track your withdrawal requests and settlement references.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`btnsm cursor-pointer ${active ? "primary" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="toolbar">
          <input
            className="field"
            placeholder="Search by payout ID, transaction reference, bank, or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div id="vendorPayoutTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading payout history...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[var(--muted)]">
                    {search.trim() || statusFilter !== "all"
                      ? "No payouts match the selected filters."
                      : "No payout requests submitted yet."}
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const idLabel =
                    p.payoutNumber ||
                    (p._id ? `#PO-${String(p._id).slice(-6).toUpperCase()}` : "Payout");
                  return (
                    <tr key={p._id || idLabel}>
                      <td className="font-bold text-[var(--text)]">{idLabel}</td>
                      <td>
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="font-bold text-[var(--primary)]">{money(p.amount)}</td>
                      <td className="capitalize">
                        {String(p.paymentMethod || "BANK_TRANSFER").toLowerCase().replace(/_/g, " ")}
                      </td>
                      <td className="text-xs text-[var(--muted)]">
                        {p.transactionReference || p.bankDetails?.bankName || "—"}
                      </td>
                      <td>
                        <span className={`status ${statusClass(p.status)}`}>
                          {formatStatusLabel(p.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btnsm cursor-pointer"
                          onClick={() => setViewingPayout(p)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          itemLabel="payouts"
          loading={loading}
          onPageChange={(nextPage) => setPage(nextPage)}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {requestOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !requesting) setRequestOpen(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Request payout</h2>
              <button
                type="button"
                className="iconbtn"
                disabled={requesting}
                onClick={() => setRequestOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3.5">
                <div className="text-xs font-bold text-[var(--muted)]">
                  Available balance
                </div>
                <div className="mt-1 text-xl font-black text-[var(--primary)]">
                  {money(available)}
                </div>
              </div>

              <div className="formgroup">
                <label htmlFor="payoutAmountInput">Amount (₹)</label>
                <div className="flex gap-2">
                  <input
                    id="payoutAmountInput"
                    className="field full"
                    type="number"
                    min="1"
                    max={available}
                    step="0.01"
                    placeholder="Enter payout amount"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btnsm shrink-0"
                    onClick={() => setAmountInput(String(available))}
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="formgroup">
                <label htmlFor="payoutMethodSelect">Payment method</label>
                <select
                  id="payoutMethodSelect"
                  className="field full"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="formgroup">
                <label htmlFor="payoutNotesInput">Notes (Optional)</label>
                <textarea
                  id="payoutNotesInput"
                  rows={2}
                  className="field full"
                  placeholder="Optional reference or payout note"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="outlinebtn"
                  disabled={requesting}
                  onClick={() => setRequestOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primarybtn"
                  disabled={requesting || available < 1}
                >
                  {requesting ? "Submitting..." : "Submit payout request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingPayout && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingPayout(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>
                Payout #{String(viewingPayout._id || "").slice(-6).toUpperCase()}
              </h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setViewingPayout(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-[var(--muted)]">Amount</span>
                <strong className="text-[var(--primary)]">{money(viewingPayout.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[var(--muted)]">Status</span>
                <span className={`status ${statusClass(viewingPayout.status)}`}>
                  {formatStatusLabel(viewingPayout.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[var(--muted)]">Method</span>
                <span className="font-bold capitalize">
                  {String(viewingPayout.paymentMethod || "BANK_TRANSFER")
                    .toLowerCase()
                    .replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[var(--muted)]">Transaction ref</span>
                <span>{viewingPayout.transactionReference || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[var(--muted)]">Bank</span>
                <span>
                  {viewingPayout.bankDetails?.bankName || "—"}{" "}
                  {viewingPayout.bankDetails?.accountNumber
                    ? `(••••${String(viewingPayout.bankDetails.accountNumber).slice(-4)})`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[var(--muted)]">Requested at</span>
                <span>
                  {viewingPayout.createdAt
                    ? new Date(viewingPayout.createdAt).toLocaleString("en-IN")
                    : "—"}
                </span>
              </div>
              {viewingPayout.processedAt && (
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--muted)]">Processed at</span>
                  <span>
                    {new Date(viewingPayout.processedAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {viewingPayout.notes && (
                <div className="rounded-lg bg-[var(--soft)] p-2.5">
                  <span className="block font-bold text-[var(--muted)]">Notes</span>
                  <p className="mt-1 m-0">{viewingPayout.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;
