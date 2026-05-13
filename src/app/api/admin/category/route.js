import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Category from "@/models/Category";
import Admin from "@/models/Admin";

export async function POST() {
  try {
    console.log("🚀 CATEGORY SYNC STARTED");
    await connectDB();
    console.log("✅ DB CONNECTED");

    /**
     * ==================================================
     * STEP 1: FETCH BOOKS WITH SUBJECTS
     * ==================================================
     */
    const books = await Book.find({
      "descriptiveDetail.subjects.0": { $exists: true },
    }).lean();

    console.log("📚 TOTAL BOOKS FOUND:", books.length);

    if (!books.length) {
      return NextResponse.json(
        { message: "No books with subjects found" },
        { status: 200 }
      );
    }

    /**
     * ==================================================
     * STEP 2: BUILD CATEGORY MAP
     * code → { code, level, schemes[] }
     * ==================================================
     */
    const categoryMap = new Map();
    const bookCategoryLinks = new Map(); // bookId → Set(code)

    for (const book of books) {
      const subjects = book.descriptiveDetail?.subjects || [];
      const bookId = book._id.toString();

      for (const subject of subjects) {
        const code = String(subject.code || "").trim();
        const scheme = String(subject.scheme || "").trim();
        const headingText = String(subject.headingText || "").trim();

        if (!code || !scheme) continue;

        if (!categoryMap.has(code)) {
          categoryMap.set(code, {
            code,
            level: code.length,
            schemes: [],
          });
        }

        const cat = categoryMap.get(code);

        // ✅ add scheme only once
        if (!cat.schemes.some((s) => s.scheme === scheme)) {
          cat.schemes.push({
            scheme,
            headingText,
            status: true, // ✅ DEFAULT SCHEME STATUS
          });
        }

        // link book → category code
        if (!bookCategoryLinks.has(bookId)) {
          bookCategoryLinks.set(bookId, new Set());
        }
        bookCategoryLinks.get(bookId).add(code);
      }
    }

    console.log("🏷️ UNIQUE CATEGORY CODES:", categoryMap.size);

    /**
     * ==================================================
     * STEP 3: UPSERT BASE CATEGORIES (NO SCHEMES YET)
     * ==================================================
     */
    const baseCategoryOps = [...categoryMap.values()].map((cat) => ({
      updateOne: {
        filter: { code: cat.code },
        update: {
          $setOnInsert: {
            code: cat.code,
            level: cat.level,
            schemes: [], // 🔑 required before pushing
          },
        },
        upsert: true,
      },
    }));

    if (baseCategoryOps.length) {
      const res = await Category.bulkWrite(baseCategoryOps);
      console.log("✅ BASE CATEGORY UPSERT:", res);
    }

    /**
     * ==================================================
     * STEP 4: MERGE SCHEMES (SAFE + SCHEMA-CORRECT)
     * ==================================================
     */
    const schemeOps = [];

    for (const cat of categoryMap.values()) {
      for (const schemeObj of cat.schemes) {
        schemeOps.push({
          updateOne: {
            filter: {
              code: cat.code,
              "schemes.scheme": { $ne: schemeObj.scheme },
            },
            update: {
              $push: {
                schemes: schemeObj, // ✅ includes status
              },
            },
          },
        });
      }
    }

    if (schemeOps.length) {
      const res = await Category.bulkWrite(schemeOps);
      console.log("✅ SCHEMES MERGED:", res);
    }

    /**
     * ==================================================
     * STEP 5: FETCH CATEGORY IDS
     * ==================================================
     */
    const categories = await Category.find({
      code: { $in: [...categoryMap.keys()] },
    }).lean();

    const categoryIdByCode = new Map(
      categories.map((c) => [c.code, c._id])
    );

    /**
     * ==================================================
     * STEP 6: LINK CATEGORIES TO BOOKS
     * ==================================================
     */
    const bookOps = [];

    for (const [bookId, codes] of bookCategoryLinks.entries()) {
      const categoryIds = [...codes]
        .map((code) => categoryIdByCode.get(code))
        .filter(Boolean);

      if (!categoryIds.length) continue;

      bookOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(bookId) },
          update: {
            $addToSet: {
              categories: { $each: categoryIds },
            },
          },
        },
      });
    }

    console.log("🛠️ BOOK UPDATE OPS:", bookOps.length);

    if (bookOps.length) {
      const res = await Book.bulkWrite(bookOps);
      console.log("✅ BOOK CATEGORY LINKED:", res);
    }

    console.log("🎉 CATEGORY SYNC FINISHED");

    return NextResponse.json(
      {
        message: "Categories synced successfully",
        totalCategories: categories.length,
        booksUpdated: bookOps.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 CATEGORY SYNC ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


/**
 * GET /api/admin/category
 * Query params:
 * - page (default 1)
 * - limit (default 50, max 50)
 * - code (search by code)
 * - scheme (search inside schemes.scheme)
 * - status (true / false)
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 50);

    const code = searchParams.get("code");
    const scheme = searchParams.get("scheme");
    const statusParam = searchParams.get("status"); // true / false

    const skip = (page - 1) * limit;

    /**
     * ==================================================
     * BASE MATCH (CATEGORY LEVEL)
     * ==================================================
     */
    const baseMatch = {};

    if (code) {
      baseMatch.code = { $regex: code, $options: "i" };
    }

    /**
     * ==================================================
     * SCHEME MATCH (AFTER UNWIND)
     * ==================================================
     */
    const schemeMatch = {};

    if (scheme) {
      schemeMatch["schemes.scheme"] = scheme;
    }

    if (statusParam !== null) {
      schemeMatch["schemes.status"] = statusParam === "true";
    }

    /**
     * ==================================================
     * AGGREGATION PIPELINE
     * ==================================================
     */
    const pipeline = [
      { $match: baseMatch },

      // 🔥 one row per scheme
      { $unwind: "$schemes" },

      // 🔍 scheme-level filters
      ...(Object.keys(schemeMatch).length
        ? [{ $match: schemeMatch }]
        : []),

      { $sort: { updatedAt: -1 } },

      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                code: 1,
                level: 1,

                // ✅ scheme-level fields
                scheme: "$schemes.scheme",
                headingText: "$schemes.headingText",
                status: "$schemes.status",

                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Category.aggregate(pipeline);

    const data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    return NextResponse.json(
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error fetching admin categories:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
