const UserFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  loading = false,
}) => {
  const updateFilter = (key, value) => {
    onFilterChange?.({ ...filters, [key]: value });
  };

  return (
    <div className="toolbar">
      <input
        type="search"
        value={filters.search ?? ""}
        onChange={(event) => updateFilter("search", event.target.value)}
        placeholder="Search users..."
        className="field"
        aria-label="Search users"
      />

      <select
        value={filters.role ?? "all"}
        onChange={(event) => updateFilter("role", event.target.value)}
        className="field"
        aria-label="Filter by role"
      >
        <option value="all">All roles</option>
        <option value="customer">Customer</option>
        <option value="vendor">Vendor</option>
        <option value="admin">Admin</option>
      </select>

      <select
        value={filters.status ?? "all"}
        onChange={(event) => updateFilter("status", event.target.value)}
        className="field"
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="blocked">Blocked</option>
      </select>

      <select
        value={filters.sortBy ?? "newest"}
        onChange={(event) => updateFilter("sortBy", event.target.value)}
        className="field"
        aria-label="Sort users"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="name_asc">Name A–Z</option>
        <option value="name_desc">Name Z–A</option>
      </select>

      <button
        type="button"
        onClick={onReset}
        disabled={loading}
        className="outlinebtn disabled:opacity-50"
      >
        Reset
      </button>
    </div>
  );
};

export default UserFilters;
