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
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {selectable && <th className="w-12 px-4 py-3" />}

                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {column.label}
                  </th>
                ))}

                {actions && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr
                  key={row}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  {selectable && (
                    <td className="px-4 py-4">
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-4">
                      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}

              {columns.map((column) => {
                const sortable = column.sortable !== false;

                return (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                      >
                        {column.label}

                        {sortConfig.key === column.key && (
                          <span>
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
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                  className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="border-t border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                >
                  {selectable && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected(row)}
                        onChange={() => handleSelectRow(row)}
                        aria-label={`Select row ${index + 1}`}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300"
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
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
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
