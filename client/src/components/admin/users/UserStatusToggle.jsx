import { useEffect } from "react";
import { createPortal } from "react-dom";

const UserStatusToggle = ({
  user = null,
  open = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!open || loading) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, loading, onClose]);

  if (!open || !user) return null;

  const isBlocked = Boolean(user.isBlocked ?? user.isActive === false);
  const action = isBlocked ? "Unblock" : "Block";
  const name =
    user.fullName || user.name || user.username || user.email || "this user";

  const handleConfirm = () => {
    onConfirm?.(user);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1b0a11]/65 p-4 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (!loading && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-status-title"
        className="panel w-full max-w-md p-6 shadow-2xl"
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
            ? " Unblocking will immediately restore their login and checkout access."
            : " Blocking will immediately suspend their account and revoke access."}
        </p>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="outlinebtn cursor-pointer text-xs disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="primarybtn cursor-pointer text-xs disabled:opacity-50"
          >
            {loading ? "Please wait..." : `Confirm ${action}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UserStatusToggle;
