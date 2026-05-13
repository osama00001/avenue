import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

/**
 * ======================================
 * GET /api/myadmin/products
 * Query params:
 * - page (default 1)
 * - limit (default 50, max 50)
 * - search (optional: title / isbn / author)
 * ======================================
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 50);
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const filter = { isSellable: true };

    // 🔍 Search by title, ISBN, or author
    if (search) {
      filter.$or = [
        { "descriptiveDetail.titles.text": { $regex: search, $options: "i" } },
        { "productIdentifiers.value": { $regex: search, $options: "i" } },
        { "descriptiveDetail.contributors.nameInverted": { $regex: search, $options: "i" } },
      ];
    }

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ coverImage: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Book.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: books,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ ADMIN PRODUCTS GET ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
