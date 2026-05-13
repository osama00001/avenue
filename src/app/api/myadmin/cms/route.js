/**
 * Public CMS list endpoint.
 *
 * The frontend Redux slices were authored to fetch /api/myadmin/... but the
 * actual implementation lives under /api/admin/... — that path mismatch is
 * why the Footer was rendering "No pages" everywhere despite the seed having
 * populated 9 CMS pages successfully.
 *
 * Rather than rewriting all the admin slices (which carry knock-on effects
 * across the admin UI), we expose the public-readable parts of the CMS
 * surface here. The Footer only needs title/slug/level for navigation, so
 * this route returns just that.
 */

import { connectDB } from "@/lib/db";
import CmsPage from "@/models/CmsPage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const pages = await CmsPage.find({}, "title slug level createdAt")
      .sort({ level: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ data: pages });
  } catch (err) {
    console.error("[/api/myadmin/cms] error:", err);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}
