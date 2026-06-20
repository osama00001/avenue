import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { computeOrderPricing } from "@/lib/orderPricing";

/**
 * POST /api/stripe/create-payment-intent
 */
export async function POST(req) {
  try {
    await connectDB();
    const { userId, cart } = await req.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const pricing = await computeOrderPricing(cart);
    const itemSummaries = pricing.lineItems.map((i) => ({
      id: i.bookId,
      title: i.title,
      qty: i.quantity,
      price: i.price,
    }));

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: pricing.totalPence,
      currency: pricing.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId || "",
        itemCount: String(itemSummaries.length),
        cartSummary: JSON.stringify(
          itemSummaries.map((i) => `${i.id}x${i.qty}`)
        ).slice(0, 480),
        subtotalPence: String(pricing.subtotalPence),
        shippingPence: String(pricing.shippingPence),
      },
      description: `Avenue Bookstore order — ${itemSummaries.length} item(s)`,
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: pricing.totalPence,
      currency: pricing.currency,
    });
  } catch (err) {
    console.error("[stripe/create-payment-intent] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
