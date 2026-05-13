import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerAdmin } from "@/lib/getServerUser";
import SocialMedia from "@/models/SocialMedia";
/**
 * =========================================
 * GET SOCIAL CONFIG
 * =========================================
 */
export async function GET() {
  // const admin = await getServerAdmin();

  // if (!admin) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  await connectDB();

  let doc = await SocialMedia.findOne();

  // Auto-create empty config
  if (!doc) {
    doc = await SocialMedia.create({ links: [] });
  }

  return NextResponse.json({ data: doc.links });
}

/**
 * =========================================
 * UPDATE SOCIAL CONFIG
 * =========================================
 */
export async function PUT(req) {
  const admin = await getServerAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const body = await req.json();
  const { links = [] } = body;

  let doc = await SocialMedia.findOne();

  if (!doc) {
    doc = new SocialMedia({ links });
  } else {
    doc.links = links;
  }

  await doc.save();

  return NextResponse.json({ data: doc.links });
}
