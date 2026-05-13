import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs'
// ================= CREATE USER =================
export async function POST(req) {
  try {
    await connectDB();

    const { firstName, lastName, email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email & password required" },
        { status: 400 }
      );
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      role: role || "user",
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
