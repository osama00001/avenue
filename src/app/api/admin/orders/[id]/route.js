import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";

/**
 * ======================================================
 * GET — FETCH SINGLE ORDER
 * /api/orders/:id
 * ======================================================
 */
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = params;

    // ---------- VALIDATE ----------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Order Details Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
