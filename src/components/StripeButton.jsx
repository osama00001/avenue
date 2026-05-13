"use client";
import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearCart } from "@/store/cartSlice";
import toast from "react-hot-toast";

// Loaded once per app
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

/**
 * Outer component — fetches a PaymentIntent client_secret on mount, then
 * renders <Elements> with that secret so the inner form can confirm payment.
 */
export default function StripeButton({ amount, userId, cart, selectedAddress }) {
  const [clientSecret, setClientSecret]   = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    if (!cart?.length || !selectedAddress) return;

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        cart: cart.map(i => ({ bookId: i.book._id, quantity: i.quantity })),
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      })
      .catch(err => setError(err.message));
  }, [cart, userId, selectedAddress]);

  if (error) return <div className="text-red-600 text-sm">Stripe error: {error}</div>;
  if (!clientSecret) return <div className="text-gray-500 text-sm">Loading payment form…</div>;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "#FF6A00" } },
      }}
    >
      <CardForm
        userId={userId}
        cart={cart}
        selectedAddress={selectedAddress}
        paymentIntentId={paymentIntentId}
      />
    </Elements>
  );
}

/**
 * Inner form — actually submits the card via Stripe SDK and, on success,
 * POSTs to /api/orders/create so the order is recorded in Mongo.
 */
function CardForm({ userId, cart, selectedAddress, paymentIntentId }) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();
  const dispatch = useDispatch();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);

    // 1. Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/thank-you`,
      },
    });

    if (error) {
      toast.error(error.message || "Payment failed");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      toast.error(`Payment status: ${paymentIntent?.status}`);
      setSubmitting(false);
      return;
    }

    // 2. Record the order in our DB
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cart: cart.map(i => ({
            bookId:      i.book._id,
            quantity:    i.quantity,
            ebookFormat: i.ebookFormat || null,
          })),
          shippingAddress: selectedAddress,
          paymentMethod:   "STRIPE",
          stripeIntent:    paymentIntent,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Order creation failed");

      dispatch(clearCart());
      toast.success("Payment successful — order placed");
      router.push(`/checkout/thank-you?order=${data.order._id}`);
    } catch (err) {
      // Webhook will reconcile if we crash here, but tell the user something
      toast.error("Payment captured but order recording failed — we'll reconcile from Stripe. Check email shortly.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className={`w-full py-3 rounded-lg text-white ${
          submitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#FF6A00] hover:bg-[#e86406] cursor-pointer"
        }`}
      >
        {submitting ? "Processing…" : "Pay Now"}
      </button>
    </form>
  );
}
