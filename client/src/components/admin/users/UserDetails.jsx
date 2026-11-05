
import { useState } from "react";

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

  return date.toLocaleString("en-IN");
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
  onToggleStatus,
}) => {
  const [form, setForm] = useState(() => getInitialForm(user));

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
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  const readOnlyField = (label, value) => (
    <div key={label}>
      <p className="text-xs text-gray-500">{label}</p>

      <p className="mt-1 break-words text-sm text-gray-900 dark:text-gray-100">
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
      className="dark:bg-gray-950"
    >
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Loading user details...
        </div>
      ) : !user ? (
        <div className="py-10 text-center text-sm text-gray-500">
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
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                {name}
              </h3>

              <p className="truncate text-sm text-gray-500">
                {user.email || "—"}
              </p>
            </div>
          </div>

          {/* Status badges */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize dark:bg-gray-800 dark:text-gray-200">
              {(user.role || "customer").replaceAll("_", " ")}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                user.isBlocked
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {user.isBlocked ? "Blocked" : "Active"}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                user.isVerified
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {user.isVerified ? "Verified" : "Not verified"}
            </span>
          </div>

          {editMode ? (
            /* Edit form */
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm text-gray-700 dark:text-gray-200">
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

                <label className="text-sm text-gray-700 dark:text-gray-200">
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

                <label className="text-sm text-gray-700 dark:text-gray-200">
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

                <label className="text-sm text-gray-700 dark:text-gray-200">
                  Phone
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                    className={fieldClass}
                  />
                </label>

                <label className="text-sm text-gray-700 dark:text-gray-200 sm:col-span-2">
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

              <p className="mt-3 text-xs text-gray-500">
                Backend permissions determine which fields and role changes
                are allowed.
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            /* Read-only details */
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {readOnlyField("Full name", user.fullName)}
                {readOnlyField("Username", user.username)}
                {readOnlyField("Email", user.email)}
                {readOnlyField("Phone", user.phone)}
                {readOnlyField("User ID", user._id)}
                {readOnlyField("Role", user.role)}
                {readOnlyField("Created at", formatDateTime(user.createdAt))}
                {readOnlyField(
                  "Last updated",
                  formatDateTime(user.updatedAt)
                )}
                {readOnlyField("Last login", formatDateTime(user.lastLogin))}
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus?.(user)}
                  disabled={saving}
                  className="rounded-lg border border-orange-200 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                >
                  {user.isBlocked ? "Unblock user" : "Block user"}
                </button>

                <button
                  type="button"
                  onClick={() => onEdit?.(user)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Edit user
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default UserDetails;
