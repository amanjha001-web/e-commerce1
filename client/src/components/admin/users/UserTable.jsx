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

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const UserTable = ({
  users = [],
  loading = false,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
}) => {
  if (loading && users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-10 text-center text-gray-500 dark:border-gray-800">
        Loading users...
      </div>
    );
  }

  if (!loading && users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-gray-800">
        <p className="font-semibold text-gray-800 dark:text-white">
          No users found
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  // User avatar, name, username and verification status
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
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {getInitials(name)}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900 dark:text-white">
            {name}
          </p>

          <p className="truncate text-xs text-gray-500">
            @{user?.username || "—"}
          </p>

          {user?.isVerified && (
            <span className="text-xs font-medium text-green-600">Verified</span>
          )}
        </div>
      </div>
    );
  };

  // Actions: isBlocked is defined in this scope.
  const renderActions = (user) => {
    const isBlocked = Boolean(user?.isBlocked);

    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onViewUser?.(user)}
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          View
        </button>

        <button
          type="button"
          onClick={() => onEditUser?.(user)}
          className="rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onToggleStatus?.(user)}
          className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
            isBlocked
              ? "border-green-200 text-green-700 hover:bg-green-50"
              : "border-orange-200 text-orange-700 hover:bg-orange-50"
          }`}
        >
          {isBlocked ? "Unblock" : "Block"}
        </button>

        <button
          type="button"
          onClick={() => onDeleteUser?.(user)}
          className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {loading && (
        <div className="border-b border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-800">
          Refreshing users...
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <tr key={user._id} className="align-middle">
                <td className="px-4 py-4">{renderUser(user)}</td>

                <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                  {user?.email || "—"}
                </td>

                <td className="px-4 py-4">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-gray-800">
                    {getRoleLabel(user?.role)}
                  </span>
                </td>

                <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                  {formatDate(user?.createdAt)}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user?.isBlocked
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {user?.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>

                <td className="px-4 py-4">{renderActions(user)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 p-3 md:hidden">
        {users.map((user) => (
          <div
            key={user._id}
            className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
          >
            {renderUser(user)}

            <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <p className="break-all">{user?.email || "—"}</p>

              <p>Role: {getRoleLabel(user?.role)}</p>

              <p>Joined: {formatDate(user?.createdAt)}</p>

              <p>
                Status:{" "}
                <span
                  className={
                    user?.isBlocked ? "text-red-600" : "text-green-600"
                  }
                >
                  {user?.isBlocked ? "Blocked" : "Active"}
                </span>
              </p>
            </div>

            <div className="mt-3">{renderActions(user)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTable;
