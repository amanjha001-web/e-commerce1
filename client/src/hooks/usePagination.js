import { useCallback, useMemo, useState } from "react";

const usePagination = ({
  initialPage = 1,
  initialLimit = 10,
  totalItems = 0,
} = {}) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / limit));
  }, [totalItems, limit]);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const nextPage = useCallback(() => {
    setPage((currentPage) => Math.min(currentPage + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
  }, []);

  const goToPage = useCallback(
    (newPage) => {
      const validPage = Math.min(Math.max(Number(newPage) || 1, 1), totalPages);

      setPage(validPage);
    },
    [totalPages],
  );

  const changeLimit = useCallback((newLimit) => {
    const validLimit = Math.max(Number(newLimit) || 10, 1);

    setLimit(validLimit);
    setPage(1);
  }, []);

  const resetPagination = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    totalPages,
    offset,

    hasNextPage,
    hasPreviousPage,

    nextPage,
    previousPage,
    goToPage,
    changeLimit,
    resetPagination,
  };
};

export default usePagination;
