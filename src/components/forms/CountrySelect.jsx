"use client";

import React from "react";
import { Field, ErrorMessage } from "formik";
import { COUNTRIES } from "@/lib/countries";

const selectCls =
  "w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white";

export default function CountrySelect({ name = "country", label = "Country" }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <Field as="select" name={name} className={selectCls}>
        {COUNTRIES.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </Field>
      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-xs mt-1"
      />
    </div>
  );
}
