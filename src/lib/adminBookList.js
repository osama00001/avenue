import Book from "@/models/Book";

/** Fields needed by avenue-admin product table only */
export const ADMIN_BOOK_LIST_SELECT =
  "coverImage recordReference type descriptiveDetail.titles descriptiveDetail.productForm productIdentifiers availabilityStatus isSellable productSupply.prices createdAt";

const COUNT_CACHE_MS = 5 * 60 * 1000;
let totalCache = { value: null, expiresAt: 0 };

/**
 * Fast total for admin list.
 * - No filter: estimatedDocumentCount (ms, cached) — ~exact for 1.9M+ books
 * - With filter: exact countDocuments (search results only)
 */
export async function getAdminBookListTotal(filter) {
  if (Object.keys(filter).length > 0) {
    const total = await Book.countDocuments(filter);
    return { total, isEstimated: false };
  }

  const now = Date.now();
  if (totalCache.value != null && now < totalCache.expiresAt) {
    return { total: totalCache.value, isEstimated: true };
  }

  const total = await Book.estimatedDocumentCount();
  totalCache = { value: total, expiresAt: now + COUNT_CACHE_MS };
  return { total, isEstimated: true };
}

/**
 * Fetch one page — _id sort (indexed), limit+1 for hasMore on last page.
 */
export async function queryAdminBookList(filter, { skip, limit }) {
  const rows = await Book.find(filter)
    .select(ADMIN_BOOK_LIST_SELECT)
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const books = hasMore ? rows.slice(0, limit) : rows;

  return { books, hasMore };
}
