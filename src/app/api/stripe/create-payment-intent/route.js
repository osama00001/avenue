import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Book from '@/models/Book';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/stripe/create-payment-intent
 *
 * Body: {
 *   userId:    string,         // Mongo user id (snapshot only — payment doesn't require it)
 *   cart:      [{ bookId, quantity }],
 *   shippingPostcode?: string  // optional, used if you wire up tax/shipping rules later
 * }
 *
 * Returns: { clientSecret, paymentIntentId, amount, currency }
 *
 * IMPORTANT: We compute the amount **server-side** from the cart items, never
 * trusting any total the client sends — otherwise a hostile client could pay
 * £0.01 for a £20 book. The client only tells us *what* is in the cart.
 */
export async function POST(req) {
  try {
    await connectDB();
    const { userId, cart } = await req.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // ── Recompute amount server-side from current Book prices ────────────────
    let subtotalPence = 0;
    const itemSummaries = [];
    let currency = 'gbp';

    for (const c of cart) {
      const book = await Book.findById(c.bookId).lean();
      if (!book) continue;

      const priceObj = book.productSupply?.prices?.[0] || {};
      const amount   = Number(priceObj.amount)         || 0;
      const discount = Number(priceObj.discountPercent) || 0;
      const finalPrice = discount > 0 ? amount - (amount * discount) / 100 : amount;
      const linePence  = Math.round(finalPrice * 100) * (c.quantity || 1);

      subtotalPence += linePence;
      currency       = (priceObj.currency || 'GBP').toLowerCase();

      itemSummaries.push({
        id:    String(book._id),
        title: book.descriptiveDetail?.titles?.[0]?.text || 'Untitled',
        qty:   c.quantity || 1,
        price: finalPrice,
      });
    }

    if (subtotalPence === 0) {
      return NextResponse.json({ error: 'No valid items priced' }, { status: 400 });
    }

    // Match the existing checkout's shipping rule: free over £25, else £2.99
    const shippingPence = subtotalPence >= 2500 ? 0 : 299;
    const totalPence    = subtotalPence + shippingPence;

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount:   totalPence,
      currency,
      automatic_payment_methods: { enabled: true }, // lets Stripe route to card / Apple Pay / etc.
      metadata: {
        userId:        userId || '',
        itemCount:     String(itemSummaries.length),
        // Stripe metadata values are capped at 500 chars per key, so keep this terse
        cartSummary:   JSON.stringify(itemSummaries.map(i => `${i.id}x${i.qty}`)).slice(0, 480),
        subtotalPence: String(subtotalPence),
        shippingPence: String(shippingPence),
      },
      description: `Avenue Bookstore order — ${itemSummaries.length} item(s)`,
    });

    return NextResponse.json({
      clientSecret:    intent.client_secret,
      paymentIntentId: intent.id,
      amount:          totalPence,
      currency,
    });
  } catch (err) {
    console.error('[stripe/create-payment-intent] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
