import { connectDB } from "@/lib/db";
import CmsPage from "@/models/CmsPage";
import { NextResponse } from "next/server";

/**
 * =========================
 * GET ALL CMS PAGES
 * =========================
 */
export async function GET() {
  try {
    await connectDB();

    const pages = await CmsPage.find({}, "title slug level createdAt")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ data: pages });
  } catch (err) {
    console.error("CMS GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

/**
 * =========================
 * CREATE / UPDATE PAGE
 * =========================
 */

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { _id, title = "", slug, level = 0, blocks = [] } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim();

    let page;

    // ---------- UPDATE ----------
    if (_id) {
      console.log("-=-= id captured -=-=-=-", _id);
      page = await CmsPage.findByIdAndUpdate(
        _id,
        {
          title,
          slug: cleanSlug,
          level,
          blocks,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
    }

    // ---------- CREATE ----------
    else {
      page = await CmsPage.create({
        title,
        slug: cleanSlug,
        level,
        blocks,
      });
    }

    return NextResponse.json({ data: page });
  } catch (err) {
    console.error("CMS POST Error:", err);
    return NextResponse.json({ error: "Failed to save page" }, { status: 500 });
  }
}
