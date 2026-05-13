import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import BlogCategory from "@/models/BlogCategory";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  await connectDB();

  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json(
      { error: "Slug missing" },
      { status: 400 }
    );
  }

  const blog = await Blog.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("category", "name slug")
    .select("-__v");

  if (!blog) {
    return NextResponse.json(
      { error: "Blog not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: blog });
}
