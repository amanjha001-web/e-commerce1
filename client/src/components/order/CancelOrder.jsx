import { useState } from "react";

const CancelOrder = ({ order, onCancel, loading = false }) => {
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  const orderId = order?._id || order?.id;

  const status = String(order?.status || "").toLowerCase();

  const canCancel = ["pending", "confirmed", "processing"].includes(status);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedReason = reason.trim();

    if (!trimmedReason || loading) {
      return;
    }

    await onCancel?.({
      orderId,
      reason: trimmedReason,
    });

    setReason("");
    setShowForm(false);
  };

  if (!order || !canCancel) {
    return null;
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        disabled={loading}
        className="rounded-lg border border-red-500 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        Cancel Order
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
      <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
        Cancel Order
      </h3>

      <p className="mt-1 text-xs text-red-600 dark:text-red-500">
        Please provide a reason for cancelling this order.
      </p>

      <form onSubmit={handleSubmit} className="mt-3">
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Enter cancellation reason..."
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:border-red-900 dark:bg-gray-900 dark:text-white"
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CancelOrder;
