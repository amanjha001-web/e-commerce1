import { useMemo } from "react";

const RecentUsers = ({
  users = [],
  loading = false,
  onViewUser,
  onViewAll,
}) => {
  const recentUsers = useMemo(() => {
    return users.slice(0, 5);
  }, [users]);

  const getInitials = (user) => {
    const name = user?.fullName || user?.name || user?.username || "User";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const getUserName = (user) => {
    return user?.fullName || user?.name || user?.username || "Unknown User";
  };

  const getEmail = (user) => {
    return user?.email || "No email";
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

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-6 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-muted" />
          </div>

          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />

              <div className="flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-44 animate-pulse rounded bg-muted" />
              </div>

              <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Users
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Newly registered users
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-primary transition hover:opacity-80"
        >
          View All
        </button>
      </div>

      {/* Empty State */}
      {!recentUsers.length ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
            👥
          </div>

          <h3 className="text-sm font-semibold text-foreground">
            No users found
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Newly registered users will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-4 font-medium">User</th>

                  <th className="px-6 py-4 font-medium">Email</th>

                  <th className="px-6 py-4 font-medium">Joined</th>

                  <th className="px-6 py-4 font-medium">Status</th>

                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {recentUsers.map((user, index) => (
                  <tr
                    key={user?._id || user?.id || index}
                    className="border-b border-border last:border-0 transition hover:bg-muted/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={getUserName(user)}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(user)}
                          </div>
                        )}

                        <div>
                          <p className="font-medium text-foreground">
                            {getUserName(user)}
                          </p>

                          {user?.username && (
                            <p className="text-xs text-muted-foreground">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getEmail(user)}
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(user?.createdAt || user?.joinedAt)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          user?.status,
                        )}`}
                      >
                        {formatStatus(user?.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewUser?.(user)}
                        className="text-sm font-medium text-primary transition hover:opacity-80"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-border md:hidden">
            {recentUsers.map((user, index) => (
              <div key={user?._id || user?.id || index} className="p-5">
                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={getUserName(user)}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {getInitials(user)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {getUserName(user)}
                    </p>

                    <p className="truncate text-sm text-muted-foreground">
                      {getEmail(user)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                      user?.status,
                    )}`}
                  >
                    {formatStatus(user?.status)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>

                    <p className="mt-1 text-sm text-foreground">
                      {formatDate(user?.createdAt || user?.joinedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewUser?.(user)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    View User
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RecentUsers;
