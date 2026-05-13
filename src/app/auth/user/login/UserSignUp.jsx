"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import api from "@/lib/api";

/* ---------------- Validation Schema ---------------- */
const signUpSchema = Yup.object({
  firstName: Yup.string().trim().required("First name is required"),
  lastName: Yup.string().trim().required("Last name is required"),
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm your password"),
  agreeTerms: Yup.boolean().oneOf(
    [true],
    "You must agree to the terms and conditions"
  ),
});

export default function UserSignUp() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleRegister = async (values, { setSubmitting }) => {
    setServerError("");

    try {
      const res = await api.post("/auth/user/register", values);

      if (res.data?.success) {
        router.push("/auth/user/login");
      } else {
        setServerError(res.data?.message || "Registration failed");
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Registration failed"
      );
    }

    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={{
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
      }}
      validationSchema={signUpSchema}
      onSubmit={handleRegister}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-5">
          {/* SERVER ERROR */}
          {serverError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {serverError}
            </div>
          )}

          {/* FIRST & LAST NAME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name *</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-3 top-4 text-gray-400 w-4 h-4"
                />
                <Field
                  name="firstName"
                  className="w-full pl-10 py-3 border rounded-lg"
                  placeholder="John"
                />
              </div>
              <ErrorMessage
                name="firstName"
                component="p"
                className="text-xs text-red-600 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Last Name *</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-3 top-4 text-gray-400 w-4 h-4"
                />
                <Field
                  name="lastName"
                  className="w-full pl-10 py-3 border rounded-lg"
                  placeholder="Doe"
                />
              </div>
              <ErrorMessage
                name="lastName"
                component="p"
                className="text-xs text-red-600 mt-1"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium">Email *</label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="absolute left-3 top-4 text-gray-400 w-4 h-4"
              />
              <Field
                name="email"
                type="email"
                className="w-full pl-10 py-3 border rounded-lg"
                placeholder="you@example.com"
              />
            </div>
            <ErrorMessage
              name="email"
              component="p"
              className="text-xs text-red-600 mt-1"
            />
          </div>

          {/* PASSWORD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Password *</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-3 top-4 text-gray-400 w-4 h-4"
                />
                <Field
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-4 text-gray-400"
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                  />
                </button>
              </div>
              <ErrorMessage
                name="password"
                component="p"
                className="text-xs text-red-600 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Confirm Password *
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-3 top-4 text-gray-400 w-4 h-4"
                />
                <Field
                  name="confirmPassword"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  className="w-full pl-10 pr-12 py-3 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-4 text-gray-400"
                >
                  <FontAwesomeIcon
                    icon={
                      showConfirmPassword ? faEyeSlash : faEye
                    }
                  />
                </button>
              </div>
              <ErrorMessage
                name="confirmPassword"
                component="p"
                className="text-xs text-red-600 mt-1"
              />
            </div>
          </div>

          {/* TERMS */}
          <div className="flex items-start gap-3">
            <Field
              type="checkbox"
              name="agreeTerms"
              className="mt-1"
            />
            <p className="text-sm text-gray-600">
              I agree to the{" "}
              <Link href="/terms" className="text-[#FF6A00]">
                Terms & Conditions
              </Link>
            </p>
          </div>
          <ErrorMessage
            name="agreeTerms"
            component="p"
            className="text-xs text-red-600"
          />

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FF6A00] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {isSubmitting
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </Form>
      )}
    </Formik>
  );
}
