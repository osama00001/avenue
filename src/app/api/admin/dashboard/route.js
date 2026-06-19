import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { requireAdminApi } from "@/lib/requireAdminApi";

const CUSTOMER_FILTER = { role: "user", isDeleted: false };

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDayBuckets(days) {
  const buckets = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    buckets.push({
      date: key,
      label: date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      orders: 0,
      revenue: 0,
    });
  }

  return buckets;
}

/**
 * GET /api/admin/dashboard?days=7
 */
export async function GET(req) {
  try {
    const auth = await requireAdminApi(req);
    if (!auth.authorized) return auth.response;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(Number(searchParams.get("days")) || 7, 1), 365);

    const rangeStart = startOfDay(new Date());
    rangeStart.setDate(rangeStart.getDate() - (days - 1));

    const monthStart = startOfDay(new Date());
    monthStart.setDate(1);

    const [
      totalCustomers,
      totalOrders,
      paidRevenueAgg,
      monthRevenueAgg,
      recentOrders,
      recentUsers,
      dailyAgg,
    ] = await Promise.all([
      User.countDocuments(CUSTOMER_FILTER),
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { "payment.status": "paid" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$total", 0] } } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart },
            "payment.status": "paid",
          },
        },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$total", 0] } } } },
      ]),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "orderNumber user createdAt updatedAt payment total status"
        )
        .lean(),
      User.find(CUSTOMER_FILTER)
        .sort({ createdAt: -1 })
        .limit(7)
        .select("firstName lastName email createdAt")
        .lean(),
      Order.aggregate([
        { $match: { createdAt: { $gte: rangeStart } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$payment.status", "paid"] },
                  { $ifNull: ["$total", 0] },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const emails = recentUsers.map((u) => u.email).filter(Boolean);
    const customerOrderStats = emails.length
      ? await Order.aggregate([
          { $match: { "user.email": { $in: emails } } },
          {
            $group: {
              _id: "$user.email",
              orderCount: { $sum: 1 },
              spent: {
                $sum: {
                  $cond: [
                    { $eq: ["$payment.status", "paid"] },
                    { $ifNull: ["$total", 0] },
                    0,
                  ],
                },
              },
            },
          },
        ])
      : [];

    const statsByEmail = Object.fromEntries(
      customerOrderStats.map((row) => [row._id, row])
    );

    const dailyMap = Object.fromEntries(dailyAgg.map((row) => [row._id, row]));
    const chart = buildDayBuckets(days).map((bucket) => {
      const row = dailyMap[bucket.date];
      return {
        name: bucket.label,
        orders: row?.orders || 0,
        revenue: Math.round((row?.revenue || 0) * 100) / 100,
      };
    });

    const newCustomers = recentUsers.map((user) => {
      const stats = statsByEmail[user.email] || { orderCount: 0, spent: 0 };
      return {
        id: user._id.toString(),
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
        email: user.email,
        createdAt: user.createdAt,
        orderCount: stats.orderCount || 0,
        spent: stats.spent || 0,
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenue: paidRevenueAgg[0]?.total || 0,
        monthRevenue: monthRevenueAgg[0]?.total || 0,
        totalOrders,
        totalCustomers,
      },
      chart,
      newCustomers,
      recentOrders,
      days,
    });
  } catch (err) {
    console.error("Admin Dashboard Error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
