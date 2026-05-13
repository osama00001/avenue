import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, status } = body;

    // -------- Validation --------
    if (!id || typeof status !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid book ID" },
        { status: 400 }
      );
    }

    // -------- Update --------
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBook) {
      return NextResponse.json(
        { success: false, message: "Book not found" },
        { status: 404 }
      );
    }

    // -------- Success --------
    return NextResponse.json({
      success: true,
      message: "Status updated",
      data: updatedBook,
    });
  } catch (err) {
    console.error("Error updating product status:", err);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
