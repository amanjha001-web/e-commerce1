import { useMemo } from "react";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className = "",
}) => {
  const pages = useMemo(() => {
    const result = [];

    if (totalPages <= 1) {
      return [1];
    }

    const totalVisiblePages = siblingCount * 2 + 5;

    if (totalPages <= totalVisiblePages) {
      for (let page = 1; page <= totalPages; page += 1) {
        result.push(page);
      }

      return result;
    }

    const leftSibling = Math.max(currentPage - siblingCount, 1);

    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      const leftItems = siblingCount * 2 + 3;

      for (let page = 1; page <= leftItems; page += 1) {
        result.push(page);
      }

      result.push("...");
      result.push(totalPages);

      return result;
    }

    if (showLeftDots && !showRightDots) {
      result.push(1);
      result.push("...");

      const rightItems = siblingCount * 2 + 3;
      const startPage = totalPages - rightItems + 1;

      for (let page = startPage; page <= totalPages; page += 1) {
        result.push(page);
      }

      return result;
    }

    result.push(1);
    result.push("...");

    for (let page = leftSibling; page <= rightSibling; page += 1) {
      result.push(page);
    }

    result.push("...");
    result.push(totalPages);

    return result;
  }, [currentPage, totalPages, siblingCount]);

  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    onPageChange?.(page);
  };

  return (
    <nav
      className={`flex items-center justify-center gap-1 ${className}`}
      aria-label="Pagination"
    >
      {showFirstLast && (
        <button
          type="button"
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="First page"
        >
          «
        </button>
      )}

      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Previous page"
      >
        ‹
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span
            key={`dots-${index}`}
            className="px-2 py-2 text-sm text-gray-500"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Next page"
      >
        ›
      </button>

      {showFirstLast && (
        <button
          type="button"
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Last page"
        >
          »
        </button>
      )}
    </nav>
  );
};

export default Pagination;
