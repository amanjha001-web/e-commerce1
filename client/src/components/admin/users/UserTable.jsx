import { useMemo } from "react";

const UserTable = ({
  users = [],
  loading = false,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
}) => {
  const tableUsers = useMemo(() => users, [users]);

  const getUserName = (user) =>
    user?.fullName || user?.name || user?.username || "Unknown User";

  const getInitials = (user) => {
    return getUserName(user)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const getStatus = (user) => {
    return user?.status || (user?.isActive === false ? "inactive" : "active");
  };

  const getStatusClass = (status) => {
    const statusMap = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      suspended:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };

    return statusMap[status?.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  const formatStatus = (status) => {
    if (!status) return "Active";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatRole = (role) => {
    if (!role) return "User";

    return role
      .toString()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["User", "Email", "Role", "Joined", "Status", "Action"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row} className="border-b border-border">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                      <div>
                        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-6 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-6 py-4">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </td>

                  <td className="px-6 py-4">
                    <div className="ml-auto h-8 w-24 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-5 md:hidden">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />

                <div className="flex-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
                </div>
              </div>

              <div className="mt-4 h-8 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tableUsers.length) {
    return (
      <div className="rounded-2xl border border-border bg-background px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          👥
        </div>

        <h3 className="mt-4 text-base font-semibold text-foreground">
          No users found
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          There are no users matching the current criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-4 font-medium">User</th>

              <th className="px-6 py-4 font-medium">Email</th>

              <th className="px-6 py-4 font-medium">Role</th>

              <th className="px-6 py-4 font-medium">Joined</th>

              <th className="px-6 py-4 font-medium">Status</th>

              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tableUsers.map((user, index) => {
              const status = getStatus(user);
              const userId = user?._id || user?.id || index;

              return (
                <tr
                  key={userId}
                  className="border-b border-border last:border-0 transition hover:bg-muted/30"
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user?.avatar || user?.profileImage || user?.image ? (
                        <img
                          src={user.avatar || user.profileImage || user.image}
                          alt={getUserName(user)}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(user)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {getUserName(user)}
                        </p>

                        {user?.username && (
                          <p className="truncate text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {user?.email || "-"}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      {formatRole(user?.role)}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(user?.createdAt || user?.joinedAt)}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                        status,
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewUser?.(user)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditUser?.(user)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus?.(user)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                      >
                        {status?.toLowerCase() === "active"
                          ? "Block"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteUser?.(user)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-border md:hidden">
        {tableUsers.map((user, index) => {
          const status = getStatus(user);
          const userId = user?._id || user?.id || index;

          const avatar = user?.avatar || user?.profileImage || user?.image;

          return (
            <div key={userId} className="p-5">
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={getUserName(user)}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(user)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {getUserName(user)}
                  </p>

                  <p className="truncate text-sm text-muted-foreground">
                    {user?.email || "No email"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                    status,
                  )}`}
                >
                  {formatStatus(status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>

                  <p className="mt-1 font-medium text-foreground">
                    {formatRole(user?.role)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>

                  <p className="mt-1 font-medium text-foreground">
                    {formatDate(user?.createdAt || user?.joinedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onViewUser?.(user)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => onEditUser?.(user)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus?.(user)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {status?.toLowerCase() === "active" ? "Block" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteUser?.(user)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserTable;
