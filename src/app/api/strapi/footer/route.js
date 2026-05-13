import { NextResponse } from "next/server";
import { getStrapiSingle } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiSingle(
      "footer",
      "populate[columns][populate][links]=*"
    );
    return NextResponse.json({ data: data?.data || null });
  } catch (err) {
    console.error("[/api/strapi/footer] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch footer" },
      { status: 500 }
    );
  }
}
