"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createAddress } from "@/store/addressSlice";

// ================= VALIDATION =================

const schema = Yup.object({
  label: Yup.string().required("Required"),

  name: Yup.string().required("Required"),

  phone: Yup.string()
    .matches(/^[0-9]{8,15}$/, "Invalid phone")
    .required("Required"),

  line1: Yup.string().required("Required"),
  line2: Yup.string(),

  city: Yup.string().required("Required"),
  state: Yup.string().required("Required"),

  postalCode: Yup.string().required("Required"),

  country: Yup.string().required("Required"),

  isDefault: Yup.boolean(),
});

// ================= COMPONENT =================

const AddAddressForm = ({ userId, onSuccess }) => {
  const dispatch = useDispatch();
  const { saving } = useSelector((s) => s.address);
const {user} = useSelector(state =>state?.user);
  const initialValues = {
    label: "Home",
    name: user?.firstName+" "+user?.lastName || "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "UK",
    isDefault: false,
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Add Address</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, { resetForm }) => {
          await dispatch(
            createAddress({
              ...values,
              user: userId,
            })
          );

          resetForm();
          onSuccess?.();
        }}
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-4">
            {/* Label */}
            <Input name="label" label="Address Label" />

            {/* Name */}
            <Input name="name" label="Full Name" />

            {/* Phone */}
            <Input name="phone" label="Phone" />

            {/* Address Lines */}
            <Input name="line1" label="Address Line 1" />
            <Input name="line2" label="Address Line 2" />

            {/* City / State */}
            <div className="grid grid-cols-2 gap-4">
              <Input name="city" label="City" />
              <Input name="state" label="State" />
            </div>

            {/* Postal / Country */}
            <div className="grid grid-cols-2 gap-4">
              <Input name="postalCode" label="Postal Code" />
              <Input name="country" label="Country" />
            </div>

            {/* Default Toggle */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={values.isDefault}
                onChange={() => setFieldValue("isDefault", !values.isDefault)}
              />
              Set as default address
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full cursor-pointer bg-teal-700 text-white py-3 rounded-lg hover:bg-teal-800 transition"
            >
              {saving ? "Saving..." : "Add Address"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddAddressForm;

// ================= Reusable Input =================

const Input = ({ name, label }) => (
  <div>
    <label className="text-sm text-gray-600">{label}</label>

    <Field
      name={name}
      className="w-full border rounded-lg px-3 py-2 mt-1
      focus:outline-none focus:ring-2 focus:ring-teal-600"
    />

    <ErrorMessage
      name={name}
      component="div"
      className="text-red-500 text-xs mt-1"
    />
  </div>
);
