const getPagination = (page = 1, limit = 10) => {
  const parsedPage = Math.max(Number(page) || 1, 1)
  const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100)
  const skip = (parsedPage - 1) * parsedLimit

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  }
}

const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

export { getPagination, getPaginationMeta }
