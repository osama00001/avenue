import { NextResponse } from "next/server";
import { getStrapiSingle } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiSingle(
      "site-settings",
      "populate[logo]=*"
    );
    return NextResponse.json({ data: data?.data || null });
  } catch (err) {
    console.error("[/api/strapi/site-settings] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch site settings" },
      { status: 500 }
    );
  }
}
