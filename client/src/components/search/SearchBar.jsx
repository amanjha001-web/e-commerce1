
import { useEffect, useState } from "react";
import useDebounce from "../../hooks/useDebounce";

const SearchBar = ({
  value = "",
  onChange,
  onSearch,
  onClear,
  placeholder = "Search products...",
  debounceDelay = 400,
  loading = false,
  suggestions = [],
  onSuggestionSelect,
}) => {
  const [query, setQuery] = useState(value);

  const debouncedQuery = useDebounce(query, debounceDelay);

  useEffect(() => {
    if (debouncedQuery !== value) {
      onChange?.(debouncedQuery);
    }
  }, [debouncedQuery, value, onChange]);

  const handleChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    onSearch?.(trimmedQuery);
  };

  const handleClear = () => {
    setQuery("");
    onChange?.("");
    onClear?.();
  };

  const handleSuggestionClick = (suggestion) => {
    const text =
      typeof suggestion === "string"
        ? suggestion
        : suggestion?.name ||
          suggestion?.title ||
          suggestion?.value ||
          "";

    if (!text) {
      return;
    }

    setQuery(text);
    onChange?.(text);
    onSuggestionSelect?.(suggestion);
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center overflow-hidden rounded-xl border border-gray-300 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900"
      >
        {/* Search Icon */}
        <span className="pl-3 text-gray-400">
          🔎
        </span>

        {/* Input */}
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
        />

        {/* Loading */}
        {loading && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        )}

        {/* Clear */}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="mr-1 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        )}

        {/* Search Button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="m-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* Suggestions */}
      {suggestions.length > 0 && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {suggestions.map((suggestion, index) => {
            const text =
              typeof suggestion === "string"
                ? suggestion
                : suggestion?.name ||
                  suggestion?.title ||
                  suggestion?.value ||
                  "";

            if (!text) {
              return null;
            }

            return (
              <button
                key={
                  suggestion?._id ||
                  suggestion?.id ||
                  `${text}-${index}`
                }
                type="button"
                onClick={() =>
                  handleSuggestionClick(suggestion)
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <span className="text-gray-400">
                  🔎
                </span>

                <span className="truncate">
                  {text}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
