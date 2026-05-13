import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Book from "@/models/Book";
import mongoose from "mongoose";
/**
 * PUT /api/admin/category/:id
 * Body:
 * {
 *   status?: boolean,
 *   scheme?: string,
 *   headingText?: string
 * }
 */
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { scheme, headingText, status } = await req.json();

    if (!scheme || !headingText) {
      return NextResponse.json(
        { error: "scheme and headingText required" },
        { status: 400 }
      );
    }

    const updated = await Category.findOneAndUpdate(
      { _id: id, "schemes.scheme": scheme },
      {
        $set: {
          "schemes.$.headingText": headingText,
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Category or scheme not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id,
      scheme,
      headingText,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error("❌ UPDATE CATEGORY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update scheme" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/category/:id
 * Cascading:
 * - Remove category from all books
 * - Delete category document
 */
export async function DELETE(req, context) {
  try {
    await connectDB();

    const id = context.params.id;
    const { scheme } = await req.json();

    if (!scheme) {
      return NextResponse.json({ error: "scheme required" }, { status: 400 });
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const originalLength = category.schemes.length;

    category.schemes = category.schemes.filter((s) => s.scheme !== scheme);

    if (category.schemes.length === originalLength) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    // If no schemes left → cascade delete
    if (category.schemes.length === 0) {
      await Book.updateMany(
        { categories: category._id },
        { $pull: { categories: category._id } }
      );

      await Category.findByIdAndDelete(id);

      return NextResponse.json({
        deleted: "category",
        id,
      });
    }

    await category.save();

    return NextResponse.json({
      deleted: "scheme",
      scheme,
      remainingSchemes: category.schemes.length,
    });
  } catch (err) {
    console.error("❌ DELETE CATEGORY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete scheme" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/category/:id?scheme=XX
 * Returns:
 * - category info
 * - ONLY the requested scheme
 * - books linked to this category
 */
export async function GET(req, context) {
  try {
    await connectDB();

    // ✅ params must be awaited
    const { id } = await context.params;

    const { searchParams } = new URL(req.url);
    const scheme = searchParams.get("scheme");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid category id" },
        { status: 400 }
      );
    }

    if (!scheme) {
      return NextResponse.json(
        { error: "scheme query param is required" },
        { status: 400 }
      );
    }

    /**
     * ----------------------------------------
     * Fetch category with ONLY requested scheme
     * ----------------------------------------
     */
    const category = await Category.findOne(
      { _id: id, "schemes.scheme": scheme },
      {
        code: 1,
        level: 1,
        schemes: {
          $elemMatch: { scheme },
        },
      }
    ).lean();

    if (!category) {
      return NextResponse.json(
        { error: "Category or scheme not found" },
        { status: 404 }
      );
    }

    /**
     * ----------------------------------------
     * Fetch books linked to this category
     * ----------------------------------------
     */
    const books = await Book.find({
      categories: new mongoose.Types.ObjectId(id),
    })
      .select("_id descriptiveDetail.titles productSupply")
      .limit(50)
      .lean();

    return NextResponse.json(
      {
        category: {
          _id: category._id,
          code: category.code,
          level: category.level,
          scheme: category.schemes[0],
        },
        books,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ GET CATEGORY BY ID ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
