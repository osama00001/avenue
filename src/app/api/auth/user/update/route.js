import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: body,
      },
      { new: true, runValidators: true }
    ).select("-password");

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}
