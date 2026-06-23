"use client";

import React, { useState } from "react";
import { Field, ErrorMessage } from "formik";
import toast from "react-hot-toast";
import { lookupUkPostcode } from "@/lib/ukPostcodeLookup";

const inputCls =
  "w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-600";

export default function UkPostcodeLookup({ setFieldValue, postalCode }) {
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    try {
      const { address } = await lookupUkPostcode(postalCode);
      setFieldValue("postalCode", address.postalCode);
      setFieldValue("city", address.city);
      setFieldValue("state", address.state);
      toast.success("Address details filled from postcode");
    } catch (err) {
      toast.error(err.message || "Postcode lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="text-sm text-gray-600">Postcode</label>
      <div className="flex gap-2 mt-1">
        <Field
          name="postalCode"
          placeholder="e.g. SW1A 2AA"
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading || !postalCode?.trim()}
          className="shrink-0 px-4 py-2 text-sm font-medium border border-[#1a1a1a] text-[#1a1a1a] rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Finding..." : "Find address"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Enter your UK postcode and we&apos;ll fill in your town and county.
      </p>
      <ErrorMessage
        name="postalCode"
        component="div"
        className="text-red-500 text-xs mt-1"
      />
    </div>
  );
}
