import { forwardRef } from "react";

const SearchInput = forwardRef(
  (
    {
      value = "",
      onChange,
      onSearch,
      placeholder = "Search...",
      disabled = false,
      loading = false,
      clearable = true,
      onClear,
      className = "",
      inputClassName = "",
      ...props
    },
    ref,
  ) => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        onSearch?.(value);
      }

      if (event.key === "Escape") {
        onClear?.();
      }
    };

    const handleClear = () => {
      onClear?.();
    };

    return (
      <div className={`relative flex items-center ${className}`}>
        <span
          className="pointer-events-none absolute left-3 text-gray-400"
          aria-hidden="true"
        >
          🔍
        </span>

        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={`w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-20 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800 ${inputClassName}`}
          {...props}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {loading && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
              aria-label="Searching"
            />
          )}

          {!loading && clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Clear search"
              className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}

          {onSearch && !loading && (
            <button
              type="button"
              onClick={() => onSearch(value)}
              disabled={disabled}
              className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              Search
            </button>
          )}
        </div>
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
