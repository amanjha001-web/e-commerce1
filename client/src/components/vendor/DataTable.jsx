import { useMemo, useState } from "react";

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data found.",
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = "_id",
  actions,
  pagination = false,
  page = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const getRowKey = (row, index) => row?.[rowKey] ?? row?.id ?? index;

  const sortedData = useMemo(() => {
    if (!sortConfig.key) {
      return data;
    }

    const column = columns.find((item) => item.key === sortConfig.key);

    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = a?.[sortConfig.key] ?? "";
      const bValue = b?.[sortConfig.key] ?? "";

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return (
        String(aValue).localeCompare(String(bValue)) *
        (sortConfig.direction === "asc" ? 1 : -1)
      );
    });
  }, [data, columns, sortConfig]);

  const handleSort = (key) => {
    const column = columns.find((item) => item.key === key);

    if (column?.sortable === false) {
      return;
    }

    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc" ? "desc" : "asc",
    }));
  };

  const isSelected = (row) => selectedRows.includes(getRowKey(row));

  const handleSelectRow = (row) => {
    const key = getRowKey(row);

    const updated = isSelected(row)
      ? selectedRows.filter((item) => item !== key)
      : [...selectedRows, key];

    onSelectionChange?.(updated);
  };

  const allSelected =
    data.length > 0 &&
    data.every((row) => selectedRows.includes(getRowKey(row)));

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.([]);
      return;
    }

    onSelectionChange?.(data.map((row, index) => getRowKey(row, index)));
  };

  const renderCell = (column, row, index) => {
    if (column.render) {
      return column.render(row, index);
    }

    const value = row?.[column.key];

    return value ?? "—";
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-[var(--line)] bg-[#fcf9fa] dark:bg-soft/30">
              <tr>
                {selectable && <th className="w-12 px-4 py-3.5" />}

                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-wider text-[var(--muted)]"
                  >
                    {column.label}
                  </th>
                ))}

                {actions && (
                  <th className="px-4 py-3.5 text-right text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr
                  key={row}
                  className="border-b border-[#f0e8eb] dark:border-line"
                >
                  {selectable && (
                    <td className="px-4 py-4">
                      <div className="h-4 w-4 animate-pulse rounded bg-[var(--soft)]" />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-[var(--soft)]" />
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-4">
                      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-[var(--soft)]" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-[var(--line)] bg-[#fcf9fa] dark:bg-soft/30">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-[var(--line)] text-[var(--primary)] accent-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                </th>
              )}

              {columns.map((column) => {
                const sortable = column.sortable !== false;

                return (
                  <th
                    key={column.key}
                    className="px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-wider text-[var(--muted)]"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="inline-flex items-center gap-1.5 transition hover:text-[var(--primary)]"
                      >
                        {column.label}

                        {sortConfig.key === column.key && (
                          <span className="text-[var(--primary)]">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}

              {actions && (
                <th className="px-4 py-3.5 text-right text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                  }
                  className="px-6 py-12 text-center text-sm font-medium text-[var(--muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="border-b border-[#f0e8eb] transition hover:bg-[var(--soft)]/50 dark:border-line dark:hover:bg-soft/20"
                >
                  {selectable && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected(row)}
                        onChange={() => handleSelectRow(row)}
                        aria-label={`Select row ${index + 1}`}
                        className="h-4 w-4 rounded border-[var(--line)] text-[var(--primary)] accent-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-4 text-xs font-semibold text-[var(--text)] dark:text-foreground"
                    >
                      {renderCell(column, row, index)}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-4 text-right">
                      {typeof actions === "function"
                        ? actions(row, index)
                        : actions}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-3.5 bg-[#fcf9fa] dark:bg-card">
          <span className="text-xs font-bold text-[var(--muted)]">
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;


