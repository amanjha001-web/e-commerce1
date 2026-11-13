import { useEffect, useState } from "react";
import { toast } from "sonner";
import supportService from "../../services/support.service";

const INITIAL_TICKETS = [
  { id: "VT-81", subject: "Payout clarification", status: "Open", statusClass: "amber" },
  { id: "VT-79", subject: "Product listing approval", status: "Resolved", statusClass: "green" },
];

const VendorSupport = () => {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await supportService.getMyTickets();
      const list = res?.data?.tickets || res?.data || res?.tickets || [];
      if (Array.isArray(list) && list.length > 0) {
        setTickets(
          list.map((t) => ({
            id: t.ticketNumber || t._id || "VT-01",
            subject: t.subject || "Support Request",
            status: t.status ? String(t.status).charAt(0).toUpperCase() + String(t.status).slice(1) : "Open",
            statusClass: t.status === "closed" || t.status === "resolved" ? "green" : "amber",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please provide both subject and message");
      return;
    }
    try {
      await supportService.createTicket({
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      toast.success("Support ticket created successfully");
      setModalOpen(false);
      setSubject("");
      setMessage("");
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create support ticket");
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
          <button
            type="button"
            className="primarybtn"
            onClick={() => setModalOpen(true)}
          >
            Create ticket
          </button>
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.subject}</td>
                  <td>
                    <span className={`status ${t.statusClass}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => toast.success("Ticket opened")}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
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
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Category</label>
              <select
                className="field full"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>General</option>
                <option>Order</option>
                <option>Payment</option>
                <option>Delivery</option>
              </select>
            </div>
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Message</label>
              <textarea
                className="field full"
                placeholder="Describe your issue"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="primarybtn"
              style={{ marginTop: "15px" }}
              onClick={handleSubmitTicket}
            >
              Submit ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSupport;
