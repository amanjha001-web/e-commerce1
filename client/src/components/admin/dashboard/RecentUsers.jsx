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

  const getUserName = (user) => {
    return user?.fullName || user?.name || user?.username || "Unknown User";
  };

  const getEmail = (user) => {
    return user?.email || "No email";
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "active") return "bg-[#e7f6ef] text-[#16845b]";
    if (s === "pending") return "bg-[#fff4df] text-[#9b6814]";
    if (s === "blocked" || s === "suspended") return "bg-[#ffeaec] text-[#bd3345]";
    return "bg-[var(--soft)] text-[var(--primary)]";
  };

  const formatStatus = (status) => {
    if (!status) return "Active";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card">
        <div className="h-5 w-32 animate-pulse rounded bg-[var(--soft)]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
      <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
        <div>
          <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
            Recent users
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Newly registered customer & seller accounts
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[var(--primary)] hover:underline"
        >
          View all →
        </button>
      </div>

      {!recentUsers.length ? (
        <div className="p-8 text-center text-xs text-[var(--muted)]">
          No users registered recently.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#fcf9fa] text-[11px] font-black uppercase tracking-wider text-[var(--muted)] dark:bg-card/40">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => {
                const id = u._id || u.id;
                const status = u.status || (u.isBlocked ? "blocked" : "active");
                return (
                  <tr
                    key={id || Math.random()}
                    className="border-b border-[#f0e8eb] transition hover:bg-[var(--soft)]/30 dark:border-line"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-xs text-[var(--text)] dark:text-foreground">
                        {getUserName(u)}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {getEmail(u)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-bold capitalize text-[var(--text)] dark:text-foreground">
                      {String(u.role || "customer").replace(/_/g, " ")}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${getStatusClass(
                          status,
                        )}`}
                      >
                        {formatStatus(status)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewUser?.(u)}
                        className="btnsm text-[11px] !py-1 !px-2.5"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentUsers;
