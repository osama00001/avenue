import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function PATCH(req) {
  try {
    await connectDB();

    const { id, status } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    return NextResponse.json({ order });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
