"use client";

import { useEffect, useRef } from "react";

export default function PayPalButton({ amount, userId, cart, selectedAddress }) {
  const paypalRef = useRef(null);

  // Convert cart to payload (same as COD)
  const cartPayload = cart.map((item) => ({
    bookId: item.book._id,
    quantity: item.quantity,
    ebookFormat: item.ebookFormat || null,
  }));

  useEffect(() => {
    if (paypalRef.current) paypalRef.current.innerHTML = "";

    const load = () => {
      if (window.paypal) return renderButton();

      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=EUR`;
      script.onload = renderButton;
      document.body.appendChild(script);
    };

    const renderButton = () => {
      if (!window.paypal) return;

      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
          });

          const data = await res.json();
          return data.id;
        },

        onApprove: async (data) => {
          // 1️⃣ Capture PayPal payment
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          });

          const paypalOrder = await res.json();

          // 2️⃣ Create order WITH CART + ADDRESS
          const orderRes = await fetch("/api/orders/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              cart: cartPayload,
              shippingAddress: selectedAddress,
              paymentMethod: "PayPal",
              paypalOrder,
            }),
          });
          const savedOrder = await orderRes.json();

          console.log("Order saved:", savedOrder);
          // 3️⃣ Redirect to Thank You Page
          window.location.href = `/checkout/thank-you?order=${savedOrder.order._id}`;
    
        },

        onError: (err) => {
          console.error("PayPal Error:", err);
          alert("Payment failed");
        },
      }).render(paypalRef.current);
    };

    load();
  }, [amount]);

  return <div ref={paypalRef}></div>;
}
