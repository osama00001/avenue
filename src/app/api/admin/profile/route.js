import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AdminModel from "@/models/Admin"; // <-- renamed
import { getServerAdmin } from "@/lib/getServerUser";
import bcrypt from "bcryptjs";

export async function GET() {
  const admin = await getServerAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // ⭐ Fetch by ID (best practice)
    const user = await AdminModel.findById(admin.id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Admin profile error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await getServerAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json();

    /**
     * ===============================
     * Fetch Admin by SESSION ID
     * (Never trust client id)
     * ===============================
     */
    const existingAdmin = await AdminModel.findById(admin.id);

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    /**
     * ===============================
     * Prepare update fields
     * ===============================
     */
    const updateData = {
      name: body.name,
      username: body.username,
      email: body.email,
    };

    /**
     * Update password ONLY if provided
     */
    if (body.password && body.password.trim()) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    /**
     * ===============================
     * Update
     * ===============================
     */
    const updatedUser = await AdminModel.findByIdAndUpdate(
      admin.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("Admin update error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
