import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { getServerAdmin } from "@/lib/getServerUser";

/**
 * ===========================
 * GET ALL BLOGS
 * ===========================
 */
export async function GET() {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const blogs = await Blog.find()
    .populate("category", "name slug")
    .sort({ createdAt: -1 });

  return NextResponse.json({ data: blogs });
}

/**
 * ===========================
 * CREATE BLOG
 * ===========================
 */
export async function POST(req) {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const body = await req.json();

  /**
   * ============================
   * NORMALIZE INPUT
   * ============================
   */
  const payload = {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content,

    category: body.category,

    // ⭐ FIXED MAPPINGS
    featuredImage: body.coverImage || body.featuredImage || "",

    status: body.published ? "published" : body.status || "draft",

    author: admin.id,
  };

  const blog = await Blog.create(payload);

  return NextResponse.json({ data: blog });
}
