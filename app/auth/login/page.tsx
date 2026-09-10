"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail, ArrowRight, Shield, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        window.location.href = "/game";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center relative py-8">
      {/* Radial ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="glass-panel border-purple-500/30 rounded-3xl p-8 sm:p-10 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
        {/* Brand Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Member Portal Access
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400">Log in to enter the game arena & manage your wallet</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400" /> Email or Phone
            </label>
            <input
              type="text"
              placeholder="Enter your email or phone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm font-medium text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Account Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm font-medium text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition"
              required
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-glow-violet transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? "Signing In..." : "Sign In To Account"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-purple-400 font-extrabold hover:text-purple-300 underline">
              Create Account (Get ₹500 Bonus)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
