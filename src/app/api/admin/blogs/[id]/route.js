import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { getServerAdmin } from "@/lib/getServerUser";

/**
 * GET SINGLE
 */
export async function GET(req, { params }) {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const blog = await Blog.findById(id)
    .populate("category")
    .populate("author", "name email");

  return NextResponse.json({ data: blog });
}

/**
 * UPDATE
 */
export async function PUT(req) {
  const admin = await getServerAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const body = await req.json();

  const payload = {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content,
    category: body.category,

    featuredImage: body.coverImage ? body.coverImage : "",

    status: body.published ? "published" : body.status || "draft",
  };

  // console.log("-=-=-=-=-=--==-- published -=-=-=--=--=-=", body.featuredImage);
  // console.log(
  //   "-=-=-=-=-=--==-- body.coverImage -=-=-=--=--=-=",
  //   body.coverImage
  // );
  // console.log("-=-=-=-=-=--==-- featuredImage -=-=-=--=--=-=", body.published);

  const blog = await Blog.findByIdAndUpdate(body.id, payload, { new: true });

  return NextResponse.json({ data: blog });
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

  await Blog.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
