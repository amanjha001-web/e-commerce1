import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";

const DEMO_TICKETS = [
  {
    ticket: "#TK-201",
    customer: "Aman Jha",
    subject: "Payment not updated",
    priority: "Payment",
    status: "Open",
    isDemo: true,
  },
  {
    ticket: "#TK-202",
    customer: "Aman Jha",
    subject: "Order delivery delay",
    priority: "Delivery",
    status: "Pending",
    isDemo: true,
  },
  {
    ticket: "#TK-203",
    customer: "Aman Jha",
    subject: "Product exchange request",
    priority: "Order",
    status: "Resolved",
    isDemo: true,
  },
];

const statusClass = (s) =>
  s === "Delivered" || s === "Active" || s === "Resolved" || s === "Published"
    ? "green"
    : s === "Pending" ||
        s === "Processing" ||
        s === "Open" ||
        s === "In_progress"
      ? "amber"
      : s === "Blocked" ||
          s === "Cancelled" ||
          s === "Rejected" ||
          s === "Closed"
        ? "red"
        : "";

const Support = ({ tickets: propTickets = [] }) => {
  const [apiTickets, setApiTickets] = useState([]);
  const [demoTickets, setDemoTickets] = useState(DEMO_TICKETS);
  const [search, setSearch] = useState("");
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await adminService.getSupportTickets({ limit: 50 });
      const data = response?.data ?? response;
      const list = data?.tickets || data || [];
      if (Array.isArray(list) && list.length > 0) {
        setApiTickets(list);
      }
    } catch {
      // Fallback to demo tickets when unmapped
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const rows = useMemo(() => {
    const source =
      propTickets.length > 0
        ? propTickets
        : apiTickets.length > 0
          ? apiTickets
          : demoTickets;

    return source.map((t, i) => {
      if (t.ticket && t.customer && t.subject) return t;
      const rawStatus = t.status || "OPEN";
      const statusLabel =
        rawStatus === "IN_PROGRESS"
          ? "Pending"
          : rawStatus === "RESOLVED"
            ? "Resolved"
            : rawStatus === "CLOSED"
              ? "Closed"
              : String(rawStatus).charAt(0).toUpperCase() +
                String(rawStatus).slice(1).toLowerCase();

      return {
        ...t,
        ticket: t.ticketNumber || t.id || `#TK-${201 + i}`,
        customer:
          t.customer?.fullName || t.user?.fullName || t.user?.email || "Aman Jha",
        subject: t.subject || t.title || "Support request",
        priority: t.category || t.priority || "General",
        status: statusLabel,
      };
    });
  }, [propTickets, apiTickets, demoTickets]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      `${r.ticket} ${r.customer} ${r.subject} ${r.priority} ${r.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const handleOpenTicket = async (t) => {
    setActiveTicket(t);
    setReplyText("");
    setInternalNote("");
    setResolutionText(t.resolution || "");
    setTicketHistory([]);

    if (!t.isDemo && t._id) {
      try {
        const [detailRes, histRes] = await Promise.allSettled([
          adminService.getSupportTicketById(t._id),
          adminService.getSupportTicketHistory(t._id),
        ]);
        if (detailRes.status === "fulfilled") {
          const detail = detailRes.value?.data ?? detailRes.value;
          if (detail && typeof detail === "object") {
            setActiveTicket((prev) => (prev ? { ...prev, ...detail } : prev));
          }
        }
        if (histRes.status === "fulfilled") {
          const histData = histRes.value?.data ?? histRes.value;
          setTicketHistory(histData?.history || []);
        }
      } catch {
        // Ignore detail fetch error
      }
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket) return;
    if (!activeTicket.isDemo && activeTicket._id && replyText.trim()) {
      try {
        setSaving(true);
        await adminService.replyToSupportTicket(
          activeTicket._id,
          replyText.trim(),
        );
        toast.success("Reply sent");
        setActiveTicket(null);
        fetchTickets();
        return;
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to send reply");
        return;
      } finally {
        setSaving(false);
      }
    }
    setActiveTicket(null);
    toast.success("Reply sent");
  };

  const handleAddNote = async () => {
    if (!activeTicket || !internalNote.trim()) return;
    if (!activeTicket.isDemo && activeTicket._id) {
      try {
        setSaving(true);
        await adminService.addSupportTicketNote(
          activeTicket._id,
          internalNote.trim(),
        );
        toast.success("Internal note added");
        setInternalNote("");
        fetchTickets();
        return;
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to add note");
        return;
      } finally {
        setSaving(false);
      }
    }
    setInternalNote("");
    toast.success("Internal note added");
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (!activeTicket) return;
    if (!activeTicket.isDemo && activeTicket._id) {
      try {
        setSaving(true);
        await adminService.updateSupportTicketStatus(
          activeTicket._id,
          nextStatus,
        );
        toast.success(`Ticket status updated to ${nextStatus}`);
        fetchTickets();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to update status");
      } finally {
        setSaving(false);
      }
    } else {
      setDemoTickets((prev) =>
        prev.map((item) =>
          item.ticket === activeTicket.ticket
            ? {
                ...item,
                status:
                  nextStatus === "RESOLVED"
                    ? "Resolved"
                    : nextStatus === "IN_PROGRESS"
                      ? "Pending"
                      : "Open",
              }
            : item,
        ),
      );
      toast.success("Ticket status updated");
    }
  };

  const handlePriorityUpdate = async (nextPriority) => {
    if (!activeTicket) return;
    if (!activeTicket.isDemo && activeTicket._id) {
      try {
        setSaving(true);
        await adminService.updateSupportTicketPriority(
          activeTicket._id,
          nextPriority,
        );
        toast.success(`Priority updated to ${nextPriority}`);
        fetchTickets();
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to update priority",
        );
      } finally {
        setSaving(false);
      }
    } else {
      toast.success(`Priority updated to ${nextPriority}`);
    }
  };

  const handleCloseOrReopen = async () => {
    if (!activeTicket) return;
    const isClosed =
      String(activeTicket.status).toUpperCase() === "CLOSED";
    if (!activeTicket.isDemo && activeTicket._id) {
      try {
        setSaving(true);
        if (isClosed) {
          await adminService.reopenSupportTicket(activeTicket._id);
          toast.success("Ticket reopened");
        } else {
          await adminService.closeSupportTicket(
            activeTicket._id,
            resolutionText.trim() || "Resolved by support team",
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
    } else {
      setDemoTickets((prev) =>
        prev.map((item) =>
          item.ticket === activeTicket.ticket
            ? { ...item, status: isClosed ? "Open" : "Resolved" }
            : item,
        ),
      );
      setActiveTicket(null);
      toast.success(isClosed ? "Ticket reopened" : "Ticket closed");
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
            onClick={() => toast.success("New support form opened")}
          >
            + Add new
          </button>
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
              {filtered.map((t) => (
                <tr key={t._id || t.ticket}>
                  <td>{t.ticket}</td>
                  <td>{t.customer}</td>
                  <td>{t.subject}</td>
                  <td>{t.priority}</td>
                  <td>
                    <span className={`status ${statusClass(t.status)}`}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeTicket && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveTicket(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{activeTicket.ticket}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setActiveTicket(null)}
              >
                ✕
              </button>
            </div>
            <p>
              <b>Subject:</b> {activeTicket.subject} · <b>Customer:</b>{" "}
              {activeTicket.customer}
            </p>

            {ticketHistory.length > 0 && (
              <div className="notice" style={{ marginBottom: "10px" }}>
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
                  defaultValue="IN_PROGRESS"
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="WAITING_FOR_CUSTOMER">
                    WAITING_FOR_CUSTOMER
                  </option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
              <div className="formgroup">
                <label>Update priority</label>
                <select
                  className="field full"
                  defaultValue="MEDIUM"
                  onChange={(e) => handlePriorityUpdate(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>

            <textarea
              className="field full"
              style={{ width: "100%", marginTop: "10px" }}
              placeholder="Reply"
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
                disabled={saving}
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
                disabled={saving}
                onClick={handleSendReply}
              >
                Send reply
              </button>
              <button
                type="button"
                className="btnsm"
                disabled={saving}
                onClick={handleCloseOrReopen}
              >
                {String(activeTicket.status).toUpperCase() === "CLOSED"
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
