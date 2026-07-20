export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Get Supabase range parameters from page number and size
 */
export function getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
  const limit = pageSize > 0 ? pageSize : 10;
  const activePage = page > 0 ? page : 1;
  const from = (activePage - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}

/**
 * Format paginated result wrapper
 */
export function formatPaginatedResult<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const limit = pageSize > 0 ? pageSize : 10;
  const activePage = page > 0 ? page : 1;
  const hasMore = activePage * limit < count;
  return {
    data,
    count,
    page: activePage,
    pageSize: limit,
    hasMore,
  };
}
