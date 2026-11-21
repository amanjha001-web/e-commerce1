import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import supportService from "../../services/support.service";
import AdminPagination from "../../components/admin/AdminPagination";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_for_customer", label: "Waiting For Reply" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "payout", label: "Payouts" },
  { value: "order", label: "Order" },
  { value: "payment", label: "Payment" },
  { value: "delivery", label: "Delivery" },
  { value: "product", label: "Product" },
  { value: "account", label: "Account" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest activity" },
  { value: "oldest", label: "Oldest first" },
];

const extractTicketsPayload = (res) => {
  const payload = res?.data ?? res ?? {};
  const tickets = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.tickets)
      ? payload.tickets
      : Array.isArray(res?.tickets)
        ? res.tickets
        : [];
  const summary = payload.summary || null;
  const pagination = payload.pagination || null;
  return { tickets, summary, pagination };
};

const extractTicket = (res) =>
  res?.data?.ticket || res?.ticket || (res?.data?._id ? res.data : res?.data) || res;

const normalizeStatus = (raw) => {
  const clean = String(raw || "open").trim().toLowerCase().replace(/\s+/g, "_");
  return clean === "waiting_customer" ? "waiting_for_customer" : clean;
};

const formatLabel = (raw) =>
  String(raw || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const statusBadgeClass = (raw) => {
  const status = normalizeStatus(raw);
  if (status === "resolved") return "green";
  if (status === "closed") return "red";
  return "amber";
};

const priorityBadgeClass = (raw) => {
  const priority = String(raw || "medium").toLowerCase();
  if (priority === "urgent") return "red";
  if (priority === "high") return "amber";
  if (priority === "low") return "green";
  return "";
};

const formatShortDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const INITIAL_FORM = {
  subject: "",
  category: "general",
  priority: "medium",
  orderNumber: "",
  message: "",
};

const VendorSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    pending: 0,
    inProgress: 0,
    waitingForReply: 0,
    active: 0,
    resolved: 0,
    closed: 0,
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [activeTicket, setActiveTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(search.trim()) ||
      statusFilter !== "all" ||
      categoryFilter !== "all" ||
      priorityFilter !== "all" ||
      sortBy !== "latest",
    [search, statusFilter, categoryFilter, priorityFilter, sortBy],
  );

  const fetchTickets = useCallback(
    async (opts = {}) => {
      const targetPage = opts.page ?? page;
      const targetLimit = opts.limit ?? limit;
      const targetSearch = opts.search ?? search;
      const targetStatus = opts.status ?? statusFilter;
      const targetCategory = opts.category ?? categoryFilter;
      const targetPriority = opts.priority ?? priorityFilter;
      const targetSort = opts.sort ?? sortBy;

      try {
        setLoading(true);
        setError("");
        const res = await supportService.getVendorTickets({
          page: targetPage,
          limit: targetLimit,
          search: targetSearch.trim() || undefined,
          status: targetStatus !== "all" ? targetStatus : undefined,
          category: targetCategory !== "all" ? targetCategory : undefined,
          priority: targetPriority !== "all" ? targetPriority : undefined,
          sortBy: targetSort !== "latest" ? targetSort : undefined,
        });

        const parsed = extractTicketsPayload(res);
        setTickets(parsed.tickets);
        if (parsed.summary) {
          setSummary(parsed.summary);
        } else {
          const open = parsed.tickets.filter((t) => normalizeStatus(t.status) === "open").length;
          const pending = parsed.tickets.filter((t) => normalizeStatus(t.status) === "pending").length;
          const inProgress = parsed.tickets.filter((t) => normalizeStatus(t.status) === "in_progress").length;
          const waiting = parsed.tickets.filter((t) => normalizeStatus(t.status) === "waiting_for_customer").length;
          const resolved = parsed.tickets.filter((t) => normalizeStatus(t.status) === "resolved").length;
          const closed = parsed.tickets.filter((t) => normalizeStatus(t.status) === "closed").length;
          setSummary({
            total: parsed.tickets.length,
            open,
            pending,
            inProgress,
            waitingForReply: waiting,
            active: open + pending + inProgress + waiting,
            resolved,
            closed,
          });
        }

        const pag = parsed.pagination || {};
        setPagination({
          total: Number(pag.total ?? parsed.tickets.length),
          page: Number(pag.page ?? targetPage),
          limit: Number(pag.limit ?? targetLimit),
          totalPages: Math.max(
            1,
            Number(
              pag.totalPages ??
                Math.ceil((pag.total ?? parsed.tickets.length) / Math.max(1, targetLimit)),
            ),
          ),
        });
      } catch (err) {
        console.error("Failed to fetch vendor support tickets:", err);
        const msg = err?.response?.data?.message || "Failed to load support tickets";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter, categoryFilter, priorityFilter, sortBy],
  );

  useEffect(() => {
    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      fetchTickets();
    }, delay);
    return () => clearTimeout(timer);
  }, [fetchTickets, search]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;
      if (activeTicket && !replyLoading) setActiveTicket(null);
      else if (modalOpen && !submitting) setModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [activeTicket, modalOpen, replyLoading, submitting]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSortBy("latest");
    setPage(1);
  };

  const handleSubmitTicket = async (e) => {
    e?.preventDefault?.();
    const cleanSubject = form.subject.trim();
    const cleanMessage = form.message.trim();
    const cleanOrder = form.orderNumber.trim().replace(/^#/, "");

    if (!cleanSubject || cleanSubject.length < 3) {
      toast.error("Please enter a subject (at least 3 characters)");
      return;
    }
    if (!cleanMessage) {
      toast.error("Please describe your issue in the message field");
      return;
    }

    try {
      setSubmitting(true);
      await supportService.createVendorTicket({
        subject: cleanSubject,
        category: form.category,
        priority: form.priority,
        ...(cleanOrder ? { orderNumber: cleanOrder } : {}),
        message: cleanMessage,
      });
      toast.success("Support ticket created successfully");
      setModalOpen(false);
      setForm(INITIAL_FORM);
      if (page !== 1) setPage(1);
      else await fetchTickets({ page: 1 });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTicket = async (ticketRow) => {
    const id = ticketRow._id || ticketRow.ticketId;
    setActiveTicket(ticketRow);
    setReplyText("");
    try {
      setDetailLoading(true);
      const res = await supportService.getVendorTicketById(id);
      const fresh = extractTicket(res);
      if (fresh && typeof fresh === "object") {
        setActiveTicket(fresh);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to refresh latest ticket thread");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault?.();
    if (!activeTicket || !replyText.trim()) return;
    const id = activeTicket._id || activeTicket.ticketId;
    try {
      setReplyLoading(true);
      const res = await supportService.addVendorMessage(id, {
        message: replyText.trim(),
      });
      toast.success("Reply sent to seller support");
      setReplyText("");
      const updated = extractTicket(res);
      if (updated && typeof updated === "object") {
        setActiveTicket(updated);
      }
      await fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleToggleClose = async () => {
    if (!activeTicket) return;
    const id = activeTicket._id || activeTicket.ticketId;
    const normalized = normalizeStatus(activeTicket.status);
    const isClosedOrResolved = normalized === "closed" || normalized === "resolved";
    try {
      setReplyLoading(true);
      const res = isClosedOrResolved
        ? await supportService.reopenVendorTicket(id)
        : await supportService.closeVendorTicket(id);
      toast.success(isClosedOrResolved ? "Ticket reopened" : "Ticket closed");
      const updated = extractTicket(res);
      if (updated && typeof updated === "object") {
        setActiveTicket(updated);
      }
      await fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setReplyLoading(false);
    }
  };

  const kpiCards = [
    {
      label: "Total tickets",
      value: summary.total,
      sub: "All time requests",
      active: !hasActiveFilters,
      onClick: handleResetFilters,
    },
    {
      label: "Open & pending",
      value: Number(summary.open || 0) + Number(summary.pending || 0),
      sub: `${Number(summary.open || 0)} open · ${Number(summary.pending || 0)} pending`,
      tone: "var(--amber)",
      active: statusFilter === "open" || statusFilter === "pending",
      onClick: () => {
        setStatusFilter(statusFilter === "open" ? "all" : "open");
        setPage(1);
      },
    },
    {
      label: "In progress",
      value: Number(summary.inProgress || 0) + Number(summary.waitingForReply || 0),
      sub:
        Number(summary.waitingForReply || 0) > 0
          ? `${summary.waitingForReply} awaiting your reply`
          : "Being reviewed by team",
      tone: "var(--primary)",
      active:
        statusFilter === "in_progress" || statusFilter === "waiting_for_customer",
      onClick: () => {
        setStatusFilter(
          statusFilter === "waiting_for_customer" ? "in_progress" : "waiting_for_customer",
        );
        setPage(1);
      },
    },
    {
      label: "Resolved & closed",
      value: Number(summary.resolved || 0) + Number(summary.closed || 0),
      sub: `${Number(summary.resolved || 0)} resolved · ${Number(summary.closed || 0)} closed`,
      tone: "var(--green)",
      active: statusFilter === "resolved" || statusFilter === "closed",
      onClick: () => {
        setStatusFilter(statusFilter === "resolved" ? "closed" : "resolved");
        setPage(1);
      },
    },
  ];

  const activeStatus = activeTicket ? normalizeStatus(activeTicket.status) : "open";
  const isClosed = activeStatus === "closed";
  const isResolvedOrClosed = activeStatus === "closed" || activeStatus === "resolved";
  const linkedOrderId =
    activeTicket?.orderId?._id ||
    (typeof activeTicket?.orderId === "string" ? activeTicket.orderId : "");

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Support</h1>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="outlinebtn"
            onClick={() => fetchTickets()}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
          <button
            type="button"
            className="primarybtn"
            onClick={() => setModalOpen(true)}
          >
            + Create ticket
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="stats" style={{ marginBottom: "18px" }}>
        {kpiCards.map((card) => (
          <button
            key={card.label}
            type="button"
            className="stat"
            onClick={card.onClick}
            style={{
              textAlign: "left",
              cursor: "pointer",
              borderColor: card.active ? "var(--primary)" : undefined,
              boxShadow: card.active ? "0 0 0 2px var(--soft)" : undefined,
            }}
          >
            <div className="muted" style={{ fontSize: "12px", fontWeight: 700 }}>
              {card.label}
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 900,
                marginTop: "6px",
                color: card.tone || "var(--text)",
              }}
            >
              {card.value}
            </div>
            <div className="muted" style={{ fontSize: "11px", marginTop: "4px" }}>
              {card.sub}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="notice"
          style={{
            marginBottom: "14px",
            background: "#fff0f1",
            borderColor: "#f3cbd0",
            color: "#bd3345",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span>{error}</span>
          <button type="button" className="btnsm" onClick={() => fetchTickets()}>
            Retry
          </button>
        </div>
      )}

      <div className="panel">
        <div className="pagehead" style={{ marginBottom: "10px" }}>
          <div>
            <h2 style={{ marginBottom: "4px" }}>Seller support</h2>
            <p className="muted" style={{ margin: 0 }}>
              Contact our seller success team for help with orders, payouts, listings, and account verification.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "16px",
            marginTop: "14px",
          }}
        >
          <input
            className="field"
            style={{ minWidth: "230px", flex: "1 1 230px" }}
            placeholder="Search ticket #, subject, or order #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page !== 1) setPage(1);
            }}
          />

          <select
            className="field"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="field"
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All categories</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="field"
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All priorities</option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="field"
            aria-label="Sort tickets"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button type="button" className="outlinebtn" onClick={handleResetFilters}>
              Reset
            </button>
          )}
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "28px" }}>
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                    {hasActiveFilters ? (
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                          No support tickets match your filters
                        </div>
                        <button
                          type="button"
                          className="btnsm"
                          onClick={handleResetFilters}
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      <span>
                        No support tickets yet. Click <b>+ Create ticket</b> to get help.
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const status = normalizeStatus(t.status);
                  const priority = String(t.priority || "medium").toLowerCase();
                  const messageCount = t.messageCount ?? t.messages?.length ?? 0;
                  const waitingReply = status === "waiting_for_customer";
                  const statusDisplay =
                    waitingReply ? "Waiting for reply" : formatLabel(status);
                  return (
                    <tr key={t._id || t.ticketId}>
                      <td style={{ whiteSpace: "normal" }}>
                        <div style={{ fontWeight: 800 }}>
                          #{t.ticketId || t.ticketNumber || String(t._id).slice(-6)}
                        </div>
                        {t.orderNumber ? (
                          <div className="muted" style={{ fontSize: "11px" }}>
                            Order #{t.orderNumber}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ whiteSpace: "normal", minWidth: "220px", maxWidth: "340px" }}>
                        <div style={{ fontWeight: 700 }}>
                          {t.subject || "Support Request"}
                        </div>
                        <div className="muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                          {messageCount} {messageCount === 1 ? "message" : "messages"}
                          {t.assigneeName ? ` · Assigned: ${t.assigneeName}` : ""}
                          {waitingReply ? " · Action needed" : ""}
                        </div>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {t.category || "general"}
                      </td>
                      <td>
                        <span className={`status ${priorityBadgeClass(priority)}`}>
                          {formatLabel(priority)}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${statusBadgeClass(status)}`}>
                          {statusDisplay}
                        </span>
                      </td>
                      <td className="muted" style={{ fontSize: "12px" }}>
                        {formatShortDate(t.updatedAt || t.createdAt)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btnsm"
                          onClick={() => handleOpenTicket(t)}
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
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          itemLabel="tickets"
          loading={loading}
          onPageChange={(nextPage) => setPage(nextPage)}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Create Ticket Modal */}
      {modalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setModalOpen(false);
          }}
        >
          <form className="modal" onSubmit={handleSubmitTicket}>
            <div className="modalhead">
              <h2>Create vendor ticket</h2>
              <button
                type="button"
                className="iconbtn"
                disabled={submitting}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="formgroup">
              <label htmlFor="vendor-ticket-subject">Subject *</label>
              <input
                id="vendor-ticket-subject"
                className="field full"
                placeholder="Brief summary of your issue"
                maxLength={160}
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>

            <div className="formgrid" style={{ marginTop: "12px" }}>
              <div className="formgroup">
                <label htmlFor="vendor-ticket-category">Category</label>
                <select
                  id="vendor-ticket-category"
                  className="field full"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="formgroup">
                <label htmlFor="vendor-ticket-priority">Priority</label>
                <select
                  id="vendor-ticket-priority"
                  className="field full"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priority: e.target.value }))
                  }
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formgroup" style={{ marginTop: "12px" }}>
              <label htmlFor="vendor-ticket-order">
                Related Order # <span className="muted">(optional)</span>
              </label>
              <input
                id="vendor-ticket-order"
                className="field full"
                placeholder="e.g. SS-10482"
                value={form.orderNumber}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, orderNumber: e.target.value }))
                }
              />
            </div>

            <div className="formgroup" style={{ marginTop: "12px" }}>
              <label htmlFor="vendor-ticket-message">Message *</label>
              <textarea
                id="vendor-ticket-message"
                className="field full"
                rows={4}
                placeholder="Describe your issue, payout reference, or product SKU details..."
                value={form.message}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, message: e.target.value }))
                }
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                className="outlinebtn"
                disabled={submitting}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primarybtn" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit ticket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Detail & Conversation Modal */}
      {activeTicket && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget && !replyLoading) {
              setActiveTicket(null);
            }
          }}
        >
          <div className="modal" style={{ width: "min(640px, 100%)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modalhead">
              <div>
                <div className="muted" style={{ fontSize: "12px", fontWeight: 700 }}>
                  #{activeTicket.ticketId || String(activeTicket._id).slice(-6)}
                  {activeTicket.createdAt
                    ? ` · Created ${formatDateTime(activeTicket.createdAt)}`
                    : ""}
                </div>
                <h2 style={{ marginTop: "4px" }}>{activeTicket.subject}</h2>
              </div>
              <button
                type="button"
                className="iconbtn"
                disabled={replyLoading}
                onClick={() => setActiveTicket(null)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <span className="pill" style={{ textTransform: "capitalize" }}>
                {activeTicket.category || "general"}
              </span>
              <span
                className={`status ${priorityBadgeClass(activeTicket.priority)}`}
              >
                {formatLabel(activeTicket.priority || "medium")} priority
              </span>
              <span className={`status ${statusBadgeClass(activeStatus)}`}>
                {activeStatus === "waiting_for_customer"
                  ? "Waiting for reply"
                  : formatLabel(activeStatus)}
              </span>
              {activeTicket.assigneeName && (
                <span className="muted" style={{ fontSize: "12px" }}>
                  Assigned to <b>{activeTicket.assigneeName}</b>
                </span>
              )}
              {activeTicket.orderNumber && (
                linkedOrderId ? (
                  <Link
                    to={`/vendor/orders/${linkedOrderId}`}
                    className="btnsm"
                    onClick={() => setActiveTicket(null)}
                  >
                    Order #{activeTicket.orderNumber} ↗
                  </Link>
                ) : (
                  <span className="pill">Order #{activeTicket.orderNumber}</span>
                )
              )}
            </div>

            {activeStatus === "waiting_for_customer" && (
              <div className="notice" style={{ marginBottom: "12px" }}>
                <b>Action needed:</b> Our support team replied and is waiting for your response.
              </div>
            )}

            {activeTicket.resolution && isResolvedOrClosed && (
              <div
                className="notice"
                style={{
                  marginBottom: "12px",
                  background: "#e7f6ef",
                  borderColor: "#b9e4cf",
                  color: "#166549",
                }}
              >
                <b>Resolution:</b> {activeTicket.resolution}
              </div>
            )}

            {detailLoading && (
              <p className="muted" style={{ fontSize: "12px", marginBottom: "8px" }}>
                Syncing latest conversation...
              </p>
            )}

            <div
              style={{
                maxHeight: "280px",
                overflowY: "auto",
                marginBottom: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {(activeTicket.messages || []).length === 0 ? (
                <p className="muted">No messages yet.</p>
              ) : (
                (activeTicket.messages || []).map((m, idx) => {
                  const senderRole = String(m.sender?.role || "").toLowerCase();
                  const isStaff =
                    senderRole === "admin" || senderRole === "super_admin";
                  const senderLabel = isStaff
                    ? m.sender?.fullName ||
                      m.sender?.name ||
                      m.sender?.username ||
                      "Support Team"
                    : "You (Seller)";
                  return (
                    <div
                      key={m._id || idx}
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        border: isStaff
                          ? "1px solid #f3cbd0"
                          : "1px solid var(--line)",
                        background: isStaff ? "#fcf9fa" : "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          marginBottom: "6px",
                        }}
                      >
                        <span>
                          {senderLabel}
                          {isStaff ? " · Seller Support" : ""}
                        </span>
                        <span className="muted" style={{ fontWeight: 500 }}>
                          {formatDateTime(m.createdAt)}
                        </span>
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: 1.5 }}>
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!isClosed ? (
              <form onSubmit={handleSendReply}>
                <div className="formgroup">
                  <label htmlFor="vendor-ticket-reply">Reply to support</label>
                  <textarea
                    id="vendor-ticket-reply"
                    className="field full"
                    rows={3}
                    placeholder="Write your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btnsm"
                    disabled={replyLoading}
                    onClick={handleToggleClose}
                  >
                    {isResolvedOrClosed ? "↻ Reopen Ticket" : "Close Ticket"}
                  </button>
                  <button
                    type="submit"
                    className="primarybtn"
                    disabled={replyLoading || !replyText.trim()}
                  >
                    {replyLoading ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </form>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--line)",
                  flexWrap: "wrap",
                }}
              >
                <span className="muted" style={{ fontSize: "12px" }}>
                  This ticket is closed. Reopen it to send a follow-up message.
                </span>
                <button
                  type="button"
                  className="btnsm primary"
                  disabled={replyLoading}
                  onClick={handleToggleClose}
                >
                  {replyLoading ? "Reopening..." : "↻ Reopen Ticket"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSupport;
