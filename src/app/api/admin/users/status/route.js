import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    await connectDB();

    const { id, status } = await req.json();

    // ---------- Validation ----------
    if (!id || typeof status !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    // ---------- Update ----------
    const updated = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status },
      { new: true }
    ).select("_id status");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ---------- Success ----------
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("Status update error:", err);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
