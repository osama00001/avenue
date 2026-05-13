import { connectDB } from "@/lib/db";
import Address from "@/models/Address";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
/**
 * =====================================
 * CREATE ADDRESS
 * =====================================
 */
export async function POST(req) {
  try {
    await connectDB();

    const data = await req.json();

    if (!mongoose.Types.ObjectId.isValid(data.user)) {
      return NextResponse.json(
        { success: false, message: "Invalid user" },
        { status: 400 }
      );
    }

    const address = await Address.create(data);

    return NextResponse.json({
      success: true,
      address,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}

/**
 * =====================================
 * GET USER ADDRESSES
 * =====================================
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    const addresses = await Address.find({
      user: userId,
      isDeleted: false,
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: addresses,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
