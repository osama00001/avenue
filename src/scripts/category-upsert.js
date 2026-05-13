/**
 * category-upsert.js
 * BIC subject code → Category upsert helper.
 *
 * Given an array of subject objects from the ONIX parser, this module:
 *   1. Upserts each unique BIC code into the Category collection
 *   2. Returns an array of ObjectIds to link into Book.categories[]
 *
 * Export:
 *   upsertCategories(subjects) → Promise<ObjectId[]>
 *
 * Where subjects is an array of:
 *   { scheme: '12'|'93', code: 'YFM', headingText: 'Romance...' }
 *
 * Only scheme '12' (BIC 2.1) and '93' (Thema 1.5) are relevant — others skipped.
 */

import Category from '../models/Category.js';

const RELEVANT_SCHEMES = new Set(['12', '93']);

// Process-lifetime cache: code → ObjectId.
// BIC has ~5,000 codes total; once we've upserted each, future books that
// reference the same code skip the Mongo round-trip entirely.
const CATEGORY_CACHE = new Map();

export function clearCategoryCache() { CATEGORY_CACHE.clear(); }
export function categoryCacheSize()  { return CATEGORY_CACHE.size; }

/**
 * Upsert categories from a book's subjects array.
 * Returns array of Category ObjectIds (deduplicated).
 *
 * @param {Array<{scheme: string, code: string, headingText: string}>} subjects
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
export async function upsertCategories(subjects) {
  if (!subjects || subjects.length === 0) return [];

  const ids = [];
  const seenCodes = new Set();

  for (const subject of subjects) {
    // Only process BIC and Thema codes
    if (!RELEVANT_SCHEMES.has(subject.scheme)) continue;
    if (!subject.code) continue;

    // Deduplicate within this book's subject list
    if (seenCodes.has(subject.code)) continue;
    seenCodes.add(subject.code);

    // Fast path — already upserted this code in this process
    const cached = CATEGORY_CACHE.get(subject.code);
    if (cached) { ids.push(cached); continue; }

    try {
      const category = await Category.findOneAndUpdate(
        { code: subject.code },
        {
          $set:      { level: subject.code.length },
          $addToSet: {
            schemes: { scheme: subject.scheme, headingText: subject.headingText || '' },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: false }
      );

      if (category) {
        CATEGORY_CACHE.set(subject.code, category._id);
        ids.push(category._id);
      }
    } catch (err) {
      // Log but don't abort — a bad category shouldn't kill the whole import
      console.warn(`[category-upsert] Failed to upsert code "${subject.code}": ${err.message}`);
    }
  }

  return ids;
}
