"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, Zap, Lock, Award, ArrowRight, Dices, Calculator, CheckCircle2, XCircle, Sparkles, TrendingUp } from "lucide-react";

export default function Home() {
  const [calcBetAmount, setCalcBetAmount] = useState<number>(100);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Banner Section */}
      <section className="relative text-center space-y-6 max-w-4xl mx-auto pt-4">
        {/* Glow ambient background pill */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-purple-500/40 text-purple-300 text-xs font-extrabold shadow-glow-violet animate-float">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          100% Provably Fair & Independent Server RNG
        </div>

        <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white leading-none">
          Predict Colors & Numbers <br />
          <span className="bg-gradient-to-r from-emerald-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Win Instant Multipliers
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The ultimate transparent prediction platform. Outcomes are generated independently using server-side crypto RNG with zero pool calculation and zero house manipulation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/game"
            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base shadow-glow-violet transition transform hover:-translate-y-1"
          >
            <Dices className="w-6 h-6 text-emerald-300 group-hover:rotate-12 transition-transform" />
            Enter Live Game Hub
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass-panel glass-panel-hover text-slate-200 font-extrabold text-base transition"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            Claim ₹500 Welcome Bonus
          </Link>
        </div>

        {/* Live Platform Stats Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-3xl mx-auto">
          <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-emerald-400">100%</span>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Independent RNG</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-purple-400">9.0x</span>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Number Multiplier</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-amber-400">₹0</span>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Withdrawal Fees</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-pink-400">Instant</span>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Wallet Settlement</p>
          </div>
        </div>
      </section>

      {/* Interactive Payout Return Calculator */}
      <section className="glass-panel border-purple-500/30 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-purple-400 font-extrabold text-xs uppercase tracking-wider">
              <Calculator className="w-4 h-4" /> Live Multiplier Return Calculator
            </div>
            <h2 className="text-2xl font-black text-white">Simulate Your Winnings</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Select Bet Amount:</span>
            <span className="text-xl font-black text-emerald-400 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              ₹{calcBetAmount}
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-3">
          <input
            type="range"
            min={50}
            max={5000}
            step={50}
            value={calcBetAmount}
            onChange={(e) => setCalcBetAmount(Number(e.target.value))}
            className="w-full accent-purple-500 h-2.5 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono font-bold">
            <span>₹50</span>
            <span>₹1,000</span>
            <span>₹2,500</span>
            <span>₹5,000</span>
          </div>
        </div>

        {/* Dynamic Return Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-950/80 border neon-border-green rounded-2xl p-5 space-y-2 text-center relative group hover:scale-[1.02] transition">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              GREEN (1, 3, 7, 9) - 2.0x
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              ₹{(calcBetAmount * 2).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Profit: +₹{(calcBetAmount * 1).toFixed(2)}</p>
          </div>

          <div className="bg-slate-950/80 border neon-border-violet rounded-2xl p-5 space-y-2 text-center relative group hover:scale-[1.02] transition">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs">
              VIOLET (0, 5) - 4.0x
            </span>
            <div className="text-3xl font-black text-purple-400 font-mono">
              ₹{(calcBetAmount * 4).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Profit: +₹{(calcBetAmount * 3).toFixed(2)}</p>
          </div>

          <div className="bg-slate-950/80 border neon-border-red rounded-2xl p-5 space-y-2 text-center relative group hover:scale-[1.02] transition">
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-bold text-xs">
              RED (2, 4, 6, 8) - 2.0x
            </span>
            <div className="text-3xl font-black text-red-400 font-mono">
              ₹{(calcBetAmount * 2).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Profit: +₹{(calcBetAmount * 1).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-slate-950/90 border neon-border-gold rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-amber-400 font-black text-sm uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
              <Award className="w-4 h-4" /> Exact Single Digit Match (0-9)
            </span>
            <p className="text-xs text-slate-400">Select the exact winning number for maximum return.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold uppercase block">9.0x Payout Return</span>
            <span className="text-3xl font-black text-amber-400 font-mono">₹{(calcBetAmount * 9).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Provably Fair vs Rigged Architecture Comparison */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Why ColorWin is 100% Fair</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare our independent RNG model against manipulative house-edge color platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rigged Platforms Card */}
          <div className="glass-panel border-red-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-black text-base border-b border-slate-800 pb-3">
              <XCircle className="w-5 h-5 text-red-500" />
              Rigged / Manipulated Platforms
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                Result calculated based on total pool betting amounts to minimize house payout.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                Outcome dynamically switches to whichever number has the lowest bets.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                Hidden admin overrides and rigged house algorithm.
              </li>
            </ul>
          </div>

          {/* ColorWin Fair Card */}
          <div className="glass-panel border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-glow-green">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-base border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ColorWin Provably Fair Architecture
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                Outcome generated independently via Node crypto RNG (0-9) before settlement.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                System never inspects pool totals or bet placement amounts.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                Transparent settlement and instant automated wallet payouts.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3-Step How-To-Play Timeline */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">How To Get Started</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-black text-purple-300 text-lg">
              1
            </div>
            <h3 className="font-extrabold text-lg text-white">Create Free Account</h3>
            <p className="text-xs text-slate-400">
              Register with your email or phone number in 10 seconds and claim your complimentary ₹500 welcome bonus.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-black text-indigo-300 text-lg">
              2
            </div>
            <h3 className="font-extrabold text-lg text-white">Select Prediction</h3>
            <p className="text-xs text-slate-400">
              Pick Green (2x), Red (2x), Violet (4x), or a single digit Number (9x) before the round timer expires.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-300 text-lg">
              3
            </div>
            <h3 className="font-extrabold text-lg text-white">Instant Payout</h3>
            <p className="text-xs text-slate-400">
              Winning predictions are automatically settled into your wallet and available for immediate bank withdrawal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
