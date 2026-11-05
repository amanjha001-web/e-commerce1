const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

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
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(event) => updateFilter("search", event.target.value)}
          placeholder="Search name, email, username..."
          className={inputClass}
          aria-label="Search users"
        />

        <select
          value={filters.role ?? "all"}
          onChange={(event) => updateFilter("role", event.target.value)}
          className={inputClass}
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
          className={inputClass}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          value={filters.sortBy ?? "newest"}
          onChange={(event) => updateFilter("sortBy", event.target.value)}
          className={inputClass}
          aria-label="Sort users"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="email_asc">Email A–Z</option>
          <option value="email_desc">Email Z–A</option>
        </select>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {loading ? "Updating users..." : "Filter users by role and status"}
        </p>

        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
