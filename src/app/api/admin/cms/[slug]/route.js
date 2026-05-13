import { connectDB } from "@/lib/db";
import CmsPage from "@/models/CmsPage";
import { NextResponse } from "next/server";

/**
 * =========================================
 * GET SINGLE PAGE (FOR EDITING)
 * =========================================
 */
export async function GET(req, context) {
  try {
    await connectDB();

    const { slug } = await context.params; // ✅ FIX

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const page = await CmsPage.findOne({
      slug: slug.toLowerCase().trim(),
    }).lean();

    return NextResponse.json({
      data: page || null,
    });
  } catch (err) {
    console.error("CMS GET ONE Error:", err);

    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

/**
 * =========================================
 * DELETE PAGE
 * =========================================
 */
export async function DELETE(req, context) {
  try {
    await connectDB();

    const { slug } = context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const result = await CmsPage.deleteOne({
      slug: slug.toLowerCase().trim(),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("CMS DELETE Error:", err);

    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
