import { connectDB } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req) {
  await connectDB();

  const { email } = await req.json();
  const user = await User.findOne({ email });

  if (!user) {
    return Response.json({ message: "Email not found" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // valid for 15 mins
  await user.save();

  const resetLink = `${process.env.NEXTAUTH_URL}/auth/user/reset-password/${token}`;

  console.log("Password reset link:", resetLink);

  return Response.json({ message: "Reset link has been sent!" });
}
