import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";
import AdminPagination from "../../components/admin/AdminPagination";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_for_customer", label: "Waiting Customer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const CATEGORY_OPTIONS = [
  { value: "order", label: "Order" },
  { value: "payment", label: "Payment" },
  { value: "delivery", label: "Delivery" },
  { value: "product", label: "Product" },
  { value: "account", label: "Account" },
  { value: "payout", label: "Payout" },
  { value: "general", label: "General" },
];

const statusClass = (s) => {
  const val = String(s || "").toLowerCase();
  if (["delivered", "active", "resolved"].includes(val)) return "green";
  if (
    [
      "pending",
      "processing",
      "open",
      "in_progress",
      "waiting_for_customer",
      "waiting_customer",
    ].includes(val)
  ) {
    return "amber";
  }
  if (["blocked", "cancelled", "rejected", "closed"].includes(val)) return "red";
  return "";
};

const priorityBadgeClass = (p) => {
  const val = String(p || "").toLowerCase();
  if (val === "urgent") return "red";
  if (val === "high") return "amber";
  if (val === "low") return "green";
  return "";
};

const formatLabel = (val) =>
  String(val || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatShortDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeTicketRow = (t, i = 0) => {
  const rawStatusVal = String(t?.status || "open")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const rawStatus =
    rawStatusVal === "waiting_customer" ? "waiting_for_customer" : rawStatusVal;
  const rawPriority = String(t?.priority || "medium").trim().toLowerCase();
  const rawCategory = String(t?.category || t?.type || "general")
    .trim()
    .toLowerCase();

  const senderFallback = t?.messages?.find(
    (m) =>
      m?.sender &&
      typeof m.sender === "object" &&
      !["admin", "super_admin"].includes(String(m.sender.role || "").toLowerCase()),
  )?.sender;

  const userObj =
    (typeof t?.userId === "object" && t.userId) ||
    (typeof t?.user === "object" && t.user) ||
    (typeof t?.customerId === "object" && t.customerId) ||
    (typeof t?.customer === "object" && t.customer) ||
    senderFallback ||
    {};

  const customerEmail =
    t?.customerEmail ||
    userObj?.email ||
    t?.userEmail ||
    t?.requesterEmail ||
    t?.email ||
    "";

  const customer =
    t?.customerName ||
    userObj?.fullName ||
    userObj?.name ||
    userObj?.username ||
    t?.userName ||
    (customerEmail && customerEmail.includes("@")
      ? customerEmail.split("@")[0]
      : "") ||
    "Customer";

  const customerPhone = t?.customerPhone || userObj?.phone || t?.phone || "";

  const assigneeObj =
    t?.assignedTo && typeof t.assignedTo === "object" ? t.assignedTo : null;
  const assigneeId = assigneeObj?._id || (typeof t?.assignedTo === "string" ? t.assignedTo : "");
  const assigneeName =
    t?.assigneeName ||
    assigneeObj?.fullName ||
    assigneeObj?.name ||
    assigneeObj?.username ||
    assigneeObj?.email ||
    "";

  const messages = Array.isArray(t?.messages) ? t.messages : [];
  const internalNotes = Array.isArray(t?.internalNotes) ? t.internalNotes : [];

  return {
    ...t,
    ticket: t?.ticketId || t?.ticketNumber || t?.id || `#TK-${201 + i}`,
    customer,
    customerEmail,
    customerPhone,
    assigneeId: assigneeId || "",
    assigneeName,
    subject: t?.subject || t?.title || "Support request",
    rawCategory,
    categoryLabel: formatLabel(rawCategory),
    rawPriority,
    priority: formatLabel(rawPriority),
    rawStatus,
    status: formatLabel(rawStatus),
    messages,
    internalNotes,
    messageCount: t?.messageCount ?? messages.length,
    noteCount: t?.noteCount ?? internalNotes.length,
    resolution: t?.resolution || "",
    resolvedAt: t?.resolvedAt || null,
  };
};

const Support = ({ tickets: propTickets = [] }) => {
  const [apiTickets, setApiTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [agents, setAgents] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [activeTicket, setActiveTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("messages");
  const [ticketHistory, setTicketHistory] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyNextStatus, setReplyNextStatus] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminService
      .getSupportAgents()
      .then((res) => {
        const list = res?.data?.agents || res?.agents || [];
        if (mounted && Array.isArray(list)) {
          setAgents(list);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (assignedFilter !== "all") params.assignedTo = assignedFilter;
      if (search.trim()) params.search = search.trim();

      const response = await adminService.getSupportTickets(params);
      const data = response?.data ?? response;
      const list = data?.tickets || data || [];
      setApiTickets(Array.isArray(list) ? list : []);
      if (data?.summary) {
        setSummary(data.summary);
      }
      if (data?.pagination) {
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      } else {
        const count = Array.isArray(list) ? list.length : 0;
        setPagination({
          total: count,
          page: 1,
          limit,
          totalPages: Math.max(1, Math.ceil(count / limit)),
        });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load support tickets";
      setError(msg);
      toast.error(msg);
      setApiTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, priorityFilter, categoryFilter, assignedFilter]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchTickets();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [fetchTickets, search]);

  const isPropDriven = propTickets.length > 0;

  const rows = useMemo(() => {
    const source = isPropDriven ? propTickets : apiTickets;
    return source.map((t, i) => normalizeTicketRow(t, i));
  }, [isPropDriven, propTickets, apiTickets]);

  const visibleRows = useMemo(() => {
    if (!isPropDriven) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.rawStatus !== statusFilter) return false;
      if (priorityFilter !== "all" && r.rawPriority !== priorityFilter) return false;
      if (categoryFilter !== "all" && r.rawCategory !== categoryFilter) return false;
      if (assignedFilter === "unassigned" && r.assigneeId) return false;
      if (assignedFilter === "assigned" && !r.assigneeId) return false;
      if (
        !["all", "unassigned", "assigned"].includes(assignedFilter) &&
        String(r.assigneeId) !== assignedFilter
      ) {
        return false;
      }
      if (!q) return true;
      return `${r.ticket} ${r.customer} ${r.customerEmail} ${r.subject} ${r.priority} ${r.status} ${r.categoryLabel}`
        .toLowerCase()
        .includes(q);
    });
  }, [
    isPropDriven,
    rows,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
    assignedFilter,
  ]);

  const paginationTotal = pagination?.total;

  const kpiStats = useMemo(() => {
    const fallbackOpen = rows.filter((r) => r.rawStatus === "open").length;
    const fallbackPending = rows.filter((r) => r.rawStatus === "pending").length;
    const fallbackProgress = rows.filter((r) => r.rawStatus === "in_progress").length;
    const fallbackWaiting = rows.filter(
      (r) => r.rawStatus === "waiting_for_customer",
    ).length;
    const fallbackResolved = rows.filter((r) => r.rawStatus === "resolved").length;
    const fallbackClosed = rows.filter((r) => r.rawStatus === "closed").length;
    const fallbackUrgent = rows.filter(
      (r) =>
        ["high", "urgent"].includes(r.rawPriority) &&
        !["resolved", "closed"].includes(r.rawStatus),
    ).length;
    const fallbackUnassigned = rows.filter(
      (r) => !r.assigneeId && !["resolved", "closed"].includes(r.rawStatus),
    ).length;

    return {
      total: summary?.total ?? (isPropDriven ? visibleRows.length : paginationTotal ?? rows.length),
      activeQueue:
        summary?.activeQueue ??
        fallbackOpen + fallbackPending + fallbackProgress + fallbackWaiting,
      open: summary?.open ?? fallbackOpen,
      waiting: summary?.waitingForCustomer ?? fallbackWaiting,
      urgentOpen: summary?.urgentOpen ?? fallbackUrgent,
      unassigned: summary?.unassigned ?? fallbackUnassigned,
      resolvedAndClosed:
        (summary?.resolved ?? fallbackResolved) +
        (summary?.closed ?? fallbackClosed),
      resolved: summary?.resolved ?? fallbackResolved,
      closed: summary?.closed ?? fallbackClosed,
    };
  }, [summary, rows, isPropDriven, visibleRows.length, paginationTotal]);

  const hasActiveFilters = Boolean(
    search.trim() ||
      statusFilter !== "all" ||
      priorityFilter !== "all" ||
      categoryFilter !== "all" ||
      assignedFilter !== "all",
  );

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setAssignedFilter("all");
    setPage(1);
  };

  const refreshActiveTicket = async (ticketId) => {
    const [detailRes, histRes] = await Promise.allSettled([
      adminService.getSupportTicketById(ticketId),
      adminService.getSupportTicketHistory(ticketId),
    ]);

    if (detailRes.status === "fulfilled") {
      const detail = detailRes.value?.data ?? detailRes.value;
      if (detail && typeof detail === "object") {
        setActiveTicket(normalizeTicketRow(detail));
        setResolutionText(detail.resolution || "");
      }
    }

    if (histRes.status === "fulfilled") {
      const histData = histRes.value?.data ?? histRes.value;
      setTicketHistory(histData?.history || []);
    }
  };

  const handleOpenTicket = async (t) => {
    setActiveTicket(t);
    setActiveTab("messages");
    setReplyText("");
    setReplyNextStatus("");
    setInternalNote("");
    setResolutionText(t.resolution || "");
    setConfirmDelete(false);
    setTicketHistory([]);

    if (t._id) {
      await refreshActiveTicket(t._id);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket?._id) return;
    if (!replyText.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setSaving(true);
      await adminService.replyToSupportTicket(activeTicket._id, {
        message: replyText.trim(),
        ...(replyNextStatus ? { status: replyNextStatus } : {}),
      });
      toast.success("Reply sent to customer");
      setReplyText("");
      setReplyNextStatus("");
      await Promise.all([
        refreshActiveTicket(activeTicket._id),
        fetchTickets(),
      ]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!activeTicket?._id || !internalNote.trim()) return;

    try {
      setSaving(true);
      await adminService.addSupportTicketNote(
        activeTicket._id,
        internalNote.trim(),
      );
      toast.success("Internal note added");
      setInternalNote("");
      await Promise.all([
        refreshActiveTicket(activeTicket._id),
        fetchTickets(),
      ]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (!activeTicket?._id) return;
    const normalized = String(nextStatus || "").toLowerCase();

    try {
      setSaving(true);
      const updated = await adminService.updateSupportTicketStatus(
        activeTicket._id,
        normalized,
        resolutionText.trim(),
      );
      const doc = updated?.data ?? updated;
      if (doc && typeof doc === "object") {
        setActiveTicket(normalizeTicketRow(doc));
      } else {
        setActiveTicket((prev) =>
          prev
            ? { ...prev, rawStatus: normalized, status: formatLabel(normalized) }
            : prev,
        );
      }
      toast.success(`Ticket status updated to ${formatLabel(normalized)}`);
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityUpdate = async (nextPriority) => {
    if (!activeTicket?._id) return;
    const normalized = String(nextPriority || "").toLowerCase();

    try {
      setSaving(true);
      const updated = await adminService.updateSupportTicketPriority(
        activeTicket._id,
        normalized,
      );
      const doc = updated?.data ?? updated;
      if (doc && typeof doc === "object") {
        setActiveTicket(normalizeTicketRow(doc));
      } else {
        setActiveTicket((prev) =>
          prev
            ? {
                ...prev,
                rawPriority: normalized,
                priority: formatLabel(normalized),
              }
            : prev,
        );
      }
      toast.success(`Priority updated to ${formatLabel(normalized)}`);
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update priority");
    } finally {
      setSaving(false);
    }
  };

  const handleAssigneeUpdate = async (nextAssigneeId) => {
    if (!activeTicket?._id) return;
    try {
      setSaving(true);
      const updated = await adminService.assignSupportTicket(
        activeTicket._id,
        nextAssigneeId || null,
      );
      const doc = updated?.data ?? updated;
      if (doc && typeof doc === "object") {
        setActiveTicket(normalizeTicketRow(doc));
      }
      toast.success(
        nextAssigneeId ? "Ticket assigned to staff member" : "Ticket unassigned",
      );
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update assignee");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseOrReopen = async () => {
    if (!activeTicket?._id) return;
    const isClosedOrResolved = ["closed", "resolved"].includes(
      activeTicket.rawStatus,
    );

    try {
      setSaving(true);
      if (isClosedOrResolved) {
        await adminService.reopenSupportTicket(activeTicket._id);
        toast.success("Ticket reopened");
      } else {
        await adminService.closeSupportTicket(
          activeTicket._id,
          resolutionText.trim() || "Resolved by support team",
        );
        toast.success("Ticket closed");
      }
      await Promise.all([
        refreshActiveTicket(activeTicket._id),
        fetchTickets(),
      ]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeTicket?._id) return;
    try {
      setSaving(true);
      await adminService.deleteSupportTicket(activeTicket._id);
      toast.success(`Ticket #${activeTicket.ticket} deleted`);
      setActiveTicket(null);
      setConfirmDelete(false);
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Support</h1>
        </div>
        <button
          type="button"
          className="outlinebtn"
          disabled={loading}
          onClick={fetchTickets}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={handleResetFilters}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            !hasActiveFilters
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">Total tickets</p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {kpiStats.total}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {kpiStats.unassigned} unassigned active
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === "open" ? "waiting_for_customer" : "open");
            setPage(1);
          }}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            ["open", "pending", "in_progress", "waiting_for_customer"].includes(
              statusFilter,
            )
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">Active queue</p>
          <p className="mt-1 text-2xl font-black text-[#9b6814]">
            {kpiStats.activeQueue}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {kpiStats.open} open · {kpiStats.waiting} waiting reply
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setPriorityFilter(priorityFilter === "urgent" ? "all" : "urgent");
            setPage(1);
          }}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            priorityFilter === "urgent"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">
            High / Urgent active
          </p>
          <p className="mt-1 text-2xl font-black text-[#bd3345]">
            {kpiStats.urgentOpen}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            Click to filter urgent tickets
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === "resolved" ? "closed" : "resolved");
            setPage(1);
          }}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            ["resolved", "closed"].includes(statusFilter)
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">
            Resolved / Closed
          </p>
          <p className="mt-1 text-2xl font-black text-[#16845b]">
            {kpiStats.resolvedAndClosed}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {kpiStats.resolved} resolved · {kpiStats.closed} closed
          </p>
        </button>
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
            className="cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel">
        <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
          <input
            className="field"
            placeholder="Search ticket ID, customer, email, subject..."
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
            value={assignedFilter}
            onChange={(e) => {
              setAssignedFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            {agents.map((ag) => (
              <option key={ag._id} value={ag._id}>
                {ag.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="outlinebtn"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          )}
        </div>

        <div id="simpleTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-[var(--muted)]">
                    Loading support tickets...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <p className="text-sm font-bold text-[var(--text)]">
                      No support tickets found
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {hasActiveFilters
                        ? "Try clearing filters or broadening your search query."
                        : "Customer support tickets will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleRows.map((t) => (
                  <tr key={t._id || t.ticket}>
                    <td style={{ whiteSpace: "normal" }}>
                      <div className="font-bold text-[var(--text)]">
                        {t.ticket}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {t.categoryLabel}
                        {t.orderNumber ? ` · #${t.orderNumber}` : ""}
                      </div>
                    </td>

                    <td style={{ whiteSpace: "normal", minWidth: "150px" }}>
                      <div className="font-semibold text-[var(--text)]">
                        {t.customer}
                      </div>
                      {t.customerEmail ? (
                        <div className="text-[11px] text-[var(--muted)] break-all">
                          {t.customerEmail}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--muted)]">
                          No email on record
                        </div>
                      )}
                    </td>

                    <td style={{ whiteSpace: "normal", minWidth: "200px", maxWidth: "280px" }}>
                      <div className="font-medium text-[var(--text)]">
                        {t.subject}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {t.messageCount} {t.messageCount === 1 ? "msg" : "msgs"}
                        {t.noteCount > 0 ? ` · ${t.noteCount} notes` : ""}
                      </div>
                    </td>

                    <td>
                      <span className={`status ${priorityBadgeClass(t.rawPriority)}`}>
                        {t.priority}
                      </span>
                    </td>

                    <td>
                      {t.assigneeName ? (
                        <span className="text-xs font-semibold text-[var(--text)]">
                          {t.assigneeName}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`status ${statusClass(t.rawStatus)}`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="text-xs text-[var(--muted)]">
                      {formatShortDate(t.updatedAt || t.createdAt)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btnsm"
                        onClick={() => handleOpenTicket(t)}
                      >
                        Open
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
          totalPages={
            pagination.totalPages ||
            Math.max(
              1,
              Math.ceil(
                (isPropDriven ? visibleRows.length : pagination.total ?? visibleRows.length) /
                  limit,
              ),
            )
          }
          totalItems={
            isPropDriven
              ? visibleRows.length
              : pagination.total ?? visibleRows.length
          }
          pageSize={limit}
          itemLabel="tickets"
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      {activeTicket && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveTicket(null);
          }}
        >
          <div className="modal" style={{ maxWidth: "680px" }}>
            <div className="modalhead">
              <div>
                <h2 style={{ marginBottom: "2px" }}>#{activeTicket.ticket}</h2>
                <div className="text-xs text-[var(--muted)]">
                  {activeTicket.categoryLabel} · Created{" "}
                  {formatShortDate(activeTicket.createdAt)}
                  {activeTicket.orderNumber
                    ? ` · Order #${activeTicket.orderNumber}`
                    : ""}
                </div>
              </div>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setActiveTicket(null)}
              >
                ✕
              </button>
            </div>

            {/* Customer + Subject card */}
            <div className="notice mb-3 text-xs">
              <div className="font-bold text-[var(--text)]">
                {activeTicket.subject}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[var(--muted)]">
                <span>
                  <b>Customer:</b> {activeTicket.customer}
                </span>
                {activeTicket.customerEmail && (
                  <span>
                    <b>Email:</b> {activeTicket.customerEmail}
                  </span>
                )}
                {activeTicket.customerPhone && (
                  <span>
                    <b>Phone:</b> {activeTicket.customerPhone}
                  </span>
                )}
              </div>
            </div>

            {activeTicket.resolution && (
              <div className="mb-3 rounded-xl border border-[#c3ebda] bg-[#e7f6ef] px-3 py-2 text-xs text-[#16845b]">
                <b>Resolution:</b> {activeTicket.resolution}
                {activeTicket.resolvedAt
                  ? ` (${formatShortDate(activeTicket.resolvedAt)})`
                  : ""}
              </div>
            )}

            {/* Status / Priority / Assignment controls */}
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              <div className="formgroup">
                <label>Status</label>
                <select
                  className="field full"
                  value={activeTicket.rawStatus || "open"}
                  disabled={saving}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formgroup">
                <label>Priority</label>
                <select
                  className="field full"
                  value={activeTicket.rawPriority || "medium"}
                  disabled={saving}
                  onChange={(e) => handlePriorityUpdate(e.target.value)}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formgroup">
                <label>Assigned agent</label>
                <select
                  className="field full"
                  value={activeTicket.assigneeId || ""}
                  disabled={saving}
                  onChange={(e) => handleAssigneeUpdate(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {agents.map((ag) => (
                    <option key={ag._id} value={ag._id}>
                      {ag.name} ({ag.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Tabs: Conversation | Internal Notes | Activity History */}
            <div className="mb-3 flex flex-wrap gap-2 border-b border-[var(--line)] pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("messages")}
                className={activeTab === "messages" ? "primarybtn" : "btnsm"}
              >
                Conversation ({activeTicket.messages?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={activeTab === "notes" ? "primarybtn" : "btnsm"}
              >
                Internal Notes ({activeTicket.internalNotes?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={activeTab === "history" ? "primarybtn" : "btnsm"}
              >
                History ({ticketHistory.length})
              </button>
            </div>

            {activeTab === "messages" && (
              <div className="space-y-3">
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {(activeTicket.messages || []).length === 0 ? (
                    <div className="notice text-xs">
                      No messages recorded on this ticket.
                    </div>
                  ) : (
                    (activeTicket.messages || []).map((m, idx) => {
                      const isAdminMsg = ["admin", "super_admin"].includes(
                        String(m.sender?.role || "").toLowerCase(),
                      );
                      return (
                        <div
                          key={m._id || idx}
                          className="notice"
                          style={{
                            borderLeft: isAdminMsg
                              ? "3px solid var(--primary)"
                              : "3px solid var(--gold)",
                          }}
                        >
                          <div className="mb-1 text-[11px] font-bold text-[var(--muted)]">
                            {isAdminMsg
                              ? `${
                                  m.sender?.fullName ||
                                  m.sender?.name ||
                                  m.sender?.username ||
                                  "Admin"
                                } (Support)`
                              : activeTicket.customer}{" "}
                            ·{" "}
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleString("en-IN")
                              : ""}
                          </div>
                          <div className="whitespace-pre-wrap text-xs text-[var(--text)]">
                            {m.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div>
                  <textarea
                    className="field full"
                    rows={3}
                    style={{ width: "100%" }}
                    placeholder="Write a reply to the customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <select
                      className="field"
                      value={replyNextStatus}
                      onChange={(e) => setReplyNextStatus(e.target.value)}
                    >
                      <option value="">After reply: Keep In Progress</option>
                      <option value="waiting_for_customer">
                        After reply: Waiting for Customer
                      </option>
                      <option value="resolved">After reply: Mark Resolved</option>
                    </select>
                    <button
                      type="button"
                      className="primarybtn"
                      disabled={saving || !replyText.trim()}
                      onClick={handleSendReply}
                    >
                      {saving ? "Sending..." : "Send reply"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {(activeTicket.internalNotes || []).length === 0 ? (
                    <div className="notice text-xs">
                      No internal staff notes yet. Notes are private and invisible to customers.
                    </div>
                  ) : (
                    (activeTicket.internalNotes || []).map((n, idx) => (
                      <div key={n._id || idx} className="notice text-xs">
                        <div className="mb-1 text-[11px] font-bold text-[var(--muted)]">
                          {n.author?.fullName ||
                            n.author?.name ||
                            n.author?.email ||
                            "Admin"}{" "}
                          ·{" "}
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString("en-IN")
                            : ""}
                        </div>
                        <div className="whitespace-pre-wrap text-[var(--text)]">
                          {n.note}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    className="field full"
                    placeholder="Add internal staff note (private)..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                  />
                  <button
                    type="button"
                    className="primarybtn shrink-0"
                    disabled={saving || !internalNote.trim()}
                    onClick={handleAddNote}
                  >
                    Add note
                  </button>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {ticketHistory.length === 0 ? (
                  <div className="notice text-xs">
                    No activity recorded yet.
                  </div>
                ) : (
                  ticketHistory.map((h, idx) => (
                    <div key={idx} className="notice text-xs">
                      <div className="flex items-center justify-between gap-2 font-bold text-[var(--text)]">
                        <span>{h.activity}</span>
                        <span className="text-[11px] font-normal text-[var(--muted)]">
                          {h.createdAt
                            ? new Date(h.createdAt).toLocaleString("en-IN")
                            : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-[var(--muted)]">{h.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Resolution + Close/Reopen + Delete Footer */}
            <div className="mt-4 border-t border-[var(--line)] pt-3">
              {!["closed", "resolved"].includes(activeTicket.rawStatus) && (
                <div className="mb-3">
                  <input
                    className="field full"
                    placeholder="Optional resolution summary before closing..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="outlinebtn"
                    disabled={saving}
                    onClick={handleCloseOrReopen}
                  >
                    {["closed", "resolved"].includes(activeTicket.rawStatus)
                      ? "Reopen ticket"
                      : "Close ticket"}
                  </button>
                  <button
                    type="button"
                    className="btnsm"
                    onClick={() => setActiveTicket(null)}
                  >
                    Close modal
                  </button>
                </div>

                {confirmDelete ? (
                  <button
                    type="button"
                    className="btnsm"
                    style={{
                      background: "#bd3345",
                      color: "#fff",
                      borderColor: "#bd3345",
                    }}
                    disabled={saving}
                    onClick={handleConfirmDelete}
                  >
                    Confirm delete
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btnsm"
                    style={{ color: "#bd3345", borderColor: "#f3cbd0" }}
                    disabled={saving}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
