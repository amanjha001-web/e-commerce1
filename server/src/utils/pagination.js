
/*                            Pagination Helper                               */

const getPagination = (query = {}) => {
  let page = Number(query.page) || 1;
  let limit = Number(query.limit) || 10;

  page = page < 1 ? 1 : page;
  limit = limit < 1 ? 10 : limit;
  limit = limit > 100 ? 100 : limit;

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/*                          Pagination Response                               */

const getPaginationMeta = (totalDocuments, page, limit) => {
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    totalDocuments,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/*                                  Export                                    */

export { getPagination, getPaginationMeta };
