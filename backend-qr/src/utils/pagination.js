exports.parsePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(Math.max(1, limit), 100);
  const skip = (validatedPage - 1) * validatedLimit;
  return { page: validatedPage, limit: validatedLimit, skip };
};

exports.calculateTotalPages = (totalCount, limit) => Math.ceil(totalCount / limit);

exports.createPaginatedResponse = (data, totalCount, paginationParams) => {
  const { page, limit } = paginationParams;
  const totalPages = exports.calculateTotalPages(totalCount, limit);
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
