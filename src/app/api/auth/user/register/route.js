import { connectDB } from "@/lib/db";
import { signupMails } from "@/lib/email";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();

    const { firstName, lastName, email, password } = await req.json();

    // Validate fields
    if (!firstName || !lastName || !email || !password) {
      return Response.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return Response.json(
        { success: false, message: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "user",
    });

    // =========================================
    // SEND EMAILS (Non-blocking)
    // =========================================
    signupMails({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    }).catch(err =>
      console.error("Signup mail failed:", err)
    );

    // =========================================

    return Response.json({
      success: true,
      message: "User registered successfully",
    });

  } catch (error) {
    console.error("Registration Error:", error);

    return Response.json(
      { success: false, message: "Server error, please try again" },
      { status: 500 }
    );
  }
}
