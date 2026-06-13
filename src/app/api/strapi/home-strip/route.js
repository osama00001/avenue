import { NextResponse } from "next/server";
import { getStrapiMediaUrl, getStrapiSingle } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiSingle("home-strip", "populate=image");
    const entry = data?.data || null;
    const attributes = entry?.attributes ?? entry;
    const image =
      attributes?.image?.url ||
      attributes?.image?.data?.attributes?.url ||
      attributes?.image?.data?.url;

    return NextResponse.json({
      data: {
        id: entry?.id,
        ...attributes,
        imageUrl: getStrapiMediaUrl(image),
      },
    });
  } catch (err) {
    console.error("[/api/strapi/home-strip] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch home strip" },
      { status: 500 }
    );
  }
}
