import { useMemo, useState } from "react";

const DEFAULT_PAGE_SIZES = [10, 20, 50];

const buildPageList = (currentPage, totalPages, siblingCount = 1) => {
  if (totalPages <= 1) return [1];

  const totalVisible = siblingCount * 2 + 5;
  if (totalPages <= Math.max(9, totalVisible)) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    const leftCount = siblingCount * 2 + 3;
    const pages = Array.from({ length: leftCount }, (_, idx) => idx + 1);
    return [...pages, "...", totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightCount = siblingCount * 2 + 3;
    const start = totalPages - rightCount + 1;
    const pages = Array.from({ length: rightCount }, (_, idx) => start + idx);
    return [1, "...", ...pages];
  }

  const middle = [];
  for (let p = leftSibling; p <= rightSibling; p += 1) {
    middle.push(p);
  }
  return [1, "...", ...middle, "...", totalPages];
};

const AdminPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  itemLabel = "items",
  loading = false,
  onPageChange,
  onPageSizeChange,
  siblingCount = 1,
  className = "",
}) => {
  const [jumpInput, setJumpInput] = useState("");

  const safeLimit = Math.max(1, Number(pageSize) || 10);
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safeTotalPages = Math.max(
    1,
    Number(totalPages) ||
      (safeTotalItems > 0 ? Math.ceil(safeTotalItems / safeLimit) : 1),
  );
  const safePage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages);

  const pages = useMemo(
    () => buildPageList(safePage, safeTotalPages, siblingCount),
    [safePage, safeTotalPages, siblingCount],
  );

  const pageSizeOptions = useMemo(() => {
    if (DEFAULT_PAGE_SIZES.includes(safeLimit)) return DEFAULT_PAGE_SIZES;
    return [...DEFAULT_PAGE_SIZES, safeLimit].sort((a, b) => a - b);
  }, [safeLimit]);

  if (safeTotalItems === 0 && safeTotalPages <= 1) {
    return null;
  }

  const startItem = safeTotalItems === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const endItem = Math.min(safePage * safeLimit, safeTotalItems);

  const goToPage = (targetPage) => {
    const parsed = Number(targetPage);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(Math.max(1, Math.trunc(parsed)), safeTotalPages);
    setJumpInput("");
    if (clamped === safePage || loading) return;
    onPageChange?.(clamped);
  };

  const handleJumpSubmit = (event) => {
    event.preventDefault();
    if (!jumpInput.trim()) return;
    const parsed = parseInt(jumpInput.trim(), 10);
    if (Number.isNaN(parsed)) return;
    goToPage(parsed);
    setJumpInput("");
  };

  return (
    <div
      className={`mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 text-xs font-bold text-[var(--muted)]">
          {safeTotalItems > 0
            ? `Showing ${startItem}–${endItem} of ${safeTotalItems} ${itemLabel} · Page ${safePage} of ${safeTotalPages}`
            : `Page ${safePage} of ${safeTotalPages}`}
        </p>

        {typeof onPageSizeChange === "function" && (
          <select
            aria-label="Items per page"
            value={safeLimit}
            disabled={loading}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-bold text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pageSizeOptions.map((sz) => (
              <option key={sz} value={sz}>
                {sz} / page
              </option>
            ))}
          </select>
        )}
      </div>

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          title="First page"
          aria-label="First page"
          disabled={loading || safePage <= 1}
          onClick={() => goToPage(1)}
          className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
        >
          «
        </button>

        <button
          type="button"
          aria-label="Previous page"
          disabled={loading || safePage <= 1}
          onClick={() => goToPage(safePage - 1)}
          className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-xs font-bold text-[var(--muted)] select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === safePage ? "page" : undefined}
              disabled={loading && p !== safePage}
              onClick={() => goToPage(p)}
              className={`btnsm min-w-8 ${p === safePage ? "primary" : ""}`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={loading || safePage >= safeTotalPages}
          onClick={() => goToPage(safePage + 1)}
          className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>

        <button
          type="button"
          title="Last page"
          aria-label="Last page"
          disabled={loading || safePage >= safeTotalPages}
          onClick={() => goToPage(safeTotalPages)}
          className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
        >
          »
        </button>

        {safeTotalPages > 1 && (
          <form
            onSubmit={handleJumpSubmit}
            className="ml-1 flex items-center gap-1"
          >
            <span className="text-[11px] font-bold text-[var(--muted)]">
              Go to
            </span>
            <input
              type="number"
              min={1}
              max={safeTotalPages}
              value={jumpInput}
              disabled={loading}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={String(safePage)}
              aria-label="Go to page number"
              className="w-14 rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-center text-xs font-bold text-[var(--text)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !jumpInput.trim()}
              className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Go
            </button>
          </form>
        )}
      </nav>
    </div>
  );
};

export default AdminPagination;
