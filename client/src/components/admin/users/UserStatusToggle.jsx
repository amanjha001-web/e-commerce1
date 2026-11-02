const UserStatusToggle = ({
  user = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!open || !user) return null;

  const isBlocked = Boolean(user.isBlocked);
  const action = isBlocked ? "Unblock" : "Block";
  const name = user.fullName || user.username || user.email || "this user";

  const handleConfirm = () => {
    onConfirm?.(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-status-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-950"
      >
        <h2
          id="user-status-title"
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          {action} user?
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to {action.toLowerCase()}{" "}
          <strong>{name}</strong>?
          {isBlocked
            ? " Unblocking will restore access if the backend allows it."
            : " Blocking should prevent access according to your backend's authorization rules."}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Please wait..." : `Confirm ${action}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserStatusToggle;
