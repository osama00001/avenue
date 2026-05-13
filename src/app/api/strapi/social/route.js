import { NextResponse } from "next/server";
import { getStrapiCollection } from "@/lib/strapi";

export async function GET() {
  try {
    const data = await getStrapiCollection(
      "social-links",
      "fields[0]=label&fields[1]=url&fields[2]=icon&fields[3]=order&fields[4]=enabled&sort[0]=order:asc"
    );
    return NextResponse.json({ data: data?.data || [] });
  } catch (err) {
    console.error("[/api/strapi/social] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch social links" },
      { status: 500 }
    );
  }
}
