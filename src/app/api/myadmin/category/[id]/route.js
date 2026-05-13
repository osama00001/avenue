import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

/**
 * ======================================
 * GET /api/myadmin/category/[id]
 * ======================================
 */
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const scheme = searchParams.get("scheme");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid category id required" },
        { status: 400 }
      );
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // If scheme specified, return that specific scheme
    if (scheme) {
      const schemeData = category.schemes?.find(s => s.scheme === scheme);
      if (!schemeData) {
        return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
      }
      return NextResponse.json({
        category: {
          _id: category._id,
          code: category.code,
          level: category.level,
          scheme: schemeData.scheme,
          headingText: schemeData.headingText,
          status: schemeData.status,
          updatedAt: category.updatedAt,
          createdAt: category.createdAt,
        }
      });
    }

    return NextResponse.json({ category }, { status: 200 });
  } catch (err) {
    console.error("❌ CATEGORY GET ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

/**
 * ======================================
 * PUT /api/myadmin/category/[id]
 * Body:
 * {
 *   scheme: string,
 *   headingText: string,
 *   status: boolean
 * }
 * ======================================
 */
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const { scheme, headingText, status } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid category id required" },
        { status: 400 }
      );
    }

    if (!scheme) {
      return NextResponse.json(
        { error: "Scheme is required" },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Find and update the specific scheme
    const schemeIndex = category.schemes.findIndex(s => s.scheme === scheme);
    
    if (schemeIndex === -1) {
      // Add new scheme if not found
      category.schemes.push({
        scheme,
        headingText: headingText || "",
        status: status !== undefined ? status : true,
      });
    } else {
      // Update existing scheme
      if (headingText !== undefined) category.schemes[schemeIndex].headingText = headingText;
      if (status !== undefined) category.schemes[schemeIndex].status = status;
    }

    await category.save();

    const updatedScheme = category.schemes.find(s => s.scheme === scheme);

    return NextResponse.json({
      _id: category._id,
      code: category.code,
      level: category.level,
      scheme: updatedScheme.scheme,
      headingText: updatedScheme.headingText,
      status: updatedScheme.status,
      updatedAt: category.updatedAt,
      createdAt: category.createdAt,
    }, { status: 200 });
  } catch (err) {
    console.error("❌ CATEGORY UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * ======================================
 * DELETE /api/myadmin/category/[id]
 * Body:
 * {
 *   scheme: string (optional - if provided, deletes only the scheme)
 * }
 * ======================================
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const { scheme } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid category id required" },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (scheme) {
      // Delete specific scheme
      const schemeIndex = category.schemes.findIndex(s => s.scheme === scheme);
      if (schemeIndex === -1) {
        return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
      }
      category.schemes.splice(schemeIndex, 1);
      await category.save();
      return NextResponse.json({ deleted: "scheme", id, scheme }, { status: 200 });
    } else {
      // Delete entire category
      await Category.findByIdAndDelete(id);
      return NextResponse.json({ deleted: "category", id }, { status: 200 });
    }
  } catch (err) {
    console.error("❌ CATEGORY DELETE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
