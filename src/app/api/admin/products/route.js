import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

/**
 * ======================================
 * GET /api/admin/book
 * Query params:
 * - page (default 1)
 * - limit (default 50, max 50)
 * - search (optional: title / recordReference)
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

    const filter = {};

    // 🔍 Search by title or recordReference
    if (search) {
      filter.$or = [
        { "descriptiveDetail.titles.text": { $regex: search, $options: "i" } },
        { recordReference: { $regex: search, $options: "i" } },
      ];
    }

    const [books, total] = await Promise.all([
      Book.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),

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
    console.error("❌ ADMIN BOOK GET ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

/**
 * ======================================
 * PUT /api/admin/book
 * Body:
 * {
 *   id: string,
 *   data: { ...partialBookFields }
 * }
 * ======================================
 */
export async function PUT(req) {
  try {
    await connectDB();

    const { id, data } = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid book id required" },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Update data required" },
        { status: 400 }
      );
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean();

    if (!updatedBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBook, { status: 200 });
  } catch (err) {
    console.error("❌ ADMIN BOOK UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

/**
 * ======================================
 * DELETE /api/admin/book
 * Body:
 * {
 *   id: string
 * }
 * ======================================
 */
export async function DELETE(req) {
  try {
    await connectDB();

    const { id } = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid book id required" },
        { status: 400 }
      );
    }

    const deleted = await Book.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Book deleted successfully", id },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ ADMIN BOOK DELETE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
