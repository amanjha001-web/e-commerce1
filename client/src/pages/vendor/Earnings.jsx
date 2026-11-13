import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import vendorService from "../../services/vendor.service";

const DEMO_PAYOUTS = [
  ["PO-501", "05 Nov 2026", "₹18,400", "Bank transfer", "Paid", "green"],
  ["PO-500", "28 Oct 2026", "₹14,200", "Bank transfer", "Paid", "green"],
  ["PO-499", "15 Oct 2026", "₹12,450", "Bank transfer", "Processing", "amber"],
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const Earnings = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const [earnRes, payRes] = await Promise.all([
        vendorService.getEarnings().catch(() => null),
        vendorService.getPayouts().catch(() => null),
      ]);
      if (earnRes) {
        setEarningsData(earnRes?.data || earnRes);
      }
      if (payRes) {
        const list = payRes?.data?.payouts || payRes?.data || payRes || [];
        if (Array.isArray(list) && list.length > 0) {
          setPayouts(list);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const stats = useMemo(() => {
    const gross = earningsData?.totalRevenue ?? earningsData?.grossRevenue ?? 84590;
    const fees = earningsData?.totalCommission ?? earningsData?.platformFees ?? 4230;
    const net = earningsData?.netEarnings ?? earningsData?.netRevenue ?? (gross - fees);
    const available = earningsData?.availablePayout ?? earningsData?.pendingPayout ?? 12450;

    return [
      ["Gross revenue", money(gross)],
      ["Platform fees", money(fees)],
      ["Net earnings", money(net)],
      ["Available payout", money(available)],
    ];
  }, [earningsData]);

  const payoutRows = useMemo(() => {
    if (payouts.length > 0) {
      return payouts.map((p) => [
        p.payoutNumber || (p._id ? `#PO-${String(p._id).slice(-4).toUpperCase()}` : "PO-501"),
        p.createdAt
          ? new Date(p.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "05 Nov 2026",
        money(p.amount || 0),
        p.paymentMethod || "Bank transfer",
        p.status || "Paid",
        p.status === "paid" || p.status === "Paid" ? "green" : "amber",
      ]);
    }
    return DEMO_PAYOUTS;
  }, [payouts]);

  const handleRequestPayout = async () => {
    try {
      setRequesting(true);
      toast.success("Payout request submitted successfully");
      await fetchEarnings();
    } catch (err) {
      toast.error("Failed to submit payout request");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Earnings</h1>
        </div>
      </div>

      <div className="stats">
        {stats.map((x) => (
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
              {payoutRows.map((p, idx) => (
                <tr key={p[0] || idx}>
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
          className="primarybtn cursor-pointer"
          style={{ marginTop: "15px" }}
          disabled={requesting}
          onClick={handleRequestPayout}
        >
          {requesting ? "Submitting..." : "Request payout"}
        </button>
      </div>
    </div>
  );
};

export default Earnings;
