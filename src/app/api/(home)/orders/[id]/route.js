import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .populate("items.book", "descriptiveDetail.titles")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (err) {
    console.error("Fetch order details error:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
