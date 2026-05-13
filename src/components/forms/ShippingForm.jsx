"use client";

import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// ================= Validation =================

const schema = Yup.object({
  name: Yup.string().required("Required"),
  phone: Yup.string()
    .matches(/^[0-9]{8,15}$/, "Invalid phone")
    .required("Required"),

  line1: Yup.string().required("Address required"),
  line2: Yup.string(),

  city: Yup.string().required("Required"),
  state: Yup.string().required("Required"),

  postalCode: Yup.string()
    .required("Required")
    .matches(/^[A-Za-z0-9\- ]+$/, "Invalid code"),

  country: Yup.string().required("Required"),
});

// ================= Component =================

const ShippingForm = ({ onSubmit }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

      <Formik
        initialValues={{
          name: "",
          phone: "",
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "UK",
        }}
        validationSchema={schema}
        onSubmit={onSubmit}
      >
        {() => (
          <Form className="space-y-4">
            {/* Name */}
            <Input name="name" label="Full Name" />

            {/* Phone */}
            <Input name="phone" label="Phone" />

            {/* Address */}
            <Input name="line1" label="Address Line 1" />
            <Input name="line2" label="Address Line 2 (Optional)" />

            {/* Row */}
            <div className="grid grid-cols-2 gap-4">
              <Input name="city" label="City" />
              <Input name="state" label="State" />
            </div>

            {/* Row */}
            <div className="grid grid-cols-2 gap-4">
              <Input name="postalCode" label="Postal Code" />
              <Input name="country" label="Country" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-4 bg-teal-700 text-white py-3 rounded-lg hover:bg-teal-800 transition"
            >
              Save Address
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ShippingForm;

// ================= Reusable Input =================

const Input = ({ name, label }) => (
  <div>
    <label className="text-sm text-gray-600">{label}</label>

    <Field
      name={name}
      className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-600"
    />

    <ErrorMessage
      name={name}
      component="div"
      className="text-red-500 text-xs mt-1"
    />
  </div>
);
