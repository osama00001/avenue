import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { requireAdminApi } from "@/lib/requireAdminApi";

/**
 * GET /api/admin/orders?page=1&limit=50&search=&status=&completed=true
 */
export async function GET(req) {
  try {
    const auth = await requireAdminApi(req);
    if (!auth.authorized) return auth.response;

    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 50);

    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const completed = searchParams.get("completed") === "true";

    const skip = (page - 1) * limit;

    const query = {};

    if (completed) {
      query.status = "delivered";
      query["payment.status"] = "paid";
    } else if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (err) {
    console.error("Admin Orders Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
