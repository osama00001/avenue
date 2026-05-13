import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { userId } = await params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);
    const skip = (page - 1) * limit;

    const query = { "user.userId": userId };

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),

      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Fetch user orders error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
