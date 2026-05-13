import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // ---------- Search Filter ----------
    const filter = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // ---------- Query ----------
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -resetToken -resetTokenExpiry") // CRITICAL
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      list: users,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error("Admin Users Fetch Error:", err);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
