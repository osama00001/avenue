import { NextResponse } from "next/server";

/**
 * Restricts server-to-server endpoints (e.g. admin auth verify)
 * to callers that possess ADMIN_API_TOKEN.
 */
export function requireInternalService(req) {
  const token = process.env.ADMIN_API_TOKEN;

  if (!token) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Service misconfigured" },
          { status: 503 }
        ),
      };
    }
    return { ok: true };
  }

  const authHeader = req.headers.get("authorization") || "";
  const provided = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (provided && provided === token) {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
  };
}
