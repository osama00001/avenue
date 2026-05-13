import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

/**
 * ======================================
 * PATCH /api/myadmin/category/[id]/status
 * Body:
 * {
 *   scheme: string,
 *   status: boolean
 * }
 * ======================================
 */
export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const { scheme, status } = await req.json();

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

    if (typeof status !== "boolean") {
      return NextResponse.json(
        { error: "Status must be a boolean" },
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
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    category.schemes[schemeIndex].status = status;
    await category.save();

    return NextResponse.json(
      { message: "Status updated successfully", id, scheme, status },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ CATEGORY STATUS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
