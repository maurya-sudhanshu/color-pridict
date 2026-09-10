"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail, Phone, ArrowRight, Sparkles, Gift, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: phone || undefined, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="glass-panel border-emerald-500/30 rounded-3xl p-8 sm:p-10 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
        {/* Welcome Bonus Highlight Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black shadow-glow-green">
            <Gift className="w-3.5 h-3.5 text-amber-400" /> ₹500 Free Wallet Credit Included
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Free Account</h1>
          <p className="text-xs text-slate-400">Join India's premiere 100% Provably Fair prediction platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" /> Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. yourname@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Create Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition"
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
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-glow-green transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? "Creating Account..." : "Claim ₹500 & Start Playing"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already registered?{" "}
            <Link href="/auth/login" className="text-emerald-400 font-extrabold hover:text-emerald-300 underline">
              Log In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
