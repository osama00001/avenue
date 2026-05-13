import { NextResponse } from "next/server";
import { getStrapiPageBySlug } from "@/lib/strapi";

export async function GET(_, { params }) {
  try {
    const { slug } = await params;
    const data = await getStrapiPageBySlug(
      slug,
      "fields[0]=title&fields[1]=slug&fields[2]=level&fields[3]=content"
    );
    return NextResponse.json({ data: data?.data || [] });
  } catch (err) {
    console.error("[/api/strapi/page/[slug]] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
