import { NextResponse } from "next/server";
import { getStrapiCollection } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiCollection(
      "pages",
      "fields[0]=title&fields[1]=slug&fields[2]=level&sort[0]=level:asc&sort[1]=createdAt:desc"
    );
    return NextResponse.json({ data: data?.data || [] });
  } catch (err) {
    console.error("[/api/strapi/pages] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}
