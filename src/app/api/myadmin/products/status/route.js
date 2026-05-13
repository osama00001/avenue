import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

/**
 * ======================================
 * PATCH /api/myadmin/products/status
 * Body:
 * {
 *   id: string,
 *   status: boolean
 * }
 * ======================================
 */
export async function PATCH(req) {
  try {
    await connectDB();

    const { id, status } = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid book id required" },
        { status: 400 }
      );
    }

    if (typeof status !== "boolean") {
      return NextResponse.json(
        { error: "Status must be a boolean" },
        { status: 400 }
      );
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { $set: { isSellable: status } },
      { new: true }
    ).lean();

    if (!updatedBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Status updated successfully", id, status },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ ADMIN PRODUCTS STATUS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
