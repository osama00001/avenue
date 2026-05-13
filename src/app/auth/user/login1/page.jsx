"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function UserLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    try {
      const response = await fetch("/api/cart/merge", {
        method: "POST",
        credentials: "include", // REQUIRED for auth cookies
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }
    } catch (error) {
      console.error("API error:", error.message);
    }

    router.push("/user"); // redirect to user dashboard or homepage
  };

  return (
    <div>
      <Header />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-[#FF6A00] mb-2">
              Sign In
            </h1>
            <p className="text-gray-600">Welcome back to Avenue</p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSignIn} className="space-y-6">
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
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent transition"
                />
              </div>
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
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-4 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            {/* FORGOT PASSWORD */}
            <Link
              href="/auth/user/forgot-password"
              className="text-sm text-[#FF6A00] hover:underline"
            >
              Forgot your password?
            </Link>

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6A00] text-white py-3 rounded-lg font-semibold hover:bg-[#2a5560] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* SOCIAL SIGN IN */}
          {/* <div className="space-y-3">
            <button className="w-full border border-gray-300 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <button className="w-full border border-gray-300 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#000000"
                width="30px"
                height="30px"
                viewBox="0 0 24 24"
              >
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
              Continue with Apple
            </button>
          </div> */}

          {/* SIGN UP LINK */}
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
      </div>

      <Footer />
    </div>
  );
}
