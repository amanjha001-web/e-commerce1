import { useEffect, useState } from "react";

import Modal from "../../common/Modal";

const isUserBlocked = (user) =>
  Boolean(user?.isBlocked ?? user?.isActive === false);

const isUserVerified = (user) =>
  Boolean(user?.isVerified ?? user?.isEmailVerified);

const normalizeRoleForSelect = (role) => {
  const r = String(role || "customer").trim().toLowerCase();
  return r === "user" ? "customer" : r;
};

const formatRoleLabel = (role) => {
  const r = String(role || "customer").trim().toLowerCase();
  if (r === "user" || r === "customer") return "Customer";
  return r.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getInitialForm = (user) => ({
  fullName: user?.fullName || user?.name || "",
  username: user?.username || "",
  email: user?.email || "",
  phone: user?.phone || "",
  gender: user?.gender || "",
  bio: user?.bio || "",
  role: normalizeRoleForSelect(user?.role),
});

const formatDateTime = (value, dateOnly = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(dateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
  });
};

const UserDetails = ({
  user = null,
  open = false,
  inline = false,
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
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email ||
    "User details";

  const avatarUrl =
    (typeof user?.avatar === "string" ? user.avatar : user?.avatar?.url) ||
    user?.profileImage ||
    user?.image ||
    "";

  const blocked = isUserBlocked(user);
  const verified = isUserVerified(user);
  const addresses = Array.isArray(user?.addresses) ? user.addresses : [];
  const recentOrders = Array.isArray(user?.recentOrders)
    ? user.recentOrders
    : [];
  const orderStats = user?.orderStats || { totalOrders: 0, totalSpent: 0 };
  const vendorProfile =
    user?.vendorId && typeof user.vendorId === "object" ? user.vendorId : null;
  const vendorRequest = user?.vendorRequest || null;

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

  const body = loading && !user ? (
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
              {user.username ? ` · @${user.username}` : ""}
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">{formatRoleLabel(user.role)}</span>

          <span className={`status-badge ${blocked ? "red" : "green"}`}>
            {blocked ? "Blocked" : "Active"}
          </span>

          <span className={`status-badge ${verified ? "green" : "amber"}`}>
            {verified ? "Email Verified" : "Email Unverified"}
          </span>

          {user.authProvider && (
            <span className="pill capitalize">{user.authProvider} Login</span>
          )}
        </div>
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
                placeholder="Optional username"
                className={fieldClass}
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

            <label className="text-xs font-bold text-[var(--text)]">
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={updateField}
                className={fieldClass}
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>

            <label className="text-xs font-bold text-[var(--text)]">
              Role
              <select
                name="role"
                value={form.role}
                onChange={updateField}
                disabled={String(user.role || "").toLowerCase() === "super_admin"}
                className={fieldClass}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
                {String(user.role || "").toLowerCase() === "super_admin" && (
                  <option value="super_admin">Super Admin</option>
                )}
              </select>
            </label>

            <label className="text-xs font-bold text-[var(--text)] sm:col-span-2">
              Bio
              <textarea
                name="bio"
                rows={2}
                value={form.bio}
                onChange={updateField}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="outlinebtn cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="primarybtn cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Activity Summary Cards */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)]/35 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Orders Placed
              </div>
              <div className="mt-1 text-base font-black text-[var(--text)]">
                {Number(orderStats.totalOrders || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)]/35 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Total Spent
              </div>
              <div className="mt-1 text-base font-black text-[var(--primary)]">
                ₹{Number(orderStats.totalSpent || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)]/35 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Saved Addresses
              </div>
              <div className="mt-1 text-base font-black text-[var(--text)]">
                {addresses.length}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)]/35 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Support Tickets
              </div>
              <div className="mt-1 text-base font-black text-[var(--text)]">
                {Number(user.ticketCount || 0)}
              </div>
            </div>
          </div>

          {/* Complete Profile Fields */}
          <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/45 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {readOnlyField("Full name", user.fullName || user.name)}
            {readOnlyField("Username", user.username ? `@${user.username}` : "—")}
            {readOnlyField("Email", user.email)}
            {readOnlyField("Phone", user.phone)}
            {readOnlyField(
              "Gender",
              user.gender ? user.gender.replaceAll("_", " ") : "—",
            )}
            {readOnlyField("Date of Birth", formatDateTime(user.dateOfBirth, true))}
            {readOnlyField("User ID", user._id)}
            {readOnlyField("Role", formatRoleLabel(user.role))}
            {readOnlyField(
              "Account Status",
              blocked ? "Blocked (Suspended)" : "Active",
            )}
            {readOnlyField("Joined Date", formatDateTime(user.createdAt))}
            {readOnlyField("Last Login", formatDateTime(user.lastLogin))}
            {readOnlyField("Last Updated", formatDateTime(user.updatedAt))}
            {user.bio && (
              <div className="sm:col-span-2 lg:col-span-3">
                {readOnlyField("Bio", user.bio)}
              </div>
            )}
          </div>

          {/* Seller / Vendor Store Info (if vendor or applied) */}
          {(vendorProfile || vendorRequest) && (
            <div className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--primary)]">
                  Seller / Store Details
                </h4>
                <span className="pill capitalize">
                  {vendorProfile?.status || vendorRequest?.status || "pending"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {readOnlyField(
                  "Store Name",
                  vendorProfile?.storeName || vendorRequest?.storeName,
                )}
                {readOnlyField("Store Email", vendorProfile?.email || user.email)}
                {readOnlyField("Store Phone", vendorProfile?.phone || user.phone)}
              </div>
            </div>
          )}

          {/* Saved Addresses */}
          <div className="mt-5">
            <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              Saved Addresses ({addresses.length})
            </h4>
            {loading && !addresses.length ? (
              <p className="text-xs text-[var(--muted)]">Loading addresses...</p>
            ) : !addresses.length ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-[var(--muted)]">
                No saved addresses for this user.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="rounded-xl border border-[var(--line)] bg-white p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold capitalize text-[var(--text)]">
                        {addr.fullName} · {addr.addressType || "home"}
                      </span>
                      {addr.isDefault && (
                        <span className="pill text-[10px]">Default</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
                      {[addr.street, addr.apartment, addr.city, addr.state, addr.postalCode, addr.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {addr.phone && (
                      <p className="mt-1 text-[11px] font-semibold text-[var(--text)]">
                        {addr.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="mt-5">
            <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              Recent Orders ({orderStats.totalOrders || recentOrders.length})
            </h4>
            {!recentOrders.length ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-[var(--muted)]">
                No orders placed yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[#fcf9fa] text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
                      <th className="px-3.5 py-2.5">Order</th>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Payment</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 5).map((ord) => (
                      <tr
                        key={ord._id}
                        className="border-b border-[#f0e8eb] last:border-b-0"
                      >
                        <td className="px-3.5 py-2 font-bold text-[var(--primary)]">
                          #{ord.orderNumber || String(ord._id).slice(-6)}
                        </td>
                        <td className="px-3.5 py-2 text-[var(--muted)]">
                          {formatDateTime(ord.createdAt, true)}
                        </td>
                        <td className="px-3.5 py-2 uppercase text-[var(--muted)]">
                          {ord.paymentMethod || "cod"} ·{" "}
                          <span className="font-bold text-[var(--text)]">
                            {ord.isPaid ? "Paid" : ord.paymentStatus || "pending"}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 capitalize font-semibold">
                          {String(ord.orderStatus || "pending").replaceAll("_", " ")}
                        </td>
                        <td className="px-3.5 py-2 text-right font-black text-[var(--text)]">
                          ₹{Number(ord.totalAmount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
            {!inline && (
              <button
                type="button"
                onClick={onClose}
                className="btnsm cursor-pointer"
              >
                Close
              </button>
            )}

            {onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(user)}
                disabled={saving}
                className={`btnsm cursor-pointer disabled:opacity-50 ${
                  blocked
                    ? "!border-emerald-300 !bg-emerald-50 !text-emerald-800"
                    : "!border-amber-300 !bg-amber-50 !text-amber-800"
                }`}
              >
                {blocked ? "Unblock User" : "Block User"}
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(user)}
                disabled={saving}
                className="btnsm primary cursor-pointer disabled:opacity-50"
              >
                Edit
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(user)}
                disabled={saving}
                className="dangerbtn cursor-pointer text-xs disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </>
  );

  if (inline) {
    return <div className="panel p-6">{body}</div>;
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editMode ? "Edit user" : "User details"}
      size="xl"
      closeOnOverlay={!saving}
      closeOnEscape={!saving}
    >
      {body}
    </Modal>
  );
};

export default UserDetails;
