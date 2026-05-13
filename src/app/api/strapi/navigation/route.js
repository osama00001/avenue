import { NextResponse } from "next/server";
import { getStrapiSingle } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiSingle(
      "navigation",
      "populate[mainMenu]=*&populate[utilityMenu]=*"
    );
    return NextResponse.json({ data: data?.data || null });
  } catch (err) {
    console.error("[/api/strapi/navigation] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch navigation" },
      { status: 500 }
    );
  }
}
