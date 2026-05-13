import { connectDB } from "@/lib/db";
import BlogCategory from "@/models/BlogCategory";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  const categories = await BlogCategory.find({
    enabled: true,
  }).select("name slug");

  return NextResponse.json({ data: categories });
}
