import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Book from "@/models/Book";
import { connectDB } from "@/lib/db";

// Defeat Next's data cache so updated catalogue queries always hit Mongo
export const dynamic   = "force-dynamic";
export const revalidate = 0;

/**
 * /api/books — homepage and search-facing book list.
 *
 * Category filtering uses `descriptiveDetail.subjects.code` regex directly.
 * That field is populated for every book the panda parser imported and was
 * verified by diagnose-sliders.js to match expected counts (~183K Fiction,
 * 170K Children, 144K Games). We do NOT use `bicSubjectPrefixes` — that
 * field was introduced by a separate migration that never completed
 * across the catalogue and produced inconsistent state.
 *
 * Cover policy: we DO NOT filter out books without covers. Sort key
 * `coverImage: -1` surfaces covered books to the top of each section but
 * the entire 1.9M catalogue remains accessible.
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;
const SEARCH_LIMIT  = 50;

const RANDOMISED_SECTIONS = new Set([
  "bestsellers",
  "popular",
  "highlights",
  "recently_reviewed",
  "gift_books",
]);

function recentDateStr() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// Each section gets a distinct, non-overlapping filter via the
// `descriptiveDetail.subjects.code` regex on real BIC codes the parser
// already populated.
const CATEGORY_BUILDERS = {
  catalog:           () => ({}),

  // Sidebar / curated sections — non-BIC where appropriate
  bestsellers:       () => ({ "descriptiveDetail.subjects.code": { $regex: "^H" } }),                                   // Humanities / Religion
  popular:           () => ({ "publishingDetail.publishingDate": { $gte: recentDateStr() } }),                          // New Books (last 3 months)
  recently_reviewed: () => ({ coverImage: { $exists: true, $nin: [null, ""] } }),                                       // Highlights — books with real covers
  new_books:         () => ({ "publishingDetail.publishingDate": { $gte: recentDateStr() } }),

  highlights:        () => ({ "descriptiveDetail.productForm": { $in: ["BB", "BH", "BK"] } }),
  special_editions:  () => ({ "descriptiveDetail.productForm": "BB" }),

  coming_soon: () => ({
    "publishingDetail.publishingDate": {
      $gte: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    },
  }),

  // BIC top-level slices — verified counts via diagnose-sliders.js
  fiction:        () => ({ "descriptiveDetail.subjects.code": { $regex: "^F" } }),
  children_books: () => ({ "descriptiveDetail.subjects.code": { $regex: "^Y" } }),
  language:       () => ({ "descriptiveDetail.subjects.code": { $regex: "^[CDE]" } }),
  games:          () => ({ "descriptiveDetail.subjects.code": { $regex: "^W" } }),
  gift_books:     () => ({ "descriptiveDetail.subjects.code": { $regex: "^W" } }),

  // Sidebar "Adult / Language" slug overlap
  adult_books:    () => ({ "descriptiveDetail.subjects.code": { $regex: "^[CDE]" } }),

  // Excluded letters: Fiction (F) and Children (Y) — everything else
  non_fiction:    () => ({
    "descriptiveDetail.subjects.code": { $exists: true, $not: { $regex: "^[FY]" } },
  }),

  paperback_books: () => ({ "descriptiveDetail.productForm": "BC" }),
};

// Sort priority:
//   1. isSellable=true first (in-stock, preorder, POD)
//   2. has-coverImage first within each tier
//   3. date / price tiebreaker per the requested sort
function buildSort(sort) {
  switch (sort) {
    case "price_low":  return { isSellable: -1, coverImage: -1, "productSupply.prices.amount":  1 };
    case "price_high": return { isSellable: -1, coverImage: -1, "productSupply.prices.amount": -1 };
    case "oldest":     return { isSellable: -1, coverImage: -1, createdAt:  1 };
    case "latest":
    default:           return { isSellable: -1, coverImage: -1, createdAt: -1 };
  }
}

// Escape user-supplied regex
function escRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const search   = searchParams.get("search")?.trim();
    const sort     = searchParams.get("sort");
    const limit    = search
      ? Math.min(Number(searchParams.get("limit")) || SEARCH_LIMIT, MAX_LIMIT)
      : Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT);
    const page     = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip     = (page - 1) * limit;

    const baseFilter = {};

    // ── SEARCH ──────────────────────────────────────────────────────────
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        const byId = await Book.findById(search).lean();
        return NextResponse.json(byId ? [byId] : []);
      }

      const books = await Book.find({
        ...baseFilter,
        $or: [
          { "descriptiveDetail.titles.text": { $regex: escRegex(search), $options: "i" } },
          { recordReference: { $regex: escRegex(search), $options: "i" } },
          { "productIdentifiers.value": { $regex: escRegex(search), $options: "i" } },
        ],
      })
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit)
        .lean();

      return NextResponse.json(books);
    }

    // ── SEMANTIC CATEGORY (sidebar / homepage) ───────────────────────────
    if (category && CATEGORY_BUILDERS[category]) {
      const filter = { ...baseFilter, ...CATEGORY_BUILDERS[category]() };

      if (RANDOMISED_SECTIONS.has(category)) {
        // Pull a healthy pool then shuffle in-process so each pageload feels
        // fresh without per-request random Mongo writes.
        const pool = await Book.find(filter)
          .sort({ isSellable: -1, coverImage: -1, createdAt: -1 })
          .limit(100)
          .lean();
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return NextResponse.json(pool.slice(0, limit));
      }

      const books = await Book.find(filter)
        .sort(buildSort(sort))
        .skip(skip).limit(limit).lean();
      return NextResponse.json(books);
    }

    // ── DIRECT BIC CODE PATH (e.g. ?category=F or ?category=YFM) ─────────
    // Anchored prefix regex without the /i flag so Mongo can use the index
    // on descriptiveDetail.subjects.code. BIC codes are always uppercase.
    if (category) {
      const code = category.trim().toUpperCase();
      if (!/^[A-Z][A-Z0-9]{0,5}$/.test(code)) return NextResponse.json([]);
      const books = await Book.find({
        ...baseFilter,
        "descriptiveDetail.subjects.code": { $regex: `^${escRegex(code)}` },
      })
        .sort(buildSort(sort))
        .skip(skip).limit(limit).lean();
      return NextResponse.json(books);
    }

    // ── DEFAULT: full catalogue, sellable + covered first ─────────────────
    const books = await Book.find(baseFilter)
      .sort(buildSort(sort))
      .skip(skip).limit(limit).lean();
    return NextResponse.json(books);
  } catch (err) {
    console.error("[/api/books] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
