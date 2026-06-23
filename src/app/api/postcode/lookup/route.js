import { NextResponse } from "next/server";
import { mapPostcodeResult } from "@/lib/ukPostcodeLookup";

const POSTCODES_IO = "https://api.postcodes.io/postcodes";

export async function GET(request) {
  const postcode = request.nextUrl.searchParams.get("postcode")?.trim();

  if (!postcode) {
    return NextResponse.json({ error: "Postcode is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${POSTCODES_IO}/${encodeURIComponent(postcode.replace(/\s+/g, ""))}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();

    if (!res.ok || !data.result) {
      return NextResponse.json(
        { error: "Postcode not found. Please check and try again." },
        { status: 404 }
      );
    }

    const address = mapPostcodeResult(data.result);
    return NextResponse.json({ address, raw: data.result });
  } catch {
    return NextResponse.json(
      { error: "Unable to look up postcode right now. Please try again." },
      { status: 502 }
    );
  }
}
