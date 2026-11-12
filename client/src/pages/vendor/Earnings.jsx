import { toast } from "sonner";

const DEMO_PAYOUTS = [
  ["PO-501", "05 Nov 2026", "₹18,400", "Bank transfer", "Paid", "green"],
  ["PO-500", "28 Oct 2026", "₹14,200", "Bank transfer", "Paid", "green"],
  ["PO-499", "15 Oct 2026", "₹12,450", "Bank transfer", "Processing", "amber"],
];

const Earnings = () => {
  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Earnings</h1>
        </div>
      </div>

      <div className="stats">
        {[
          ["Gross revenue", "₹84,590"],
          ["Platform fees", "₹4,230"],
          ["Net earnings", "₹80,360"],
          ["Available payout", "₹12,450"],
        ].map((x) => (
          <div key={x[0]} className="stat">
            <span className="label">{x[0]}</span>
            <strong>{x[1]}</strong>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Payout history</h2>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PAYOUTS.map((p) => (
                <tr key={p[0]}>
                  <td>{p[0]}</td>
                  <td>{p[1]}</td>
                  <td>{p[2]}</td>
                  <td>{p[3]}</td>
                  <td>
                    <span className={`status ${p[5]}`}>{p[4]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="primarybtn"
          style={{ marginTop: "15px" }}
          onClick={() => toast.success("Payout request submitted")}
        >
          Request payout
        </button>
      </div>
    </div>
  );
};

export default Earnings;
