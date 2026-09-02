import { useEffect, useState } from "react";

const UserFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  loading = false,
}) => {
  const [search, setSearch] = useState(filters.search || "");
  const [status, setStatus] = useState(filters.status || "all");
  const [role, setRole] = useState(filters.role || "all");
  const [sortBy, setSortBy] = useState(filters.sortBy || "newest");

  useEffect(() => {
    setSearch(filters.search || "");
    setStatus(filters.status || "all");
    setRole(filters.role || "all");
    setSortBy(filters.sortBy || "newest");
  }, [filters]);

  const handleSearchChange = (value) => {
    setSearch(value);

    onFilterChange?.({
      ...filters,
      search: value,
    });
  };

  const handleStatusChange = (value) => {
    setStatus(value);

    onFilterChange?.({
      ...filters,
      status: value,
    });
  };

  const handleRoleChange = (value) => {
    setRole(value);

    onFilterChange?.({
      ...filters,
      role: value,
    });
  };

  const handleSortChange = (value) => {
    setSortBy(value);

    onFilterChange?.({
      ...filters,
      sortBy: value,
    });
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setRole("all");
    setSortBy("newest");

    onReset?.();
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by name, username or email..."
            disabled={loading}
            className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status */}
          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            disabled={loading}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          {/* Role */}
          <select
            value={role}
            onChange={(event) => handleRoleChange(event.target.value)}
            disabled={loading}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(event) => handleSortChange(event.target.value)}
            disabled={loading}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="email_asc">Email A-Z</option>
            <option value="email_desc">Email Z-A</option>
          </select>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="h-11 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
