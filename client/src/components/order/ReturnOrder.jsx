import { useState } from "react";

const ReturnOrder = ({ order, onReturn, loading = false }) => {
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (!order) {
    return null;
  }

  const status = String(order.status || "").toLowerCase();

  const canReturn = ["delivered"].includes(status);

  if (!canReturn) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedReason = reason.trim();

    if (!trimmedReason || loading) {
      return;
    }

    await onReturn?.({
      orderId: order._id || order.id,
      reason: trimmedReason,
    });

    setReason("");
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        disabled={loading}
        className="rounded-lg border border-orange-500 px-4 py-2.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
      >
        Return Order
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
      <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400">
        Return Order
      </h3>

      <p className="mt-1 text-xs text-orange-600 dark:text-orange-500">
        Please provide a reason for returning this order.
      </p>

      <form onSubmit={handleSubmit} className="mt-3">
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Enter return reason..."
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60 dark:border-orange-900 dark:bg-gray-900 dark:text-white"
        />

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setReason("");
            }}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={!reason.trim() || loading}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Confirm Return"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnOrder;
