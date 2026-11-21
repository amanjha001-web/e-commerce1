import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";
import AdminPagination from "../../components/admin/AdminPagination";

const statusClass = (s) => {
  const val = String(s || "").toLowerCase();
  if (["delivered", "active", "resolved"].includes(val)) return "green";
  if (["pending", "processing", "open", "in_progress", "waiting_for_customer"].includes(val)) {
    return "amber";
  }
  if (["blocked", "cancelled", "rejected", "closed"].includes(val)) return "red";
  return "";
};

const formatLabel = (val) =>
  String(val || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const Support = ({ tickets: propTickets = [] }) => {
  const [apiTickets, setApiTickets] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const response = await adminService.getSupportTickets(params);
      const data = response?.data ?? response;
      const list = data?.tickets || data || [];
      setApiTickets(Array.isArray(list) ? list : []);
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
      console.error("Failed to fetch admin tickets:", err);
      toast.error(err?.response?.data?.message || "Failed to load support tickets");
      setApiTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchTickets();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [fetchTickets, search]);

  const rows = useMemo(() => {
    const source = propTickets.length > 0 ? propTickets : apiTickets;

    return source.map((t, i) => {
      const rawStatus = String(t.status || "open").toLowerCase();
      const rawPriority = String(t.priority || "medium").toLowerCase();
      const senderFallback = t.messages?.find(
        (m) =>
          m?.sender &&
          typeof m.sender === "object" &&
          !["admin", "super_admin"].includes(String(m.sender.role || "").toLowerCase()),
      )?.sender;
      const userObj =
        (typeof t.userId === "object" && t.userId) ||
        (typeof t.customer === "object" && t.customer) ||
        (typeof t.user === "object" && t.user) ||
        senderFallback ||
        {};
      const customerEmail = userObj.email || t.email || "";

      return {
        ...t,
        ticket: t.ticketId || t.ticketNumber || t.id || `#TK-${201 + i}`,
        customer:
          userObj.fullName ||
          userObj.name ||
          userObj.username ||
          t.userName ||
          t.customerName ||
          (customerEmail ? customerEmail.split("@")[0] : "Customer"),
        customerEmail,
        subject: t.subject || t.title || "Support request",
        rawPriority,
        priority: formatLabel(rawPriority),
        rawStatus,
        status: formatLabel(rawStatus),
      };
    });
  }, [propTickets, apiTickets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesStatus =
        statusFilter === "all" || r.rawStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return `${r.ticket} ${r.customer} ${r.customerEmail} ${r.subject} ${r.priority} ${r.status}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, statusFilter]);

  const refreshActiveTicket = async (ticketId) => {
    const [detailRes, histRes] = await Promise.allSettled([
      adminService.getSupportTicketById(ticketId),
      adminService.getSupportTicketHistory(ticketId),
    ]);

    if (detailRes.status === "fulfilled") {
      const detail = detailRes.value?.data ?? detailRes.value;
      if (detail && typeof detail === "object") {
        setActiveTicket((prev) =>
          prev
            ? {
                ...prev,
                ...detail,
                rawStatus: String(detail.status || prev.rawStatus || "open").toLowerCase(),
                status: formatLabel(detail.status || prev.rawStatus || "open"),
                rawPriority: String(detail.priority || prev.rawPriority || "medium").toLowerCase(),
                priority: formatLabel(detail.priority || prev.rawPriority || "medium"),
              }
            : detail,
        );
      }
    }

    if (histRes.status === "fulfilled") {
      const histData = histRes.value?.data ?? histRes.value;
      setTicketHistory(histData?.history || []);
    }
  };

  const handleOpenTicket = async (t) => {
    setActiveTicket(t);
    setReplyText("");
    setInternalNote("");
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
      await adminService.replyToSupportTicket(
        activeTicket._id,
        replyText.trim(),
      );
      toast.success("Reply sent to customer");
      setReplyText("");
      await Promise.all([refreshActiveTicket(activeTicket._id), fetchTickets()]);
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
      await refreshActiveTicket(activeTicket._id);
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
      await adminService.updateSupportTicketStatus(activeTicket._id, normalized);
      setActiveTicket((prev) =>
        prev
          ? { ...prev, rawStatus: normalized, status: formatLabel(normalized) }
          : prev,
      );
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
      await adminService.updateSupportTicketPriority(
        activeTicket._id,
        normalized,
      );
      setActiveTicket((prev) =>
        prev
          ? {
              ...prev,
              rawPriority: normalized,
              priority: formatLabel(normalized),
            }
          : prev,
      );
      toast.success(`Priority updated to ${formatLabel(normalized)}`);
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update priority");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseOrReopen = async () => {
    if (!activeTicket?._id) return;
    const isClosed = activeTicket.rawStatus === "closed";

    try {
      setSaving(true);
      if (isClosed) {
        await adminService.reopenSupportTicket(activeTicket._id);
        toast.success("Ticket reopened");
      } else {
        await adminService.closeSupportTicket(
          activeTicket._id,
          "Resolved by support team",
        );
        toast.success("Ticket closed");
      }
      setActiveTicket(null);
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Support</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
          <input
            className="field"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page !== 1) setPage(1);
            }}
          />

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            {["all", "open", "in_progress", "resolved", "closed"].map((st) => (
              <button
                key={st}
                type="button"
                className={statusFilter === st ? "primarybtn" : "btnsm"}
                onClick={() => {
                  setStatusFilter(st);
                  if (page !== 1) setPage(1);
                }}
              >
                {st === "all" ? "All" : formatLabel(st)}
              </button>
            ))}

            <button
              type="button"
              className="outlinebtn"
              disabled={loading}
              onClick={fetchTickets}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        <div id="simpleTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                    Loading support tickets...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t._id || t.ticket}>
                    <td>{t.ticket}</td>
                    <td>
                      <div>{t.customer}</div>
                      {t.customerEmail && (
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {t.customerEmail}
                        </div>
                      )}
                    </td>
                    <td>{t.subject}</td>
                    <td>{t.priority}</td>
                    <td>
                      <span className={`status ${statusClass(t.rawStatus)}`}>
                        {t.status}
                      </span>
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
            Math.ceil((pagination.total || filtered.length) / limit) ||
            1
          }
          totalItems={
            propTickets.length > 0
              ? filtered.length
              : pagination.total ?? filtered.length
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
          <div className="modal" style={{ maxWidth: "620px" }}>
            <div className="modalhead">
              <h2>#{activeTicket.ticket}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setActiveTicket(null)}
              >
                ✕
              </button>
            </div>
            <p style={{ marginBottom: "10px" }}>
              <b>Subject:</b> {activeTicket.subject} · <b>Customer:</b>{" "}
              {activeTicket.customer}
            </p>

            {/* Messages Thread */}
            <div style={{ maxHeight: "220px", overflowY: "auto", marginBottom: "12px" }}>
              {(activeTicket.messages || []).length === 0 ? (
                <div className="notice">No messages recorded on this ticket.</div>
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
                        marginBottom: "8px",
                        borderLeft: isAdminMsg
                          ? "3px solid var(--primary)"
                          : "3px solid var(--gold)",
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "3px" }}>
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
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.message}</div>
                    </div>
                  );
                })
              )}
            </div>

            {ticketHistory.length > 0 && (
              <div className="notice" style={{ marginBottom: "10px", fontSize: "11px" }}>
                <b>Recent activity:</b>{" "}
                {ticketHistory
                  .slice(0, 3)
                  .map((h) => h.description || h.activity)
                  .join(" · ")}
              </div>
            )}

            <div className="formgrid" style={{ marginTop: "8px" }}>
              <div className="formgroup">
                <label>Update status</label>
                <select
                  className="field full"
                  value={activeTicket.rawStatus || "open"}
                  disabled={saving}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_customer">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="formgroup">
                <label>Update priority</label>
                <select
                  className="field full"
                  value={activeTicket.rawPriority || "medium"}
                  disabled={saving}
                  onChange={(e) => handlePriorityUpdate(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <textarea
              className="field full"
              rows={3}
              style={{ width: "100%", marginTop: "10px" }}
              placeholder="Write a reply to the customer..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              <input
                className="field full"
                placeholder="Add internal admin note..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
              />
              <button
                type="button"
                className="btnsm"
                disabled={saving || !internalNote.trim()}
                onClick={handleAddNote}
              >
                Add note
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "12px",
              }}
            >
              <button
                type="button"
                className="primarybtn"
                disabled={saving || !replyText.trim()}
                onClick={handleSendReply}
              >
                {saving ? "Saving..." : "Send reply"}
              </button>
              <button
                type="button"
                className="btnsm"
                disabled={saving}
                onClick={handleCloseOrReopen}
              >
                {activeTicket.rawStatus === "closed"
                  ? "Reopen ticket"
                  : "Close ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
