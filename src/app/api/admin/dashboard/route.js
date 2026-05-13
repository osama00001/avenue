import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Book from "@/models/Book";
import { NextResponse } from "next/server";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();

    // =============================
    // BASIC COUNTS
    // =============================

    const [totalUsers, totalBooks, totalCategories, totalOrders] =
      await Promise.all([
        User.countDocuments(),
        Book.countDocuments(),
        Category.countDocuments(),
        Order.countDocuments(),
      ]);

    // =============================
    // REVENUE
    // =============================

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.revenue || 0;

    // =============================
    // TODAY STATS
    // =============================

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    const todayRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]);

    const todayRevenue = todayRevenueAgg[0]?.revenue || 0;

    // =============================
    // ORDER STATUS BREAKDOWN
    // =============================

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // =============================
    // REVENUE LAST 7 DAYS
    // =============================

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const revenue7Days = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // =============================
    // TOP SELLING BOOKS
    // =============================

    const topBooks = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.book",
          qty: { $sum: "$items.quantity" },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $project: {
          title: "$book.descriptiveDetail.titles.text",
          qty: 1,
        },
      },
    ]);

    return NextResponse.json({
      totals: {
        users: totalUsers,
        books: totalBooks,
        categories: totalCategories,
        orders: totalOrders,
        revenue: totalRevenue,
      },

      today: {
        orders: todayOrders,
        revenue: todayRevenue,
      },

      statusStats,
      revenue7Days,
      topBooks,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
