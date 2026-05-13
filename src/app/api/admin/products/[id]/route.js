import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// ================= GET BOOK DETAILS =================
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params; // ✅ Required in latest Next

    // ---------- Validate ----------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Book ID" },
        { status: 400 }
      );
    }

    // ---------- Query ----------
    const book = await Book.findById(id)
      .populate({
        path: "categories",
        select: "code schemes",
      })
      .lean();

    if (!book) {
      return NextResponse.json(
        { success: false, message: "Book not found" },
        { status: 404 }
      );
    }

    // ---------- Success ----------
    return NextResponse.json({
      success: true,
      data: book,
    });
  } catch (err) {
    console.error("Book Details Error:", err);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
