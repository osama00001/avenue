import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req, { params }) {
  await connectDB();
  const { token } = await params;
  const { password } = await req.json();

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return Response.json({ success: false, message: "Invalid or expired token" });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  return Response.json({ success: true, message: "Password reset successful" });
}
