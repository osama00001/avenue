import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

export const dynamic   = "force-dynamic";
export const revalidate = 0;

const VALID_BIC_LETTERS = new Set(
  ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","R","S","T","U","V","W","Y"]
);

// 3 months ago as ONIX-style YYYYMMDD
function recentDateStr() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// Each entry returns a Mongo filter that uses `descriptiveDetail.subjects.code`
// regex — the field that the panda parser actually populates, verified by
// diagnose-sliders.js to return real distinct counts (~183K Fiction, etc).
const CATEGORY_BUILDERS = {
  // BIC top-level slices
  fiction:        () => ({ "descriptiveDetail.subjects.code": { $regex: "^F" } }),
  children_books: () => ({ "descriptiveDetail.subjects.code": { $regex: "^Y" } }),
  language:       () => ({ "descriptiveDetail.subjects.code": { $regex: "^[CDE]" } }),
  adult_books:    () => ({ "descriptiveDetail.subjects.code": { $regex: "^[CDE]" } }),
  games:          () => ({ "descriptiveDetail.subjects.code": { $regex: "^W" } }),
  gift_books:     () => ({ "descriptiveDetail.subjects.code": { $regex: "^W" } }),

  // Special, non-BIC categories
  bestsellers:       () => ({ "descriptiveDetail.subjects.code": { $regex: "^H" } }),               // Humanities / Religion
  popular:           () => ({ "publishingDetail.publishingDate": { $gte: recentDateStr() } }),       // New Books
  recently_reviewed: () => ({ coverImage: { $exists: true, $nin: [null, ""] } }),                    // Highlights
};

const SORT = { isSellable: -1, coverImage: -1, createdAt: -1 };

function isDirectBicCode(p) {
  if (!p) return false;
  const u = p.trim().toUpperCase();
  if (u.length === 1) return VALID_BIC_LETTERS.has(u);
  if (/^[A-Z][A-Z0-9]{1,5}$/.test(u)) return VALID_BIC_LETTERS.has(u[0]);
  return false;
}

function escRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category");
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const perPage = 20;
    const skip = (page - 1) * perPage;

    // ── Direct BIC code (e.g. /category/F, /category/YFM) ────────────────
    // Case-sensitive anchored regex so the index gets used. BIC is uppercase.
    if (categoryParam && isDirectBicCode(categoryParam)) {
      const code = categoryParam.trim().toUpperCase();
      const filter = {
        "descriptiveDetail.subjects.code": { $regex: `^${escRegex(code)}` },
      };

      const [books, totalBooks] = await Promise.all([
        Book.find(filter).sort(SORT).skip(skip).limit(perPage).lean(),
        Book.countDocuments(filter),
      ]);

      return NextResponse.json({
        type: "CATEGORY",
        selectedCategory: { displayName: `BIC ${code}`, code },
        subCategories: [],
        books,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(totalBooks / perPage)),
      });
    }

    // ── Semantic slug (sidebar links) ────────────────────────────────────
    if (categoryParam && CATEGORY_BUILDERS[categoryParam]) {
      const filter = CATEGORY_BUILDERS[categoryParam]();

      const [books, totalBooks] = await Promise.all([
        Book.find(filter).sort(SORT).skip(skip).limit(perPage).lean(),
        Book.countDocuments(filter),
      ]);

      return NextResponse.json({
        type: "CATEGORY",
        selectedCategory: {
          displayName: categoryParam.replace(/_/g, " ").toUpperCase(),
          code: categoryParam,
        },
        subCategories: [],
        books,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(totalBooks / perPage)),
      });
    }

    // ── Default root ─────────────────────────────────────────────────────
    const [books, totalBooks] = await Promise.all([
      Book.find({}).sort(SORT).skip(skip).limit(perPage).lean(),
      Book.countDocuments({}),
    ]);

    return NextResponse.json({
      type: "ROOT",
      categories: [],
      books,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(totalBooks / perPage)),
    });
  } catch (err) {
    console.error("[/api/category] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
