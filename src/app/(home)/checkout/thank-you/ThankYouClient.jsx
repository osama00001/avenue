"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

const AnimatedBackground = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-yellow-50" />

    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className="blob bg1" />
      <div className="blob bg2" />
      <div className="blob bg3" />
    </div>
  </>
);

const ThankYouClient = () => {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order");
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AnimatedBackground />

      {/* CARD */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/40 shadow-2xl rounded-3xl p-12 text-center max-w-xl w-full">
        {/* Animated Check */}
        <div className="flex justify-center mb-6">
          <div className="checkmark-circle">
            <svg viewBox="0 0 52 52" className="checkmark">
              <path
                fill="none"
                stroke="#10b981"
                // bg-[#FF6A00]
                strokeWidth="4"
                d="M14 27l7 7 17-17"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-semibold mb-3 tracking-tight">
          Order Confirmed
        </h1>

        <p className="text-gray-600 mb-6">
          Your purchase was successful — we’re preparing your items.
        </p>

        {/* Order ID */}
        <div className="bg-gray-100 rounded-xl p-4 mb-8">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Order Reference
          </div>
          <div className="font-mono text-lg mt-1 text-gray-900">
            {orderId || "—"}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/")}
            className="bg-[#FF6A00] cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-[#db5d03] transition font-medium"
          >
            Continue Shopping
          </button>

          {/* <button
            onClick={() => router.push("/account/orders")}
            className="border cursor-pointer border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            View Orders
          </button> */}
        </div>
      </div>

      {/* ================= STYLES ================= */}
      <style jsx>{`
        .blob {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.45;
          animation: float 20s infinite alternate ease-in-out;
        }

        .bg1 {
          background: #34d399;
          top: -120px;
          left: -120px;
        }

        .bg2 {
          background: #60a5fa;
          bottom: -120px;
          right: -120px;
          animation-delay: 4s;
        }

        .bg3 {
          background: #fde68a;
          top: 40%;
          left: 40%;
          animation-delay: 8s;
        }

        @keyframes float {
          from {
            transform: translate(0px, 0px);
          }
          to {
            transform: translate(90px, 70px);
          }
        }

        /* Check animation */

        .checkmark-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #ecfdf5;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pop 0.5s ease-out forwards;
        }

        .checkmark path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: draw 0.6s ease forwards 0.3s;
        }

        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pop {
          from {
            transform: scale(0.6);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ThankYouClient;
