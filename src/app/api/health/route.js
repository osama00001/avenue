import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    await connectDB();
    const dbState = mongoose.connection.readyState;
    const dbOk = dbState === 1;

    return NextResponse.json(
      {
        status: dbOk ? "ok" : "degraded",
        service: "avenue",
        checks: {
          database: dbOk ? "up" : "down",
        },
        uptimeSec: Math.floor(process.uptime()),
        responseMs: Date.now() - started,
      },
      { status: dbOk ? 200 : 503 }
    );
  } catch (err) {
    console.error("[health] error:", err);
    return NextResponse.json(
      {
        status: "error",
        service: "avenue",
        checks: { database: "down" },
        responseMs: Date.now() - started,
      },
      { status: 503 }
    );
  }
}
