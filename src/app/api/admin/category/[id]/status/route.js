import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

/**
 * PATCH /api/admin/category/[id]/status
 * Body:
 * {
 *   scheme: string,
 *   status: boolean
 * }
 */
export async function PATCH(req, context) {
  try {
    await connectDB();

    // ✅ FIX: unwrap params
    const { id } = await context.params;

    const { scheme, status } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid category id" },
        { status: 400 }
      );
    }

    if (!scheme || typeof status !== "boolean") {
      return NextResponse.json(
        { error: "scheme and status are required" },
        { status: 400 }
      );
    }

    /**
     * Update scheme-level status
     */
    const category = await Category.findOneAndUpdate(
      {
        _id: id,
        "schemes.scheme": scheme,
      },
      {
        $set: {
          "schemes.$.status": status,
        },
      },
      { new: true }
    ).lean();

    if (!category) {
      return NextResponse.json(
        { error: "Category or scheme not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        _id: id,
        scheme,
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ STATUS UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update scheme status" },
      { status: 500 }
    );
  }
}
