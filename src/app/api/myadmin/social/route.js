/**
 * Public social-links endpoint.
 *
 * Same path-mismatch reason as /api/myadmin/cms — the frontend slice fetches
 * /api/myadmin/social but the implementation only exists at /api/admin/social.
 * This exposes a read-only version for the Footer.
 */

import { connectDB } from "@/lib/db";
import SocialMedia from "@/models/SocialMedia";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    let doc = await SocialMedia.findOne();
    if (!doc) {
      doc = await SocialMedia.create({ links: [] });
    }
    return NextResponse.json({ data: doc.links });
  } catch (err) {
    console.error("[/api/myadmin/social] error:", err);
    return NextResponse.json({ error: "Failed to fetch social links" }, { status: 500 });
  }
}
