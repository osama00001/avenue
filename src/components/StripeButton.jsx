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

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function getBookId(item) {
  return item?.book?._id || item?.book;
}

function buildCartPayload(cart) {
  return (cart || [])
    .map((item) => ({
      bookId: getBookId(item),
      quantity: item.quantity || 1,
      ebookFormat: item.ebookFormat || null,
    }))
    .filter((item) => item.bookId);
}

export default function StripeButton({ userId, cart, selectedAddress }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [error, setError] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  useEffect(() => {
    if (!publishableKey) {
      setError("Stripe is not configured (missing publishable key).");
      return;
    }

    const payload = buildCartPayload(cart);
    if (!payload.length || !selectedAddress || !userId) return;

    let cancelled = false;
    setLoadingIntent(true);
    setError(null);
    setClientSecret(null);

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, cart: payload }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Failed to start payment");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Payment setup failed");
      })
      .finally(() => {
        if (!cancelled) setLoadingIntent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cart, userId, selectedAddress]);

  if (!publishableKey) {
    return (
      <div className="text-red-600 text-sm">
        Stripe is not configured. Contact support.
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-sm">Stripe error: {error}</div>;
  }

  if (loadingIntent || !clientSecret) {
    return <div className="text-gray-500 text-sm">Loading payment form…</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "#1a1a1a" } },
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

function CardForm({ userId, cart, selectedAddress, paymentIntentId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment form is still loading. Please wait a moment.");
      return;
    }

    setSubmitting(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/checkout/thank-you`,
        },
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        return;
      }

      if (!paymentIntent?.id) {
        toast.error("Payment did not complete. Please try again.");
        return;
      }

      if (paymentIntent.status !== "succeeded") {
        toast.error(`Payment not completed (${paymentIntent.status}). Please try again.`);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          userId,
          cart: buildCartPayload(cart),
          shippingAddress: selectedAddress,
          paymentMethod: "STRIPE",
          stripeIntentId: paymentIntent.id,
        }),
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Order creation failed");
      }

      dispatch(clearCart());
      toast.success("Payment successful — order placed");
      router.push(`/checkout/thank-you?order=${data.order._id}`);
    } catch (err) {
      if (err?.name === "AbortError") {
        toast.error(
          "Order recording timed out. If payment was taken, we will confirm by email."
        );
      } else {
        toast.error(err.message || "Something went wrong. Please try again.");
      }
      console.error("[StripeButton]", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className={`w-full py-3 rounded-lg text-white ${
          submitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#1a1a1a] hover:bg-[#262626] cursor-pointer"
        }`}
      >
        {submitting ? "Processing…" : "Pay Now"}
      </button>
    </form>
  );
}
