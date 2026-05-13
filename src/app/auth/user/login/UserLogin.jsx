"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";

/* ---------------- Validation Schema ---------------- */
const loginSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function UserLogin() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items = [] } = useSelector((state) => state.cart);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  /* ---------------- Handle Login ---------------- */
  const handleLogin = async (values, { setSubmitting }) => {
    setServerError("");
    setSubmitting(true);

    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false, // IMPORTANT
      });

      if (!res || res.error) {
        setServerError("Invalid email or password");
        return;
      }

      // If cart items exist → merge cart
      if (items.length > 0) {
        const response = await fetch("/api/cart/merge", {
          method: "POST",
          credentials: "include", // REQUIRED for NextAuth cookies
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Cart merge failed");
          // Optional: show user-facing message
        } else {
          router.push("/checkout");
          return;
        }
      }

      // Default success flow
      router.back(); // dashboard / profile
    } catch (err) {
      console.error("Login error:", err);
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-[#FF6A00] mb-2">
          Sign In
        </h1>
        <p className="text-gray-600">Welcome back to Avenue</p>
      </div>

      {/* SERVER ERROR */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {/* FORM */}
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginSchema}
        onSubmit={handleLogin}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-3 top-5 text-gray-400 w-4 h-4"
                />
                <Field
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:outline-none"
                />
              </div>
              <ErrorMessage
                name="email"
                component="p"
                className="text-sm text-red-600 mt-1"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-3 top-4 text-gray-400 w-4 h-4"
                />
                <Field
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 cursor-pointer top-4 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              <ErrorMessage
                name="password"
                component="p"
                className="text-sm text-red-600 mt-1"
              />
            </div>

            {/* FORGOT PASSWORD */}
            <Link
              href="/auth/user/forgot-password"
              className="text-sm text-[#FF6A00] hover:underline"
            >
              Forgot your password?
            </Link>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF6A00] cursor-pointer text-white py-3 rounded-lg font-semibold hover:bg-[#d35b05] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </Form>
        )}
      </Formik>

      {/* SIGN UP */}
      <p className="text-center text-gray-600 mt-8">
        Don't have an account?{" "}
        <Link
          href="/auth/user/register"
          className="text-[#FF6A00] font-semibold hover:underline"
        >
          Register here
        </Link>
      </p>
    </div>
  );
}
