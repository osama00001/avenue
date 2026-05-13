/**
 * Public CMS page-detail endpoint.
 * Mirrors /api/myadmin/cms but for individual page lookup by slug.
 */

import { connectDB } from "@/lib/db";
import CmsPage from "@/models/CmsPage";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  try {
    await connectDB();
    const { slug } = await params;

    const page = await CmsPage.findOne({ slug }).lean();
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ data: page });
  } catch (err) {
    console.error("[/api/myadmin/cms/[slug]] error:", err);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}
