import { NextResponse } from "next/server";
import { uploadSiteContentImage } from "@/lib/siteContent";
import {
  authorizeSiteContentRequest,
  siteContentErrorResponse,
} from "@/lib/siteContentRoute";

export async function POST(req) {
  const gate = await authorizeSiteContentRequest(req);
  if (gate.error) return gate.error;

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "file is required" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await uploadSiteContentImage({
        buffer,
        filename: file.name || "upload.jpg",
        mimeType: file.type || "image/jpeg",
      });
      return NextResponse.json({ data });
    }

    const body = await req.json();
    const data = await uploadSiteContentImage(body);
    return NextResponse.json({ data });
  } catch (err) {
    return siteContentErrorResponse(err, "Failed to upload image");
  }
}
