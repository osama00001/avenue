"use client";

import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import ToggleSwitch from "@/components/custom/ToggleSwitch";

// ================= Validation =================

const schema = Yup.object({
  firstName: Yup.string().required("Required"),
  lastName: Yup.string().required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(6, "Min 6 characters"),
  status: Yup.boolean(),
});

// ================= Component =================

const UserForm = ({
  initialValues,
  onSubmit,
  loading,
  submitLabel = "Save",
}) => {
  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(values) => {
        const payload = { ...values };

        // Remove empty password
        if (!payload.password) {
          delete payload.password;
        }

        onSubmit(payload);
      }}
    >
      {({ values, setFieldValue }) => (
        <Form className="bg-white shadow rounded p-6 space-y-4">
          {/* First Name */}
          <div>
            <Field
              name="firstName"
              placeholder="First Name"
              className="w-full border p-2 rounded"
            />
            <ErrorMessage
              name="firstName"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          {/* Last Name */}
          <div>
            <Field
              name="lastName"
              placeholder="Last Name"
              className="w-full border p-2 rounded"
            />
            <ErrorMessage
              name="lastName"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <Field
              name="email"
              placeholder="Email"
              className="w-full border p-2 rounded"
            />
            <ErrorMessage
              name="email"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <Field
              name="password"
              type="password"
              placeholder="Password"
              className="w-full border p-2 rounded"
            />
            <ErrorMessage
              name="password"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          {/* Status */}
          <label className="flex items-center gap-2">
            <ToggleSwitch
              checked={values.status}
              onChange={() => setFieldValue("status", !values.status)}
            />
            Active
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-teal-700 cursor-pointer hover:bg-teal-800 text-white rounded"
          >
            {submitLabel}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default UserForm;
