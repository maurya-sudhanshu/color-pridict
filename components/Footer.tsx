"use client";

import Link from "next/link";
import { Shield, Sparkles, Zap, Lock, CreditCard, Award, Heart, Gamepad2, Wallet, ArrowUpRight, HelpCircle, Headphones } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 relative overflow-hidden backdrop-blur-xl">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-sm"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Description Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group inline-flex">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 p-0.5 shadow-glow-violet transition transform group-hover:scale-105">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 text-lg">
                  CW
                </div>
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight flex items-center gap-1">
                  Color<span className="text-purple-400">Win</span>
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block -mt-1">
                  100% Fair RNG Platform
                </span>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              ColorWin is India's premiere provably fair color prediction platform featuring 30s Parity, 1-Min Sapre, and 3-Min Bcone multi-timer games with instant UPI payouts.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="bg-slate-900 border border-slate-800 text-[11px] font-bold text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> 256-Bit SSL Secured
              </span>
              <span className="bg-slate-900 border border-slate-800 text-[11px] font-bold text-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Instant UPI Payouts
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-purple-400" /> Game Arenas
            </h3>
            <ul className="space-y-2 text-xs font-bold">
              <li>
                <Link href="/game?category=30s" className="hover:text-amber-300 transition flex items-center gap-1">
                  ⚡ 30s Parity Speed Mode
                </Link>
              </li>
              <li>
                <Link href="/game?category=1min" className="hover:text-emerald-300 transition flex items-center gap-1">
                  ⏱️ 1-Min Sapre Standard Mode
                </Link>
              </li>
              <li>
                <Link href="/game?category=3min" className="hover:text-purple-300 transition flex items-center gap-1">
                  🏆 3-Min Bcone VIP Mode
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-emerald-400 transition flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Wallet & Deposit Portal
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-indigo-400 transition flex items-center gap-1">
                  <Headphones className="w-3.5 h-3.5 text-indigo-400" /> 24/7 VIP Help Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Winning Multipliers Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Payout Multipliers
            </h3>
            <ul className="space-y-2 text-xs font-mono text-slate-300">
              <li className="flex justify-between border-b border-slate-900 pb-1">
                <span>Single Number (0-9):</span>
                <span className="text-emerald-400 font-bold">9.0x Payout</span>
              </li>
              <li className="flex justify-between border-b border-slate-900 pb-1">
                <span>Red / Green Color:</span>
                <span className="text-purple-400 font-bold">2.0x Payout</span>
              </li>
              <li className="flex justify-between border-b border-slate-900 pb-1">
                <span>Violet Color (5,0):</span>
                <span className="text-amber-400 font-bold">4.5x Payout</span>
              </li>
              <li className="flex justify-between pb-1">
                <span>Min Deposit:</span>
                <span className="text-white font-bold">₹100</span>
              </li>
            </ul>
          </div>

          {/* Security & Support Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-400" /> Platform Security
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              All rounds are generated using cryptographic seed hashing to guarantee 100% provable fairness.
            </p>

            <div className="pt-2">
              <Link href="/support" className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition flex items-center gap-1 w-max">
                <Headphones className="w-3 h-3" /> Contact VIP Support
              </Link>
            </div>
          </div>
        </div>

        {/* Responsible Gaming & Disclaimer Banner */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-300 block">⚠️ Responsible Gaming Disclaimer</span>
            <p>
              This platform involves financial risk. Please play responsibly and within your financial limits. Must be 18 years or older to participate.
            </p>
          </div>
          <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 whitespace-nowrap">
            18+ ONLY
          </span>
        </div>

        {/* Bottom Copyright & Rights Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <p>© {new Date().getFullYear()} ColorWin Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/game" className="hover:text-white transition">Game Arena</Link>
            <Link href="/wallet" className="hover:text-white transition">Wallet</Link>
            <Link href="/support" className="hover:text-white transition">Support Desk</Link>
            <span className="text-slate-400 font-mono text-[11px]">System Status: <span className="text-emerald-400 font-bold">100% Operational</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
