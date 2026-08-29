const SearchSuggestions = ({
  suggestions = [],
  query = "",
  loading = false,
  onSelect,
  onClose,
}) => {
  const visibleSuggestions = suggestions.filter((item) => {
    if (typeof item === "string") {
      return item.trim();
    }

    return item?.name || item?.title || item?.value;
  });

  if (!query.trim() && !loading) {
    return null;
  }

  if (!visibleSuggestions.length && !loading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No suggestions found.
        </p>
      </div>
    );
  }

  const handleSelect = (item) => {
    onSelect?.(item);
    onClose?.();
  };

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
      {loading ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Searching...
          </span>
        </div>
      ) : (
        <div className="py-2">
          {visibleSuggestions.map((item, index) => {
            const label =
              typeof item === "string"
                ? item
                : item?.name || item?.title || item?.value || "";

            const image =
              typeof item === "object"
                ? item?.image || item?.thumbnail || item?.imageUrl
                : null;

            const type = typeof item === "object" ? item?.type : null;

            return (
              <button
                key={item?._id || item?.id || `${label}-${index}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {image ? (
                  <img
                    src={image}
                    alt={label}
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    🔎
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {label}
                  </span>

                  {type && (
                    <span className="mt-0.5 block text-xs capitalize text-gray-400">
                      {type}
                    </span>
                  )}
                </span>

                <span className="text-gray-400">→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
