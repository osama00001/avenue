"use client";

import { useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await api.post("/auth/user/forgot-password", { email });
    setMsg(res.data.message);
  }

  return (
    <div>
      <Header />
      <div className="max-w-md mx-auto mt-10 mb-10 p-6 bg-white shadow rounded">
        <h1 className="text-xl font-bold mb-4">Forgot Password</h1>

        {msg && <p className="mb-3 text-blue-600">{msg}</p>}

        <form onSubmit={submit} className="space-y-3">
          <Label>Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <Button type="submit">Send Reset Link</Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
