import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { getStripe } from '@/lib/stripe';

// Stripe needs the raw, unparsed body for signature verification — Next 15
// gives it to us via req.text() if we tell the route to skip body parsing.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';   // crypto, no edge runtime

/**
 * POST /api/stripe/webhook
 *
 * Subscribed events:
 *   - payment_intent.succeeded        → mark order paid, fire LCP for ebooks
 *   - payment_intent.payment_failed   → mark order failed
 *   - charge.refunded                 → mark order refunded
 *   - charge.dispute.created          → log dispute on the order, alert ops
 *
 * The webhook is the **source of truth** for payment state. Even if the
 * frontend's success callback never fires (browser closed, network drop), this
 * endpoint will still run and the order status will be correct.
 */
export async function POST(req) {
  const sig    = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'webhook misconfigured' }, { status: 500 });
  }

  const stripe  = getStripe();
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err.message);
    return NextResponse.json({ error: `webhook signature: ${err.message}` }, { status: 400 });
  }

  try {
    await connectDB();

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDispute(event.data.object);
        break;

      default:
        // Acknowledge unknown events with 200 so Stripe doesn't retry forever
        console.log(`[stripe/webhook] unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe/webhook] handler error for ${event?.type}:`, err);
    // Return 500 so Stripe retries — better than silently dropping a payment event
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------

async function handlePaymentSucceeded(paymentIntent) {
  // The order should already exist (created by /api/orders/create after the
  // client-side confirm). Find it by paymentIntent.id and flip status to paid.
  const order = await Order.findOneAndUpdate(
    { 'payment.transactionId': paymentIntent.id },
    {
      $set: {
        'payment.status':           'paid',
        'payment.stripeInfo':       summarizeIntent(paymentIntent),
      },
    },
    { new: true }
  );

  if (!order) {
    console.warn(`[stripe/webhook] No order found for paymentIntent ${paymentIntent.id} — order creation may have failed client-side`);
    return;
  }

  console.log(`[stripe/webhook] Order ${order.orderNumber} marked paid (£${(paymentIntent.amount / 100).toFixed(2)})`);

  // ── Fire LCP for any ebook line items ──────────────────────────────────────
  const ebooks = (order.items || []).filter(i => i.type === 'ebook' || i.ebookFormat);
  if (ebooks.length === 0) return;

  // LCP fulfilment requires customer passphrase + hint, which the current
  // checkout UI doesn't yet collect. The order document needs:
  //   order.lcpFulfilment.passphrase   (encrypted via lcp-encrypt or similar)
  //   order.lcpFulfilment.passphraseHint
  // Until the frontend collects them we log + flag the order as needing
  // manual fulfilment. The LCP path itself is proven via the smoke test.
  const passphrase     = order.lcpFulfilment?.passphrase;
  const passphraseHint = order.lcpFulfilment?.passphraseHint;

  if (!passphrase || !passphraseHint) {
    console.warn(`[stripe/webhook] Order ${order.orderNumber} has ebooks but no passphrase — flagging for manual LCP fulfilment`);
    await Order.updateOne(
      { _id: order._id },
      { $set: { 'lcpFulfilment.status': 'awaiting_passphrase' } }
    );
    return;
  }

  // Dynamic import keeps the heavy LCP module out of the cold-path webhook bundle
  const { placeLcpOrder } = await import('@/scripts/order-lcp.js');

  const fulfillments = [];
  for (const [i, item] of ebooks.entries()) {
    const orderNoRef = `${order.orderNumber}-${i}`.slice(0, 40);
    try {
      const result = await placeLcpOrder({
        isbn13:         item.book?.recordReference || item.isbn13,
        formatCode:     mapFormatCode(item.ebookFormat),
        orderNoRef,
        orderLineRef:   `L${i}`.slice(0, 15),
        customerName:   `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer',
        customerEmail:  order.user?.email || '',
        passphrase,
        passphraseHint,
        endUserId:      String(order.user?.userId || order._id),
        localSalesPrice: item.price,
        localSalesTax:   0, // adjust when you add VAT
      });
      fulfillments.push({ isbn: item.book, ...result });
    } catch (err) {
      fulfillments.push({ isbn: item.book, ok: false, message: err.message });
    }
  }

  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        'lcpFulfilment.status':       fulfillments.every(f => f.ok) ? 'completed' : 'partial',
        'lcpFulfilment.fulfillments': fulfillments,
        'lcpFulfilment.completedAt':  new Date(),
      },
    }
  );
}

async function handlePaymentFailed(paymentIntent) {
  await Order.updateOne(
    { 'payment.transactionId': paymentIntent.id },
    {
      $set: {
        'payment.status':         'failed',
        'payment.stripeInfo':     summarizeIntent(paymentIntent),
        status:                   'cancelled',
      },
    }
  );
  console.log(`[stripe/webhook] PaymentIntent ${paymentIntent.id} failed: ${paymentIntent.last_payment_error?.message}`);
}

async function handleRefund(charge) {
  const piId = charge.payment_intent;
  await Order.updateOne(
    { 'payment.transactionId': piId },
    {
      $set: {
        'payment.status':              'refunded',
        'payment.refundedAt':          new Date(),
        'payment.refundedAmountPence': charge.amount_refunded,
      },
    }
  );
  console.log(`[stripe/webhook] Charge ${charge.id} refunded (£${(charge.amount_refunded / 100).toFixed(2)})`);
}

async function handleDispute(dispute) {
  const piId = dispute.payment_intent;
  await Order.updateOne(
    { 'payment.transactionId': piId },
    {
      $set: {
        'payment.disputeStatus': dispute.status,
        'payment.disputeReason': dispute.reason,
        'payment.disputedAt':    new Date(),
      },
    }
  );
  console.warn(`[stripe/webhook] DISPUTE created on ${piId}: ${dispute.reason}. Respond in Stripe by ${new Date(dispute.evidence_details.due_by * 1000).toISOString()}`);
  // TODO: send email to ops via lib/email
}

// ---------------------------------------------------------------------------

function summarizeIntent(pi) {
  return {
    id:        pi.id,
    amount:    pi.amount,
    currency:  pi.currency,
    chargeId:  pi.latest_charge,
    receiptUrl: pi.charges?.data?.[0]?.receipt_url || null,
    status:    pi.status,
  };
}

// Map our internal ebook-format names → Gardners format codes
//   2 = PDF, 5 = MP3, 6 = ePub, 12 = LCP-protected ePub, 16 = …
function mapFormatCode(fmt) {
  if (!fmt) return '6';
  const f = String(fmt).toLowerCase();
  if (f.includes('pdf'))  return '2';
  if (f.includes('mp3') || f.includes('audio')) return '5';
  if (f.includes('lcp'))  return '12';
  return '6'; // default ePub
}
