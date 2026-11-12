import { useEffect, useState } from "react";

import Modal from "../../common/Modal";

const getInitialForm = (user) => ({
  fullName: user?.fullName || "",
  username: user?.username || "",
  email: user?.email || "",
  phone: user?.phone || "",
  role: user?.role || "customer",
});

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const UserDetails = ({
  user = null,
  open = false,
  loading = false,
  saving = false,
  editMode = false,
  onClose,
  onEdit,
  onSave,
  onDelete,
  onToggleStatus,
}) => {
  const [form, setForm] = useState(() => getInitialForm(user));

  useEffect(() => {
    setForm(getInitialForm(user));
  }, [user, editMode]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!user?._id || saving) return;

    onSave?.(user, form);
  };

  const name =
    user?.fullName || user?.username || user?.email || "User details";

  const avatarUrl =
    user?.avatar?.url || user?.profileImage || user?.image || "";

  const fieldClass =
    "field mt-1 w-full text-xs font-semibold text-[var(--text)]";

  const readOnlyField = (label, value) => (
    <div key={label}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-semibold text-[var(--text)]">
        {value || "—"}
      </p>
    </div>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editMode ? "Edit user" : "User details"}
      size="lg"
      closeOnOverlay={!saving}
      closeOnEscape={!saving}
    >
      {loading ? (
        <div className="py-12 text-center text-xs font-medium text-[var(--muted)]">
          Loading user details...
        </div>
      ) : !user ? (
        <div className="py-10 text-center text-xs font-medium text-[var(--muted)]">
          User details are unavailable.
        </div>
      ) : (
        <>
          {/* User header */}
          <div className="flex min-w-0 items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-12 w-12 shrink-0 rounded-full border border-[var(--line)] object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--soft)] font-extrabold text-[var(--primary)]">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="truncate font-bold text-[var(--text)]">{name}</h3>

              <p className="truncate text-xs text-[var(--muted)]">
                {user.email || "—"}
              </p>
            </div>
          </div>

          {/* Status badges */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="pill capitalize">
              {(user.role || "customer").replaceAll("_", " ")}
            </span>

            <span
              className={`status-badge ${user.isBlocked ? "red" : "green"}`}
            >
              {user.isBlocked ? "Blocked" : "Active"}
            </span>

            <span
              className={`status-badge ${user.isVerified ? "green" : "amber"}`}
            >
              {user.isVerified ? "Verified" : "Not verified"}
            </span>
          </div>

          {editMode ? (
            /* Edit form */
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-[var(--text)]">
                  Full name
                  <input
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={updateField}
                    className={fieldClass}
                    required
                  />
                </label>

                <label className="text-xs font-bold text-[var(--text)]">
                  Username
                  <input
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={updateField}
                    className={fieldClass}
                    required
                  />
                </label>

                <label className="text-xs font-bold text-[var(--text)]">
                  Email
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    className={fieldClass}
                    required
                  />
                </label>

                <label className="text-xs font-bold text-[var(--text)]">
                  Phone
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                    className={fieldClass}
                  />
                </label>

                <label className="text-xs font-bold text-[var(--text)] sm:col-span-2">
                  Role
                  <select
                    name="role"
                    value={form.role}
                    onChange={updateField}
                    className={fieldClass}
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>

              <p className="mt-3 text-xs text-[var(--muted)]">
                Backend permissions determine which fields and role changes are
                allowed.
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="outlinebtn disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="primarybtn disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            /* Read-only details — includes Joined Date & Last Login + Edit & Delete buttons */
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {readOnlyField("Full name", user.fullName)}
                {readOnlyField("Username", user.username)}
                {readOnlyField("Email", user.email)}
                {readOnlyField("Phone", user.phone)}
                {readOnlyField("User ID", user._id)}
                {readOnlyField("Role", user.role)}
                {readOnlyField("Joined Date", formatDateTime(user.createdAt))}
                {readOnlyField("Last login", formatDateTime(user.lastLogin))}
                {readOnlyField("Last updated", formatDateTime(user.updatedAt))}
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
                <button type="button" onClick={onClose} className="btnsm">
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus?.(user)}
                  disabled={saving}
                  className="btnsm disabled:opacity-50"
                >
                  {user.isBlocked ? "Unblock" : "Block"}
                </button>

                <button
                  type="button"
                  onClick={() => onEdit?.(user)}
                  disabled={saving}
                  className="btnsm primary disabled:opacity-50"
                >
                  Edit
                </button>

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    disabled={saving}
                    className="dangerbtn text-xs disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default UserDetails;
