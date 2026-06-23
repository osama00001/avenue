"use client";

import React from "react";
import { Field, ErrorMessage } from "formik";
import CountrySelect from "@/components/forms/CountrySelect";
import UkPostcodeLookup from "@/components/forms/UkPostcodeLookup";
import { isUnitedKingdom } from "@/lib/countries";

const inputCls =
  "w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-600";

const Input = ({ name, label }) => (
  <div>
    <label className="text-sm text-gray-600">{label}</label>
    <Field name={name} className={inputCls} />
    <ErrorMessage
      name={name}
      component="div"
      className="text-red-500 text-xs mt-1"
    />
  </div>
);

export default function AddressLocationFields({ values, setFieldValue }) {
  const isUk = isUnitedKingdom(values.country);

  return (
    <>
      <CountrySelect />

      {isUk ? (
        <UkPostcodeLookup
          postalCode={values.postalCode}
          setFieldValue={setFieldValue}
        />
      ) : (
        <Input name="postalCode" label="Postal / ZIP Code" />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input name="city" label={isUk ? "Town / City" : "City"} />
        <Input
          name="state"
          label={isUk ? "County / Region" : "State / Province"}
        />
      </div>
    </>
  );
}
