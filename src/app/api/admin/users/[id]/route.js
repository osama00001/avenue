import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";



// ================= GET SINGLE USER =================
export async function GET(req, context) {
  try {
    await connectDB();

    const { id } = await context.params; // ✅ FIX

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    }).select("-password -resetToken -resetTokenExpiry");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Admin get user error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// ================= HARD DELETE USER =================
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User permanently deleted",
    });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// ================= UPDATE USER (ADMIN) =================
export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    // -------- Allowed Fields --------
    const allowedFields = ["firstName", "lastName", "email", "role", "status"];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // -------- Optional Password Update --------
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -resetToken -resetTokenExpiry");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
