import { NextResponse } from "next/server";
import { getServerAdmin } from "@/lib/getServerUser";

/**
 * Authorize admin API requests via Bearer token (avenue-admin BFF)
 * or existing NextAuth admin session (avenue /admin UI).
 */
export async function requireAdminApi(req) {
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (process.env.NODE_ENV === "production" && !adminToken) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Service misconfigured" },
        { status: 503 }
      ),
    };
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (adminToken && token && token === adminToken) {
    return { authorized: true, via: "token" };
  }

  const admin = await getServerAdmin();
  if (admin) {
    return { authorized: true, via: "session", admin };
  }

  return {
    authorized: false,
    response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
  };
}
