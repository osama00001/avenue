import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import { requireAdminApi } from "@/lib/requireAdminApi";
import {
  getAdminBookListTotal,
  queryAdminBookList,
} from "@/lib/adminBookList";

/**
 * GET /api/admin/products
 * Query: page, limit, search
 */
export async function GET(req) {
  try {
    const auth = await requireAdminApi(req);
    if (!auth.authorized) return auth.response;

    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 50);
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      const term = search.trim();
      if (term.length >= 2) {
        filter.$or = [
          { "descriptiveDetail.titles.text": { $regex: term, $options: "i" } },
          { recordReference: { $regex: term, $options: "i" } },
          { "productIdentifiers.value": { $regex: term, $options: "i" } },
        ];
      }
    }

    const [listResult, totalResult] = await Promise.all([
      queryAdminBookList(filter, { skip, limit }),
      getAdminBookListTotal(filter),
    ]);

    const { books, hasMore } = listResult;
    const { total, isEstimated } = totalResult;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return NextResponse.json(
      {
        page,
        limit,
        total,
        totalPages,
        isEstimated,
        hasMore: hasMore || page < totalPages,
        data: books,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ADMIN BOOK GET ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const auth = await requireAdminApi(req);
    if (!auth.authorized) return auth.response;

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
    console.error("ADMIN BOOK UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdminApi(req);
    if (!auth.authorized) return auth.response;

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
    console.error("ADMIN BOOK DELETE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
