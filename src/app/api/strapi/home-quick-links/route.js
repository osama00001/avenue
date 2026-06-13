import { NextResponse } from "next/server";
import { getStrapiMediaUrl, getStrapiSingle } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiSingle(
      "home-quick-links",
      "populate=items.image"
    );
    const entry = data?.data || null;
    const attributes = entry?.attributes ?? entry;
    const items = (attributes?.items || [])
      .map((item) => {
        const image =
          item.image?.url ||
          item.image?.data?.attributes?.url ||
          item.image?.data?.url;
        const imageUrl = getStrapiMediaUrl(image);
        if (!imageUrl) return null;
        return {
          ...item,
          imageUrl,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      data: {
        id: entry?.id,
        ...attributes,
        items,
      },
    });
  } catch (err) {
    console.error("[/api/strapi/home-quick-links] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch home quick links" },
      { status: 500 }
    );
  }
}
