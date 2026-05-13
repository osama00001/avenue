import { connectDB } from "@/lib/db";
import Address from "@/models/Address";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

/**
 * =====================================
 * UPDATE ADDRESS
 * =====================================
 */
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const data = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const updated = await Address.findByIdAndUpdate(id, data, { new: true });

    return NextResponse.json({
      success: true,
      address: updated,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * =====================================
 * SOFT DELETE ADDRESS
 * =====================================
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await Address.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
