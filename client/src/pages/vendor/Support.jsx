import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import supportService from "../../services/support.service";

const extractTickets = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.tickets)) return res.data.tickets;
  if (Array.isArray(res?.tickets)) return res.tickets;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const extractTicket = (res) =>
  res?.data?.ticket || res?.ticket || (res?.data?._id ? res.data : res?.data) || res;

const VendorSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");

  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportService.getMyTickets({ limit: 50 });
      setTickets(extractTickets(res));
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
      toast.error(err?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please provide both subject and message");
      return;
    }
    try {
      setSubmitting(true);
      await supportService.createTicket({
        subject: subject.trim(),
        category: String(category || "general").toLowerCase(),
        priority: String(priority || "medium").toLowerCase(),
        message: message.trim(),
      });
      toast.success("Support ticket created successfully");
      setModalOpen(false);
      setSubject("");
      setCategory("general");
      setPriority("medium");
      setMessage("");
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTicket = async (t) => {
    const id = t._id || t.ticketId;
    try {
      const res = await supportService.getTicketById(id);
      setActiveTicket(extractTicket(res) || t);
      setReplyText("");
    } catch {
      setActiveTicket(t);
      setReplyText("");
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;
    const id = activeTicket._id || activeTicket.ticketId;
    try {
      setReplyLoading(true);
      const res = await supportService.addMessage(id, { message: replyText.trim() });
      toast.success("Reply sent");
      setReplyText("");
      setActiveTicket(extractTicket(res) || activeTicket);
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleToggleClose = async () => {
    if (!activeTicket) return;
    const id = activeTicket._id || activeTicket.ticketId;
    const isClosed = ["closed", "resolved"].includes(
      String(activeTicket.status || "").toLowerCase(),
    );
    try {
      setReplyLoading(true);
      const res = isClosed
        ? await supportService.reopenTicket(id)
        : await supportService.closeTicket(id);
      toast.success(isClosed ? "Ticket reopened" : "Ticket closed");
      setActiveTicket(extractTicket(res) || activeTicket);
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Support</h1>
        </div>
      </div>

      <div className="panel">
        <div className="pagehead">
          <h2>Seller support</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="outlinebtn"
              onClick={fetchTickets}
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

        <p className="muted">
          Contact our seller success team for help with orders, payouts and
          listings.
        </p>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px" }}>
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px" }}>
                    No support tickets yet. Click <b>+ Create ticket</b> to get help.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const rawStatus = String(t.status || "open").toLowerCase();
                  const statusClass =
                    rawStatus === "closed" || rawStatus === "resolved" ? "green" : "amber";
                  return (
                    <tr key={t._id || t.ticketId}>
                      <td>#{t.ticketId || t.ticketNumber || String(t._id).slice(-6)}</td>
                      <td>{t.subject || "Support Request"}</td>
                      <td style={{ textTransform: "capitalize" }}>{t.category || "general"}</td>
                      <td>
                        <span className={`status ${statusClass}`}>
                          {rawStatus.replace(/_/g, " ")}
                        </span>
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
      </div>

      {modalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Create vendor ticket</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="formgroup">
              <label>Subject</label>
              <input
                className="field full"
                placeholder="Issue subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="formgrid" style={{ marginTop: "10px" }}>
              <div className="formgroup">
                <label>Category</label>
                <select
                  className="field full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="payout">Payouts</option>
                  <option value="order">Order</option>
                  <option value="payment">Payment</option>
                  <option value="delivery">Delivery</option>
                  <option value="product">Product</option>
                </select>
              </div>
              <div className="formgroup">
                <label>Priority</label>
                <select
                  className="field full"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Message</label>
              <textarea
                className="field full"
                rows={4}
                placeholder="Describe your issue"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="primarybtn"
              disabled={submitting}
              style={{ marginTop: "15px" }}
              onClick={handleSubmitTicket}
            >
              {submitting ? "Submitting..." : "Submit ticket"}
            </button>
          </div>
        </div>
      )}

      {activeTicket && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveTicket(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>#{activeTicket.ticketId || String(activeTicket._id).slice(-6)} · {activeTicket.subject}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setActiveTicket(null)}
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ marginBottom: "10px" }}>
              Category: <b>{activeTicket.category || "general"}</b> · Status:{" "}
              <b style={{ textTransform: "capitalize" }}>
                {String(activeTicket.status || "open").replace(/_/g, " ")}
              </b>
            </p>

            <div style={{ maxHeight: "260px", overflowY: "auto", marginBottom: "12px" }}>
              {(activeTicket.messages || []).length === 0 ? (
                <p className="muted">No messages yet.</p>
              ) : (
                (activeTicket.messages || []).map((m, idx) => (
                  <div
                    key={m._id || idx}
                    className="notice"
                    style={{ marginBottom: "8px", textAlign: "left" }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                      {m.sender?.role === "admin" || m.sender?.role === "super_admin"
                        ? m.sender?.fullName ||
                          m.sender?.name ||
                          m.sender?.username ||
                          "Support Team"
                        : "You"}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.message}</div>
                  </div>
                ))
              )}
            </div>

            {String(activeTicket.status || "open").toLowerCase() !== "closed" && (
              <div className="formgroup">
                <textarea
                  className="field full"
                  rows={3}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {String(activeTicket.status || "open").toLowerCase() !== "closed" && (
                <button
                  type="button"
                  className="primarybtn"
                  disabled={replyLoading || !replyText.trim()}
                  onClick={handleSendReply}
                >
                  {replyLoading ? "Sending..." : "Send Reply"}
                </button>
              )}
              <button
                type="button"
                className="btnsm"
                disabled={replyLoading}
                onClick={handleToggleClose}
              >
                {["closed", "resolved"].includes(
                  String(activeTicket.status || "").toLowerCase(),
                )
                  ? "Reopen Ticket"
                  : "Close Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSupport;
