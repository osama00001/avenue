import { NextResponse } from "next/server";
import { getStrapiMediaUrl, getStrapiSingle } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiSingle("home-banner", "populate=slides.image");
    const entry = data?.data || null;
    const attributes = entry?.attributes ?? entry;
    const slides = (attributes?.slides || []).map((slide) => {
      const image =
        slide.image?.url ||
        slide.image?.data?.attributes?.url ||
        slide.image?.data?.url;
      return {
        ...slide,
        imageUrl: getStrapiMediaUrl(image),
      };
    });
    return NextResponse.json({
      data: {
        id: entry?.id,
        ...attributes,
        slides,
      },
    });
  } catch (err) {
    console.error("[/api/strapi/home-banner] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch home banner" },
      { status: 500 }
    );
  }
}
