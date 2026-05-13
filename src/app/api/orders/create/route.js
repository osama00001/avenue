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

    const {
      userId,
      cart,
      shippingAddress,
      paymentMethod,       // "PAYPAL" | "STRIPE" | "COD"
      paypalOrder,         // PayPal API response (when paymentMethod === "PAYPAL")
      stripeIntent,        // Stripe PaymentIntent object (when paymentMethod === "STRIPE")
    } = await req.json();


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

    // ================= PAYMENT METHOD ROUTING =================
    let paymentBlock;
    let totalPaid = total;

    if (paymentMethod === "PAYPAL") {
      const paypalPaidAmount = Number(
        paypalOrder?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
      ) || total;
      totalPaid = paypalPaidAmount;
      paymentBlock = {
        method: "PAYPAL",
        status: "paid",
        transactionId: paypalOrder?.id,
        paypalInfo:    paypalOrder,
      };
    } else if (paymentMethod === "STRIPE") {
      // Server-verify the PaymentIntent — never trust the client's word that
      // payment succeeded. Re-fetch from Stripe and check status + amount.
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      const verified = await stripe.paymentIntents.retrieve(stripeIntent?.id);

      if (verified.status !== "succeeded") {
        return NextResponse.json(
          { error: `PaymentIntent not succeeded: ${verified.status}` },
          { status: 400 }
        );
      }
      // Sanity-check the amount matches what we expect (in pence)
      const expectedPence = Math.round(total * 100);
      if (Math.abs(verified.amount - expectedPence) > 5) {
        return NextResponse.json(
          { error: `Amount mismatch: paid ${verified.amount}p, expected ${expectedPence}p` },
          { status: 400 }
        );
      }

      totalPaid = verified.amount / 100;
      paymentBlock = {
        method: "STRIPE",
        status: "paid",
        transactionId: verified.id,
        stripeInfo: {
          id:         verified.id,
          amount:     verified.amount,
          currency:   verified.currency,
          chargeId:   verified.latest_charge,
          status:     verified.status,
        },
      };
    } else if (paymentMethod === "COD") {
      paymentBlock = { method: "COD", status: "pending" };
    } else {
      return NextResponse.json(
        { error: `Unknown paymentMethod: ${paymentMethod}` },
        { status: 400 }
      );
    }

    // ================= CREATE ORDER =================
    const order = await Order.create({
      user: userSnapshot,
      items,
      shippingAddress,
      payment: paymentBlock,
      subtotal,
      shippingCost,
      total: totalPaid,
      status: "placed",
    });

    // ================= SEND MAILS =================


    // ================= CLEAR CART =================
    if (sessionUser) {
      await Cart.findOneAndUpdate(
        { user: sessionUser.id },
        { $set: { items: [] } }
      );
    } else {
      await clearGuestCart();
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
