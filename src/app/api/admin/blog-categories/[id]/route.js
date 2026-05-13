import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BlogCategory from "@/models/BlogCategory";
import { getServerAdmin } from "@/lib/getServerUser";

/**
 * UPDATE
 */
export async function PUT(req, { params }) {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();
  const body = await req.json();

  const updated = await BlogCategory.findByIdAndUpdate(id, body, {
    new: true,
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE
 */
export async function DELETE(req, { params }) {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  await BlogCategory.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
