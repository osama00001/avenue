import { connectDB } from "@/lib/db";
import Address from "@/models/Address";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const address = await Address.findById(id);

    if (!address) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // remove previous defaults
    await Address.updateMany({ user: address.user }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
