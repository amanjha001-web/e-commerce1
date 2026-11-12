import { useEffect, useState } from "react";
import adminService from "../../services/admin.service";

const OrderStatusHistory = ({ orderId, loading = false }) => {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const response = await adminService.getOrderStatusHistory(orderId);
        setHistory(response?.history || response || []);
      } catch (err) {
        setHistoryError(err?.response?.data?.message || err?.message || "Failed to fetch history");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [orderId]);

  if (loading || historyLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        {historyError}
      </div>
    );
  }

  if (!history?.length) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No status history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              {item.status?.charAt(0).toUpperCase() || "#"}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {item.status?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Status Update"}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "Just now"}
            </p>
            {item?.note && (
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderStatusHistory;