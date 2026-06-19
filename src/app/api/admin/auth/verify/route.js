import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import { requireInternalService } from "@/lib/requireInternalService";

/**
 * POST /api/admin/auth/verify
 * Used by avenue-admin BFF to validate admin credentials.
 * Requires Bearer ADMIN_API_TOKEN when token is configured.
 */
export async function POST(req) {
  const internal = requireInternalService(req);
  if (!internal.ok) return internal.response;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    await connectDB();

    const identifier = email.toLowerCase().trim();
    const adminUser = await Admin.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passMatch = await bcrypt.compare(password, adminUser.password);
    if (!passMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
      },
    });
  } catch (err) {
    console.error("Admin auth verify error:", err);

    const isDbError =
      err.message?.includes("querySrv") ||
      err.message?.includes("ECONNREFUSED") ||
      err.name === "MongoServerSelectionError";

    return NextResponse.json(
      {
        success: false,
        message: isDbError ? "Database connection failed" : "Server error",
      },
      { status: 500 }
    );
  }
}
