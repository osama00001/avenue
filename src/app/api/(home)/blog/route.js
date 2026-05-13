import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import BlogCategory from "@/models/BlogCategory";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const categorySlug = searchParams.get("category");
  const search = searchParams.get("search");

  const query = {
    status: "published", // ⭐ FIX
  };

  // Category filter
  if (categorySlug) {
    const cat = await BlogCategory.findOne({
      slug: categorySlug,
      enabled: true,
    });

    if (cat) {
      query.category = cat._id;
    } else {
      return NextResponse.json({ data: [] });
    }
  }

  // Search filter
  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const blogs = await Blog.find(query)
    .populate("category", "name slug ")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("title slug excerpt featuredImage createdAt category");

  return NextResponse.json({ data: blogs });
}
