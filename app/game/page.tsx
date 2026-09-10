"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import { CATEGORY_CONFIG, GameCategory } from "@/lib/game-engine";
import { Dices, Trophy, History, Shield, Wallet, Sparkles, AlertCircle, RefreshCw, Zap, Clock, CheckCircle2, XCircle, ArrowUpRight, Filter, ChevronRight } from "lucide-react";

interface GameResult {
  number: number;
  color: string;
}

interface GameRoundData {
  id: string;
  category: GameCategory;
  roundNumber: number;
  startsAt: string;
  closesAt: string;
  status: string;
  result?: GameResult;
}

interface UserBet {
  id: string;
  betType: string;
  selection: string;
  amount: number;
  status: string;
  payoutAmount: number;
  createdAt: string;
  round: {
    roundNumber: number;
    category: string;
    result?: GameResult;
  };
}

interface UserProfile {
  id: string;
  email: string;
  wallet?: { balance: number };
}

export default function GameHubPage() {
  const router = useRouter();
  const [category, setCategory] = useState<GameCategory>("3min");
  const [betHistoryCategoryFilter, setBetHistoryCategoryFilter] = useState<string>("ALL");
  const [activeRound, setActiveRound] = useState<GameRoundData | null>(null);
  const [recentRounds, setRecentRounds] = useState<GameRoundData[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Bet Modal State
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState<"COLOR" | "NUMBER">("COLOR");
  const [selectedSelection, setSelectedSelection] = useState<string>("GREEN");
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betSubmitting, setBetSubmitting] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);

  const [timerIsLocked, setTimerIsLocked] = useState(false);

  const config = CATEGORY_CONFIG[category];

  const fetchUserData = async () => {
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

  const fetchRoundData = async (cat = category) => {
    try {
      const res = await fetch(`/api/game/round?category=${cat}`);
      if (res.ok) {
        const data = await res.json();
        if (data.round) {
          setActiveRound({
            id: data.round.id,
            category: data.round.category,
            roundNumber: data.round.roundNumber,
            startsAt: data.round.startsAt,
            closesAt: data.round.closesAt,
            status: data.round.status,
          });
        }
        if (data.recentResults) {
          setRecentRounds(
            data.recentResults.map((r: any) => ({
              id: r.id,
              category: cat,
              roundNumber: r.roundNumber,
              startsAt: "",
              closesAt: "",
              status: "COMPLETED",
              result: {
                number: r.number,
                color: r.color,
              },
            }))
          );
        }
      }
    } catch (e) {
      console.error("Failed to fetch round data", e);
    }
  };

  const fetchUserBets = async (historyFilter = betHistoryCategoryFilter) => {
    try {
      const url =
        historyFilter !== "ALL"
          ? `/api/game/bet?category=${historyFilter}`
          : "/api/game/bet";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUserBets(data.bets || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    setBetHistoryCategoryFilter(category);
    fetchRoundData(category);
    fetchUserBets(category);
  }, [category]);

  useEffect(() => {
    fetchUserBets(betHistoryCategoryFilter);
  }, [betHistoryCategoryFilter]);

  // Polling ticker for round sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoundData(category);
      if (user) {
        fetchUserBets(betHistoryCategoryFilter);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [category, user, betHistoryCategoryFilter]);

  const handleOpenBetModal = (type: "COLOR" | "NUMBER", selection: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (timerIsLocked) {
      alert(`Betting is locked for the last ${config.lockSeconds}s of the round. Please wait for next round.`);
      return;
    }
    setSelectedBetType(type);
    setSelectedSelection(selection);
    setBetAmount(100);
    setBetError(null);
    setIsBetModalOpen(true);
  };

  const handlePlaceBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setBetSubmitting(true);
    setBetError(null);

    try {
      const res = await fetch("/api/game/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          betType: selectedBetType,
          selection: selectedSelection,
          amount: Number(betAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBetError(data.error || "Failed to place bet");
      } else {
        setIsBetModalOpen(false);
        fetchUserData();
        fetchUserBets(betHistoryCategoryFilter);
      }
    } catch (err: any) {
      setBetError(err.message || "An error occurred");
    } finally {
      setBetSubmitting(false);
    }
  };

  const handleTimerExpire = () => {
    setTimeout(() => {
      fetchRoundData(category);
      fetchUserData();
      fetchUserBets(betHistoryCategoryFilter);
    }, 1500);
  };

  const categoryName = config.name;
  const targetClosesAt = activeRound?.closesAt || new Date(Date.now() + config.durationSeconds * 1000).toISOString();

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Background ambient glow effects */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-emerald-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Top Banner & VIP Category Bar */}
      <div className="glass-panel border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-glow-violet">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-purple-300">
                <Dices className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Live Game Arena
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  Provably Fair
                </span>
              </h1>
              <p className="text-xs text-slate-400">Select mode, place predictions, and win up to 9.0x instant returns</p>
            </div>
          </div>

          {/* User Wallet Balance Badge */}
          {user ? (
            <div className="flex items-center gap-3 bg-slate-950/90 p-3 px-5 rounded-2xl border border-slate-800/80 shadow-xl">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Available Balance</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  ₹{user.wallet?.balance?.toFixed(2) || "0.00"}
                </span>
              </div>
              <button
                onClick={() => router.push("/wallet")}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-glow-violet transition transform hover:scale-105"
              >
                + Deposit
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/auth/login")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-glow-violet hover:scale-105 transition"
            >
              Login To Place Bets
            </button>
          )}
        </div>

        {/* High-End Mode Switcher Tab Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          <button
            onClick={() => setCategory("30s")}
            className={`py-4 px-4 rounded-2xl font-black text-xs sm:text-sm border transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 group ${
              category === "30s"
                ? "bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white border-amber-400 shadow-glow-gold scale-[1.02]"
                : "bg-slate-950/90 text-slate-300 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
            }`}
          >
            <Zap className={`w-5 h-5 ${category === "30s" ? "text-amber-200 animate-bounce" : "text-amber-400"}`} />
            <div className="text-center sm:text-left">
              <span className="block leading-tight">⚡ 30s Parity</span>
              <span className="text-[10px] font-normal opacity-80 block">Super Speed</span>
            </div>
          </button>

          <button
            onClick={() => setCategory("1min")}
            className={`py-4 px-4 rounded-2xl font-black text-xs sm:text-sm border transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 group ${
              category === "1min"
                ? "bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-600 text-white border-emerald-400 shadow-glow-green scale-[1.02]"
                : "bg-slate-950/90 text-slate-300 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
            }`}
          >
            <Clock className={`w-5 h-5 ${category === "1min" ? "text-emerald-200 animate-spin" : "text-emerald-400"}`} />
            <div className="text-center sm:text-left">
              <span className="block leading-tight">⏱️ 1-Min Sapre</span>
              <span className="text-[10px] font-normal opacity-80 block">Standard Pace</span>
            </div>
          </button>

          <button
            onClick={() => setCategory("3min")}
            className={`py-4 px-4 rounded-2xl font-black text-xs sm:text-sm border transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 group ${
              category === "3min"
                ? "bg-gradient-to-r from-purple-600 via-indigo-700 to-purple-600 text-white border-purple-400 shadow-glow-violet scale-[1.02]"
                : "bg-slate-950/90 text-slate-300 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
            }`}
          >
            <Trophy className={`w-5 h-5 ${category === "3min" ? "text-purple-200 animate-pulse" : "text-purple-400"}`} />
            <div className="text-center sm:text-left">
              <span className="block leading-tight">🏆 3-Min Bcone</span>
              <span className="text-[10px] font-normal opacity-80 block">VIP Classic</span>
            </div>
          </button>
        </div>
      </div>

      {/* Arena Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Arena Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Round & Countdown Header Card */}
          <div className="glass-panel border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden bg-slate-900/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active Mode: {categoryName}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  Round #{activeRound?.roundNumber || "..."}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    Live Server RNG Connected
                  </span>
                </div>
              </div>

              {/* Prominent Digital Countdown Clock */}
              <div className="shrink-0 flex justify-center">
                <CountdownTimer
                  closesAt={targetClosesAt}
                  lockSeconds={config.lockSeconds}
                  onExpire={handleTimerExpire}
                  onLockChange={setTimerIsLocked}
                />
              </div>
            </div>

            {/* Locked Warning Bar */}
            {timerIsLocked && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center gap-2 animate-pulse shadow-glow-gold">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Betting Locked for Last {config.lockSeconds}s of {categoryName} Round! Please wait for next round.</span>
              </div>
            )}

            {/* 3D Color Prediction Action Buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                  Color Predictions
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Select color to bet</span>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {/* Green Button */}
                <button
                  onClick={() => handleOpenBetModal("COLOR", "GREEN")}
                  className="group relative bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-800 hover:from-emerald-400 hover:to-emerald-700 text-white font-black py-7 px-3 rounded-3xl shadow-glow-green border-2 border-emerald-400/60 transition-all duration-300 transform hover:-translate-y-1.5 active:scale-95 flex flex-col items-center justify-center gap-2 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-3xl pointer-events-none" />
                  <span className="text-xl sm:text-3xl tracking-wider text-shadow font-black">GREEN</span>
                  <span className="text-xs font-mono font-bold bg-slate-950/80 px-3.5 py-1 rounded-full border border-emerald-400/40 text-emerald-300 shadow-inner">
                    2.0x
                  </span>
                  <span className="text-[11px] font-mono text-emerald-100/80">(1, 3, 7, 9)</span>
                </button>

                {/* Violet Button */}
                <button
                  onClick={() => handleOpenBetModal("COLOR", "VIOLET")}
                  className="group relative bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800 hover:from-purple-400 hover:to-purple-700 text-white font-black py-7 px-3 rounded-3xl shadow-glow-violet border-2 border-purple-400/60 transition-all duration-300 transform hover:-translate-y-1.5 active:scale-95 flex flex-col items-center justify-center gap-2 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-3xl pointer-events-none" />
                  <span className="text-xl sm:text-3xl tracking-wider text-shadow font-black">VIOLET</span>
                  <span className="text-xs font-mono font-bold bg-slate-950/80 px-3.5 py-1 rounded-full border border-purple-400/40 text-purple-300 shadow-inner">
                    4.0x
                  </span>
                  <span className="text-[11px] font-mono text-purple-100/80">(0, 5)</span>
                </button>

                {/* Red Button */}
                <button
                  onClick={() => handleOpenBetModal("COLOR", "RED")}
                  className="group relative bg-gradient-to-b from-red-500 via-red-600 to-red-800 hover:from-red-400 hover:to-red-700 text-white font-black py-7 px-3 rounded-3xl shadow-glow-red border-2 border-red-400/60 transition-all duration-300 transform hover:-translate-y-1.5 active:scale-95 flex flex-col items-center justify-center gap-2 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-3xl pointer-events-none" />
                  <span className="text-xl sm:text-3xl tracking-wider text-shadow font-black">RED</span>
                  <span className="text-xs font-mono font-bold bg-slate-950/80 px-3.5 py-1 rounded-full border border-red-400/40 text-red-300 shadow-inner">
                    2.0x
                  </span>
                  <span className="text-[11px] font-mono text-red-100/80">(2, 4, 6, 8)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3D Single Digit Prediction Grid (0–9) */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border-slate-800/90 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Single Digit Prediction (0-9)
                </h2>
                <p className="text-xs text-slate-400">Match exact winning number for maximum 9.0x payout return</p>
              </div>
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-glow-gold font-mono">
                9.0x Return
              </span>
            </div>

            {/* 3D Casino Chips Grid */}
            <div className="grid grid-cols-5 gap-3 sm:gap-5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                let chipBg = "bg-slate-900 text-white border-slate-700";
                if ([1, 3, 7, 9].includes(num)) {
                  chipBg = "bg-gradient-to-b from-emerald-600 via-emerald-800 to-slate-950 text-white border-emerald-400 shadow-glow-green";
                } else if ([2, 4, 6, 8].includes(num)) {
                  chipBg = "bg-gradient-to-b from-red-600 via-red-800 to-slate-950 text-white border-red-400 shadow-glow-red";
                } else if (num === 0) {
                  chipBg = "bg-gradient-to-tr from-red-700 via-purple-700 to-slate-950 text-purple-200 border-purple-400 shadow-glow-violet";
                } else if (num === 5) {
                  chipBg = "bg-gradient-to-tr from-emerald-700 via-purple-700 to-slate-950 text-emerald-200 border-emerald-400 shadow-glow-violet";
                }

                return (
                  <button
                    key={num}
                    onClick={() => handleOpenBetModal("NUMBER", String(num))}
                    className={`h-20 sm:h-24 rounded-3xl border-2 font-black text-2xl sm:text-4xl flex flex-col items-center justify-center transition-all duration-200 transform hover:-translate-y-1.5 active:scale-95 shadow-2xl relative overflow-hidden ${chipBg}`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-3xl pointer-events-none" />
                    <span className="font-mono text-shadow">{num}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Results Trail Stream */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-4 shadow-2xl border-slate-800/90 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="font-black text-white flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-purple-400" />
                {categoryName} Results Trail
              </h2>
              <button
                onClick={() => fetchRoundData()}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-purple-400 transition"
                title="Refresh history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {recentRounds.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No previous rounds recorded yet.</p>
              ) : (
                recentRounds.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between text-xs font-mono shadow-md hover:border-slate-700 transition"
                  >
                    <span className="text-slate-400 font-bold">#{r.roundNumber}</span>
                    {r.result ? (
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg ${
                            r.result.color === "GREEN"
                              ? "bg-emerald-600 shadow-glow-green"
                              : r.result.color === "RED"
                              ? "bg-red-600 shadow-glow-red"
                              : "bg-purple-600 shadow-glow-violet"
                          }`}
                        >
                          {r.result.number}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase font-sans border ${
                            r.result.color === "GREEN"
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                              : r.result.color === "RED"
                              ? "text-red-400 bg-red-500/10 border-red-500/30"
                              : "text-purple-400 bg-purple-500/10 border-purple-500/30"
                          }`}
                        >
                          {r.result.color}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-400 font-bold animate-pulse text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                        ACTIVE...
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PARTICULAR GAME BET HISTORY SECTION */}
      {user && (
        <div className="glass-panel border-purple-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl bg-slate-900/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                My Bet History ({betHistoryCategoryFilter === "ALL" ? "All Modes" : betHistoryCategoryFilter})
              </h2>
              <p className="text-xs text-slate-400">
                Filter bet history for particular game modes: ⚡ 30s Parity, ⏱️ 1-Min Sapre, or 🏆 3-Min Bcone.
              </p>
            </div>

            {/* Bet History Particular Category Filter Bar */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 text-xs font-bold">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <button
                onClick={() => setBetHistoryCategoryFilter(category)}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  betHistoryCategoryFilter === category ? "bg-purple-600 text-white font-black shadow-glow-violet" : "text-slate-400 hover:text-white"
                }`}
              >
                Current ({category})
              </button>
              <button
                onClick={() => setBetHistoryCategoryFilter("30s")}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  betHistoryCategoryFilter === "30s" ? "bg-amber-600 text-white font-black shadow-glow-gold" : "text-slate-400 hover:text-white"
                }`}
              >
                ⚡ 30s
              </button>
              <button
                onClick={() => setBetHistoryCategoryFilter("1min")}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  betHistoryCategoryFilter === "1min" ? "bg-emerald-600 text-white font-black shadow-glow-green" : "text-slate-400 hover:text-white"
                }`}
              >
                ⏱️ 1min
              </button>
              <button
                onClick={() => setBetHistoryCategoryFilter("3min")}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  betHistoryCategoryFilter === "3min" ? "bg-purple-600 text-white font-black shadow-glow-violet" : "text-slate-400 hover:text-white"
                }`}
              >
                🏆 3min
              </button>
              <button
                onClick={() => setBetHistoryCategoryFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  betHistoryCategoryFilter === "ALL" ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                All Modes
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3">Game Mode</th>
                  <th className="pb-3 px-3">Round #</th>
                  <th className="pb-3 px-3">Selection</th>
                  <th className="pb-3 px-3">Bet Amount</th>
                  <th className="pb-3 px-3">Round Result</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Payout Winnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {userBets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                      No bets recorded for this mode filter yet.
                    </td>
                  </tr>
                ) : (
                  userBets.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-sans ${
                            b.round.category === "30s"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : b.round.category === "1min"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {b.round.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-200">#{b.round.roundNumber}</td>
                      <td className="py-3.5 px-3 font-bold text-purple-300">
                        {b.betType}: {b.selection}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">₹{b.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-3">
                        {b.round.result ? (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                              b.round.result.color === "GREEN"
                                ? "text-emerald-400"
                                : b.round.result.color === "RED"
                                ? "text-red-400"
                                : "text-purple-400"
                            }`}
                          >
                            Num {b.round.result.number} ({b.round.result.color})
                          </span>
                        ) : (
                          <span className="text-amber-400 text-xs font-sans italic">Pending...</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black font-sans ${
                            b.status === "WON"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : b.status === "LOST"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black">
                        {b.status === "WON" ? (
                          <span className="text-emerald-400">+₹{b.payoutAmount.toFixed(2)}</span>
                        ) : b.status === "LOST" ? (
                          <span className="text-slate-500">₹0.00</span>
                        ) : (
                          <span className="text-amber-400">Wait result</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bet Modal */}
      {isBetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Dices className="w-5 h-5 text-purple-400" />
                Place {selectedBetType} Prediction
              </h3>
              <button onClick={() => setIsBetModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Selected Mode:</span>
                <span className="text-amber-300 font-bold uppercase font-mono">{categoryName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Selection:</span>
                <span className="text-emerald-400 font-black font-mono">{selectedSelection}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payout Multiplier:</span>
                <span className="text-purple-400 font-bold font-mono">
                  {selectedBetType === "NUMBER" ? "9.0x" : selectedSelection === "VIOLET" ? "4.0x" : "2.0x"}
                </span>
              </div>
            </div>

            <form onSubmit={handlePlaceBet} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300">Bet Amount (₹)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 50, 100, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className="py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:border-purple-500/50"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={10}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xl font-mono font-black text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {betError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{betError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBetModalOpen(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3.5 rounded-xl transition border border-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={betSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-3.5 rounded-xl shadow-glow-violet transition text-xs uppercase"
                >
                  {betSubmitting ? "Confirming..." : "Confirm Bet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
