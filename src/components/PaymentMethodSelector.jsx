"use client";

import { useState } from "react";
import { FaPaypal } from "react-icons/fa";
import { SiStripe } from "react-icons/si";

export default function PaymentMethodSelector({ onSelect }) {
  const [selected, setSelected] = useState("stripe");

  const handleSelect = (method) => {
    setSelected(method);
    onSelect(method);
  };

  return (
    <div className="w-full space-y-4">
      {/* STRIPE BUTTON */}
      <div
        onClick={() => handleSelect("stripe")}
        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all 
        ${selected === "stripe" ? "border-green-500 bg-green-50 shadow-sm" : "border-gray-300 bg-white"}`}
      >
        <div className="flex items-center gap-3">
          <SiStripe className="text-4xl text-[#635bff]" />
          <div>
            <p className="font-semibold text-base">Pay Online</p>
            <p className="text-sm text-gray-500">Pay using STRIPE</p>
          </div>
        </div>

        <span
          className={`w-4 h-4 rounded-full border flex items-center justify-center 
          ${selected === "stripe" ? "border-green-600" : "border-gray-400"}`}
        >
          {selected === "stripe" && <span className="w-2 h-2 bg-green-600 rounded-full"></span>}
        </span>
      </div>

      {/* PAYPAL BUTTON */}
      <div
        onClick={() => handleSelect("paypal")}
        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all 
        ${selected === "paypal" ? "border-green-500 bg-green-50 shadow-sm" : "border-gray-300 bg-white"}`}
      >
        <div className="flex items-center gap-3">
          <FaPaypal className="text-4xl text-[#003087]" />
          <div>
            <p className="font-semibold text-base">Pay Online</p>
            <p className="text-sm text-gray-500">Pay using PAYPAL</p>
          </div>
        </div>

        <span
          className={`w-4 h-4 rounded-full border flex items-center justify-center 
          ${selected === "paypal" ? "border-blue-600" : "border-gray-400"}`}
        >
          {selected === "paypal" && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
        </span>
      </div>
    </div>
  );
}
