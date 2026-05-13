import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 50);
    const code = searchParams.get("code") || "";
    const scheme = searchParams.get("scheme") || "";
    const skip = (page - 1) * limit;

    const filter = {};
    if (code) filter.code = { $regex: code, $options: "i" };

    const categories = await Category.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    // Flatten schemes array for frontend table
    const flattenedData = [];
    for (const cat of categories) {
      if (cat.schemes && cat.schemes.length > 0) {
        for (const s of cat.schemes) {
          // Filter by scheme if provided
          if (scheme && !s.scheme?.toLowerCase().includes(scheme.toLowerCase())) {
            continue;
          }
          flattenedData.push({
            _id: cat._id,
            code: cat.code,
            level: cat.level,
            scheme: s.scheme,
            headingText: s.headingText,
            status: s.status,
            updatedAt: cat.updatedAt,
            createdAt: cat.createdAt,
          });
        }
      } else {
        // Category with no schemes
        flattenedData.push({
          _id: cat._id,
          code: cat.code,
          level: cat.level,
          scheme: "",
          headingText: "",
          status: true,
          updatedAt: cat.updatedAt,
          createdAt: cat.createdAt,
        });
      }
    }

    const total = flattenedData.length;
    const paginatedData = flattenedData.slice(skip, skip + limit);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: paginatedData,
    });
  } catch (err) {
    console.error("❌ CATEGORY GET ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
