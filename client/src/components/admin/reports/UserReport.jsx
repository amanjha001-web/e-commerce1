import { useMemo } from "react";

const UserReport = ({
  data = [],
  loading = false,
  title = "User Report",
  period = "Monthly",
  onPeriodChange,
  onExport,
}) => {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => ({
      id: item?._id || item?.id || index,
      label: item?.label || item?.date || item?.period || `Item ${index + 1}`,
      totalUsers: Number(
        item?.totalUsers ?? item?.users ?? item?.userCount ?? 0,
      ),
      newUsers: Number(
        item?.newUsers ?? item?.newUsersCount ?? item?.registeredUsers ?? 0,
      ),
      activeUsers: Number(item?.activeUsers ?? item?.active ?? 0),
      inactiveUsers: Number(item?.inactiveUsers ?? item?.inactive ?? 0),
      blockedUsers: Number(item?.blockedUsers ?? item?.blocked ?? 0),
      vendors: Number(item?.vendors ?? item?.vendorCount ?? 0),
    }));
  }, [data]);

  const summary = useMemo(() => {
    return normalizedData.reduce(
      (acc, item) => {
        acc.totalUsers += item.totalUsers;
        acc.newUsers += item.newUsers;
        acc.activeUsers += item.activeUsers;
        acc.inactiveUsers += item.inactiveUsers;
        acc.blockedUsers += item.blockedUsers;
        acc.vendors += item.vendors;

        return acc;
      },
      {
        totalUsers: 0,
        newUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        blockedUsers: 0,
        vendors: 0,
      },
    );
  }, [normalizedData]);

  const activeRate =
    summary.totalUsers > 0
      ? (summary.activeUsers / summary.totalUsers) * 100
      : 0;

  const blockedRate =
    summary.totalUsers > 0
      ? (summary.blockedUsers / summary.totalUsers) * 100
      : 0;

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN").format(Number(value) || 0);

  const formatPercentage = (value) => `${Number(value).toFixed(1)}%`;

  const handleExport = () => {
    onExport?.({
      type: "users",
      period,
      data: normalizedData,
      summary: {
        ...summary,
        activeRate,
        blockedRate,
      },
    });
  };

  const statusConfig = [
    {
      key: "activeUsers",
      label: "Active Users",
    },
    {
      key: "inactiveUsers",
      label: "Inactive Users",
    },
    {
      key: "blockedUsers",
      label: "Blocked Users",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted/40" />

        <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor user growth, activity and account status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(event) => onPeriodChange?.(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14a2 2 0 0 0 2-2v-1M3 18v1a2 2 0 0 0 2 2"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Users
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.totalUsers)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">Registered users</p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">New Users</p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.newUsers)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            New registrations
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Active Users
          </p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.activeUsers)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Active rate {formatPercentage(activeRate)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Vendors</p>

          <p className="mt-2 text-xl font-bold text-foreground">
            {formatNumber(summary.vendors)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">Vendor accounts</p>
        </div>
      </div>

      {/* User Status */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground">
            User Status Overview
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Distribution of users by account status.
          </p>
        </div>

        {summary.totalUsers === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No user data available
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                User statistics will appear here once data is available.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {statusConfig.map((status) => {
              const value = summary[status.key] || 0;

              const percentage =
                summary.totalUsers > 0 ? (value / summary.totalUsers) * 100 : 0;

              return (
                <div key={status.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-foreground">
                      {status.label}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {formatNumber(value)} ({formatPercentage(percentage)})
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Growth */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground">User Growth</h3>

          <p className="mt-1 text-xs text-muted-foreground">
            New user registrations during the selected period.
          </p>
        </div>

        {normalizedData.length === 0 ? (
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No growth data available
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Registration data will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {normalizedData.map((item) => {
              const maxNewUsers = Math.max(
                ...normalizedData.map((entry) => entry.newUsers),
                1,
              );

              const percentage = (item.newUsers / maxNewUsers) * 100;

              return (
                <div key={item.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-foreground">
                      {item.label}
                    </span>

                    <span className="text-xs font-semibold text-foreground">
                      {formatNumber(item.newUsers)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              User Details
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Detailed user statistics for the selected period.
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            {normalizedData.length} records
          </span>
        </div>

        {normalizedData.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No records found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try selecting another reporting period.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Period
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Total
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      New
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Active
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Inactive
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Blocked
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Vendors
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {normalizedData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-foreground">
                        {item.label}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                        {formatNumber(item.totalUsers)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatNumber(item.newUsers)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatNumber(item.activeUsers)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatNumber(item.inactiveUsers)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatNumber(item.blockedUsers)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {formatNumber(item.vendors)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-border md:hidden">
              {normalizedData.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>

                    <p className="text-sm font-bold text-foreground">
                      {formatNumber(item.totalUsers)} users
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        New Users
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatNumber(item.newUsers)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Active
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatNumber(item.activeUsers)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Inactive
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatNumber(item.inactiveUsers)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Blocked
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatNumber(item.blockedUsers)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        Vendors
                      </p>

                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatNumber(item.vendors)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserReport;
