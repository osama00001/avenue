import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import Cart from "@/models/Cart";
import { clearGuestCart } from "@/lib/guestCart";
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/getServerUser";
import { orderMails } from "@/lib/email";

export async function POST(req) {
  try {
    await connectDB();

    const { userId, cart, shippingAddress } = await req.json();
    const sessionUser = await getServerUser();

    // ================= USER SNAPSHOT =================
    const user = await User.findById(userId).lean();

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userSnapshot = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    // ================= ITEMS SNAPSHOT =================
    let subtotal = 0;
    const items = [];

    for (const c of cart) {
      const book = await Book.findById(c.bookId).lean();
      if (!book) continue;

      const priceObj = book.productSupply?.prices?.[0] || {};
      const amount = Number(priceObj.amount) || 0;
      const discount = Number(priceObj.discountPercent) || 0;

      const finalPrice =
        discount > 0 ? amount - (amount * discount) / 100 : amount;

      const price = Number(finalPrice.toFixed(2));
      const currency = priceObj.currency || "GBP";
      const title = book.descriptiveDetail?.titles?.[0]?.text || "Untitled";

      const type = book.type || "book";

      subtotal += price * c.quantity;

      items.push({
        book: book._id,
        title,
        type,
        price,
        currency,
        quantity: c.quantity,
        ebookFormat: c.ebookFormat || null,
      });
    }

    if (!items.length)
      return NextResponse.json({ error: "No valid items" }, { status: 400 });

    // ================= TOTALS =================
    subtotal = Number(subtotal.toFixed(2));
    const shippingCost = subtotal < 25 ? 2.99 : 0;
    const total = Number((subtotal + shippingCost).toFixed(2));

    // ================= CREATE ORDER =================
    const order = await Order.create({
      user: userSnapshot,
      items,
      shippingAddress,

      payment: {
        method: "COD",
        status: "pending",
      },

      subtotal,
      shippingCost,
      total,
    });

    // ================= SEND MAILS (ASYNC SAFE) =================
    orderMails({
      id: order.orderNumber.toString(),
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      total: order.total,
      items: order.items.map((i) => ({
        title: i.title,
        qty: i.quantity,
      })),
    }).catch((err) => console.error("Order mail failed:", err));

    // ================= CLEAR CART =================
    if (sessionUser) {
      await Cart.findOneAndUpdate(
        { user: sessionUser.id },
        { $set: { items: [] } }
      );
    } else {
      await clearGuestCart();
    }

    // ================= RESPONSE =================
    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Order creation error:", err);

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
