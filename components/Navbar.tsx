"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet, LogOut, Shield, Sparkles, User, Menu, X, ArrowUpRight, Crown, Gamepad2, Headphones } from "lucide-react";
import ThemeSelector from "@/components/ThemeSelector";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  wallet?: { balance: number };
}

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
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
                100% Fair RNG
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 text-xs font-extrabold uppercase tracking-wider">
            <Link
              href="/game"
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition ${
                pathname === "/game" ? "bg-purple-600 text-white shadow-glow-violet font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              Game Arena
            </Link>

            {/* Render Wallet Portal link ONLY when user is logged in */}
            {user && (
              <Link
                href="/wallet"
                className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition ${
                  pathname === "/wallet" ? "bg-purple-600 text-white shadow-glow-violet font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                Wallet Portal
              </Link>
            )}

            <Link
              href="/support"
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition ${
                pathname === "/support" ? "bg-purple-600 text-white shadow-glow-violet font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <Headphones className="w-4 h-4 text-indigo-400" />
              24/7 Support
            </Link>

            {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "SUB_ADMIN") && (
              <Link
                href="/admin/dashboard"
                className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition font-black ${
                  pathname === "/admin/dashboard"
                    ? "bg-amber-500 text-slate-950 shadow-glow-gold font-bold"
                    : "text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20"
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right Action Controls & Theme Selector */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSelector />

            {user ? (
              <div className="flex items-center gap-3">
                {/* Live Balance Pill */}
                <Link
                  href="/wallet"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 shadow-inner transition group"
                >
                  <Wallet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="font-mono font-black text-sm text-emerald-400">
                    ₹{user.wallet?.balance?.toFixed(2) || "0.00"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-violet transition transform hover:-translate-y-0.5"
                >
                  Register (Get ₹500)
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu & Theme Selector Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 p-4 space-y-3">
          <Link
            href="/game"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            🕹️ Game Arena
          </Link>

          {user && (
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
            >
              💳 Wallet Portal (Balance: ₹{user?.wallet?.balance?.toFixed(2) || "0.00"})
            </Link>
          )}

          <Link
            href="/support"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            🎧 24/7 VIP Customer Support
          </Link>

          {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "SUB_ADMIN") && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-black text-amber-300 bg-amber-500/10 border border-amber-500/30"
            >
              👑 Executive Admin Panel
            </Link>
          )}

          {!user ? (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center rounded-xl bg-slate-900 text-slate-200 font-bold text-xs"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center rounded-xl bg-purple-600 text-white font-black text-xs shadow-glow-violet"
              >
                Register Account
              </Link>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full py-3 text-center rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 font-bold text-xs"
            >
              Logout Account
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
