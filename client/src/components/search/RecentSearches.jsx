
import { useState } from "react";

const STORAGE_KEY = "shopsphere_recent_searches";
const MAX_SEARCHES = 8;

const RecentSearches = ({
  onSelect,
  onClear,
  maxItems = MAX_SEARCHES,
}) => {
  const [searches, setSearches] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]",
      );

      if (!Array.isArray(stored)) {
        return [];
      }

      return stored
        .filter(
          (item) =>
            typeof item === "string" && item.trim(),
        )
        .slice(0, maxItems);
    } catch (error) {
      console.error(
        "Failed to load recent searches:",
        error,
      );

      return [];
    }
  });

  const removeSearch = (search) => {
    const updated = searches.filter(
      (item) => item !== search,
    );

    setSearches(updated);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error(
        "Failed to remove recent search:",
        error,
      );
    }
  };

  const clearSearches = () => {
    setSearches([]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(
        "Failed to clear recent searches:",
        error,
      );
    }

    onClear?.();
  };

  const handleSelect = (search) => {
    onSelect?.(search);
  };

  const visibleSearches = searches.slice(0, maxItems);

  if (!visibleSearches.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recent Searches
        </h3>

        <button
          type="button"
          onClick={clearSearches}
          className="text-xs font-medium text-gray-500 transition hover:text-red-500 dark:text-gray-400"
        >
          Clear All
        </button>
      </div>

      {/* Search List */}
      <div className="space-y-1">
        {visibleSearches.map((search) => (
          <div
            key={search}
            className="group flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {/* Select Search */}
            <button
              type="button"
              onClick={() => handleSelect(search)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="text-gray-400">🕘</span>

              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                {search}
              </span>
            </button>

            {/* Remove Search */}
            <button
              type="button"
              onClick={() => removeSearch(search)}
              aria-label={`Remove ${search}`}
              className="ml-2 rounded p-1 text-gray-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
