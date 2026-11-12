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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b0a11]/60 backdrop-blur-xs p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-status-title"
        className="panel w-full max-w-md p-6"
      >
        <h2
          id="user-status-title"
          className="text-base font-black text-[var(--text)]"
        >
          {action} user?
        </h2>

        <p className="mt-3 text-xs font-medium leading-6 text-[var(--muted)]">
          Are you sure you want to {action.toLowerCase()}{" "}
          <strong className="text-[var(--text)]">{name}</strong>?
          {isBlocked
            ? " Unblocking will restore access if the backend allows it."
            : " Blocking should prevent access according to your backend's authorization rules."}
        </p>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="outlinebtn text-xs disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="primarybtn text-xs disabled:opacity-50"
          >
            {loading ? "Please wait..." : `Confirm ${action}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserStatusToggle;
