import { connectDB } from "@/lib/db";
import CmsPage from "@/models/CmsPage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const pages = await CmsPage.find({}, "title slug level createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: pages });
  } catch (err) {
    console.error("CMS LIST Error:", err);

    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}
