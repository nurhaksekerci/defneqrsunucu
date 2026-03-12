/**
 * Pagination utility for database queries
 */

/**
 * Parse pagination parameters from request query
 * @param {object} query - Request query object
 * @returns {object} - { page, limit, skip }
 */
exports.parsePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  
  // Validation
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page
  
  const skip = (validatedPage - 1) * validatedLimit;
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    skip
  };
};

/**
 * Calculate total pages
 * @param {number} totalCount - Total records count
 * @param {number} limit - Records per page
 * @returns {number} - Total pages
 */
exports.calculateTotalPages = (totalCount, limit) => {
  return Math.ceil(totalCount / limit);
};

/**
 * Create paginated response
 * @param {array} data - Records array
 * @param {number} totalCount - Total records count
 * @param {object} paginationParams - { page, limit }
 * @returns {object} - Paginated response
 */
exports.createPaginatedResponse = (data, totalCount, paginationParams) => {
  const { page, limit } = paginationParams;
  const totalPages = exports.calculateTotalPages(totalCount, limit);
  
  return {
    success: true,
    data: data,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalCount: totalCount,
      limit: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Get Prisma pagination params
 * @param {object} query - Request query object
 * @returns {object} - { skip, take }
 */
exports.getPrismaPagination = (query) => {
  const { skip, limit } = exports.parsePaginationParams(query);
  
  return {
    skip: skip,
    take: limit
  };
};
