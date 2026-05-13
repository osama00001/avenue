import { NextResponse } from "next/server";
import BlogCategory from "@/models/BlogCategory";
import { getServerAdmin } from "@/lib/getServerUser";
import { connectDB } from "@/lib/db";
/**
 * ==============================
 * GET ALL
 * ==============================
 */
export async function GET() {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const categories = await BlogCategory.find()
    .sort({ order: 1, createdAt: -1 });

  return NextResponse.json({ data: categories });
}

/**
 * ==============================
 * CREATE
 * ==============================
 */
export async function POST(req) {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const body = await req.json();

  if (!body.name || !body.slug) {
    return NextResponse.json(
      { error: "Name and slug required" },
      { status: 400 }
    );
  }

  const category = await BlogCategory.create(body);

  return NextResponse.json({ data: category });
}
