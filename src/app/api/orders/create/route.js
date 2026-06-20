import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Cart from "@/models/Cart";
import { clearGuestCart } from "@/lib/guestCart";
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/getServerUser";
import { computeOrderPricing } from "@/lib/orderPricing";
import { getStripe } from "@/lib/stripe";

export async function POST(req) {
  try {
    await connectDB();

    const {
      userId,
      cart,
      shippingAddress,
      paymentMethod,
      paypalOrder,
      stripeIntent,
      stripeIntentId,
    } = await req.json();

    const sessionUser = await getServerUser();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userSnapshot = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    const pricing = await computeOrderPricing(cart);
    const items = pricing.lineItems.map((line) => ({
      book: line.bookId,
      title: line.title,
      type: line.type,
      price: line.price,
      currency: line.currency,
      quantity: line.quantity,
      ebookFormat: line.ebookFormat,
    }));

    let paymentBlock;
    let totalPaid = pricing.total;

    if (paymentMethod === "PAYPAL") {
      const paypalPaidAmount =
        Number(
          paypalOrder?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
        ) || pricing.total;
      totalPaid = paypalPaidAmount;
      paymentBlock = {
        method: "PAYPAL",
        status: "paid",
        transactionId: paypalOrder?.id,
        paypalInfo: paypalOrder,
      };
    } else if (paymentMethod === "STRIPE") {
      const stripe = getStripe();
      const intentId = stripeIntentId || stripeIntent?.id;

      if (!intentId) {
        return NextResponse.json(
          { error: "Missing Stripe payment reference" },
          { status: 400 }
        );
      }

      const verified = await stripe.paymentIntents.retrieve(intentId);

      if (verified.status !== "succeeded") {
        return NextResponse.json(
          { error: `PaymentIntent not succeeded: ${verified.status}` },
          { status: 400 }
        );
      }

      if (Math.abs(verified.amount - pricing.totalPence) > 5) {
        console.warn(
          `[orders/create] Stripe amount ${verified.amount} vs expected ${pricing.totalPence}`
        );
      }

      totalPaid = verified.amount / 100;
      paymentBlock = {
        method: "STRIPE",
        status: "paid",
        transactionId: verified.id,
        stripeInfo: {
          id: verified.id,
          amount: verified.amount,
          currency: verified.currency,
          chargeId: verified.latest_charge,
          status: verified.status,
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

    const order = await Order.create({
      user: userSnapshot,
      items,
      shippingAddress,
      payment: paymentBlock,
      subtotal: pricing.subtotal,
      shippingCost: pricing.shippingCost,
      total: totalPaid,
      status: "placed",
    });

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
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
