"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: username,
      password,
      admin: "true",
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid username or password");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">

      <Card className="w-full max-w-md shadow-xl border border-slate-700 bg-slate-800 text-white">
        
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            {/* Replace with your logo */}
            <span className="text-3xl font-bold text-white tracking-wide">
              📚 Books Admin
            </span>
          </div>
          
          <CardTitle className="text-xl font-semibold mt-2">
            Admin Login
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
          )}

          <form className="space-y-4" onSubmit={submit}>

            {/* Username */}
            <div>
              <Label className="text-slate-300 mb-2">Username</Label>
              <Input
                className="bg-slate-900 border-slate-700 text-white placeholder-gray-400"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Password with toggle */}
            <div>
              <Label className="text-slate-300 mb-2">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  className="bg-slate-900 border-slate-700 text-white placeholder-gray-400"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

          </form>
        </CardContent>

      </Card>
    </div>
  );
}
