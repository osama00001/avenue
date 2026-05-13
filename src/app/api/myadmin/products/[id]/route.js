import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

/**
 * ======================================
 * GET /api/myadmin/products/[id]
 * ======================================
 */
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid book id required" },
        { status: 400 }
      );
    }

    const book = await Book.findById(id).lean();

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ data: book }, { status: 200 });
  } catch (err) {
    console.error("❌ ADMIN PRODUCT GET ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * ======================================
 * PUT /api/myadmin/products
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
    console.error("❌ ADMIN PRODUCT UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * ======================================
 * DELETE /api/myadmin/products
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
    console.error("❌ ADMIN PRODUCT DELETE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
