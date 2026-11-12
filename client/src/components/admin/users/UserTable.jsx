const getUserName = (user) =>
  user?.fullName || user?.name || user?.username || "Unnamed user";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

const getRoleLabel = (role) =>
  (role || "customer")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getUserIdLabel = (user, index) => {
  if (user?.userCode || user?.code) return user.userCode || user.code;
  if (user?._id) return `U-${String(user._id).slice(-4).toUpperCase()}`;
  return `U-${1001 + index}`;
};

const UserTable = ({
  users = [],
  loading = false,
  onViewUser,
  onToggleStatus,
}) => {
  if (loading && users.length === 0) {
    return (
      <div className="panel p-10 text-center text-[var(--muted)]">
        Loading users...
      </div>
    );
  }

  if (!loading && users.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <p className="font-bold text-[var(--text)]">No users found</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  const renderUser = (user) => {
    const name = getUserName(user);
    const avatarUrl =
      user?.avatar?.url || user?.profileImage || user?.image || "";

    return (
      <div className="flex min-w-0 items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--soft)] text-xs font-extrabold text-[var(--primary)]">
            {getInitials(name)}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate font-bold text-[var(--text)]">{name}</p>
          {user?.username && (
            <p className="truncate text-xs text-[var(--muted)]">
              @{user.username}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Actions in table row: ONLY Block/Unblock and View (Edit & Delete are inside View modal)
  const renderActions = (user) => {
    const isBlocked = Boolean(user?.isBlocked);

    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus?.(user)}
          className="btnsm"
        >
          {isBlocked ? "Unblock" : "Block"}
        </button>

        <button
          type="button"
          onClick={() => onViewUser?.(user)}
          className="btnsm"
        >
          View
        </button>
      </div>
    );
  };

  return (
    <div id="userTable">
      {loading && (
        <div className="mb-2 text-xs font-bold text-[var(--muted)]">
          Refreshing users...
        </div>
      )}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user._id || index}>
                <td className="font-bold text-[var(--text)]">
                  {getUserIdLabel(user, index)}
                </td>

                <td>{renderUser(user)}</td>

                <td>{user?.email || "—"}</td>

                <td>{getRoleLabel(user?.role)}</td>

                <td>
                  <span
                    className={`status ${
                      user?.isBlocked ? "red" : "green"
                    }`}
                  >
                    {user?.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>

                <td>{renderActions(user)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
