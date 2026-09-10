"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Copy, Check, QrCode, CreditCard, Shield, AlertCircle, History, Sparkles, XCircle } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  wallet?: { balance: number };
}

interface DepositItem {
  id: string;
  amount: number;
  txId: string;
  status: string;
  createdAt: string;
}

interface WithdrawalItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
  };
}

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("deposit");

  // Dynamic Admin Settings State
  const [upiId, setUpiId] = useState("colorwin@upi");
  const [qrUrl, setQrUrl] = useState("");
  const [minDeposit, setMinDeposit] = useState(100);
  const [minWithdrawal, setMinWithdrawal] = useState(200);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [depositTxId, setDepositTxId] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositMessage, setDepositMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(300);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [holderName, setHolderName] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // History State
  const [depositsHistory, setDepositsHistory] = useState<DepositItem[]>([]);
  const [withdrawalsHistory, setWithdrawalsHistory] = useState<WithdrawalItem[]>([]);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setLoadingUser(false);
      } else {
        router.push("/auth/login");
      }
    } catch (e) {
      router.push("/auth/login");
    }
  };

  const fetchPublicSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setUpiId(data.settings.deposit_upi_id || "colorwin@upi");
          setQrUrl(data.settings.deposit_qr_url || "");
          setMinDeposit(Number(data.settings.min_deposit_amount || 100));
          setMinWithdrawal(Number(data.settings.min_withdrawal_amount || 200));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    try {
      const depRes = await fetch("/api/wallet/deposit");
      if (depRes.ok) {
        const depData = await depRes.json();
        setDepositsHistory(depData.deposits || []);
      }

      const withRes = await fetch("/api/wallet/withdraw");
      if (withRes.ok) {
        const withData = await withRes.json();
        setWithdrawalsHistory(withData.withdrawals || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchPublicSettings();
    fetchHistory();
  }, []);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSubmitting(true);
    setDepositMessage(null);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(depositAmount),
          txId: depositTxId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDepositMessage({ text: data.error || "Deposit request failed", type: "error" });
      } else {
        setDepositMessage({
          text: "Deposit request submitted! Admin will verify and credit your wallet shortly.",
          type: "success",
        });
        setDepositTxId("");
        fetchHistory();
      }
    } catch (err: any) {
      setDepositMessage({ text: err.message || "An error occurred", type: "error" });
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSubmitting(true);
    setWithdrawMessage(null);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          bankName,
          accountNumber,
          ifscCode,
          holderName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setWithdrawMessage({ text: data.error || "Withdrawal request failed", type: "error" });
      } else {
        setWithdrawMessage({
          text: "Withdrawal request submitted! Funds held pending admin review.",
          type: "success",
        });
        fetchUserData();
        fetchHistory();
      }
    } catch (err: any) {
      setWithdrawMessage({ text: err.message || "An error occurred", type: "error" });
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    if (!confirm("Are you sure you want to cancel this withdrawal request? The held amount will be automatically refunded to your wallet balance.")) {
      return;
    }

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Withdrawal cancelled and refunded!");
        fetchUserData();
        fetchHistory();
      } else {
        alert(data.error || "Failed to cancel withdrawal");
      }
    } catch (e: any) {
      alert(e.message || "Error cancelling withdrawal");
    }
  };

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-bold">Verifying Wallet Authorization...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* VIP Membership Virtual Card Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 shadow-glow-violet">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> VIP Wallet Membership
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">{user?.email || "Account Wallet"}</h1>
            <p className="text-xs text-slate-400 font-mono">Verified ID: #{user?.id?.slice(0, 12) || "CW-USER"}</p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md space-y-1 text-right">
            <span className="text-xs font-extrabold uppercase text-slate-400 block">Available Balance</span>
            <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400">
              ₹{user?.wallet?.balance?.toFixed(2) || "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Switcher Tabs */}
      <div className="flex border-b border-slate-800 font-black text-xs uppercase tracking-wider text-slate-400">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`pb-3 px-6 border-b-2 transition flex items-center gap-2 ${
            activeTab === "deposit"
              ? "border-emerald-500 text-emerald-400 font-bold"
              : "border-transparent hover:text-white"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          Deposit Funds
        </button>

        <button
          onClick={() => setActiveTab("withdraw")}
          className={`pb-3 px-6 border-b-2 transition flex items-center gap-2 ${
            activeTab === "withdraw"
              ? "border-purple-500 text-purple-400 font-bold"
              : "border-transparent hover:text-white"
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-purple-400" />
          Withdraw Funds
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-6 border-b-2 transition flex items-center gap-2 ${
            activeTab === "history"
              ? "border-amber-500 text-amber-400 font-bold"
              : "border-transparent hover:text-white"
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          Transaction Logs
        </button>
      </div>

      {/* Deposit Tab Portal */}
      {activeTab === "deposit" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UPI Payment Instructions Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                Instant UPI Deposit
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                Min: ₹{minDeposit}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="w-52 h-52 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-4 border-purple-500/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    qrUrl.trim() ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(
                      upiId
                    )}%26pn=ColorWin%26cu=INR`
                  }
                  alt="Official Deposit QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                Scan using PhonePe, Google Pay, Paytm, or BHIM UPI app
              </p>
            </div>

            {/* Official Deposit UPI ID Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Official Deposit UPI ID
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono font-black text-emerald-400 text-base sm:text-lg tracking-wide">
                  {upiId}
                </span>
                <button
                  onClick={handleCopyUpi}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-glow-violet transition"
                >
                  {copiedUpi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedUpi ? "Copied!" : "Copy UPI ID"}
                </button>
              </div>
            </div>
          </div>

          {/* UTR Verification Form */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-slate-800 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Submit UTR Payment Request
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                After completing UPI payment, enter the amount & 12-digit UTR/Tx ID below.
              </p>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300">Deposit Amount (₹)</label>
                <input
                  type="number"
                  min={minDeposit}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xl font-mono font-black text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300">
                  Transaction UTR / Ref Number (12-Digits)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 425310892401"
                  value={depositTxId}
                  onChange={(e) => setDepositTxId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {depositMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    depositMessage.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}
                >
                  {depositMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{depositMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={depositSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-glow-green transition transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {depositSubmitting ? "Submitting Request..." : "Confirm Deposit Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Tab Portal */}
      {activeTab === "withdraw" && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto border-slate-800 shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-purple-400" />
              Bank Payout Withdrawal Request
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Requested amounts are held immediately upon submission. You can cancel pending requests anytime to automatically refund funds to your wallet.
            </p>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-300">Withdrawal Amount (₹)</label>
              <input
                type="number"
                min={minWithdrawal}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xl font-mono font-black text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC / SBI / ICICI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Full name as per bank"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-purple-500 uppercase"
                  required
                />
              </div>
            </div>

            {withdrawMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  withdrawMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}
              >
                {withdrawMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{withdrawMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={withdrawSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-glow-violet transition transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {withdrawSubmitting ? "Submitting Request..." : "Request Bank Withdrawal"}
            </button>
          </form>
        </div>
      )}

      {/* History Tab Portal */}
      {activeTab === "history" && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-slate-800 shadow-2xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Wallet Transaction Logs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deposits Log */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Deposit Records</h3>
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {depositsHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No deposits submitted yet.</p>
                ) : (
                  depositsHistory.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-black text-emerald-400 text-sm">₹{d.amount.toFixed(2)}</span>
                        <div className="text-[11px] text-purple-300 font-mono">UTR: {d.txId}</div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                          d.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : d.status === "REJECTED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Withdrawals Log with Cancel Request Button */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider">Withdrawal Records</h3>
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {withdrawalsHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No withdrawal requests submitted yet.</p>
                ) : (
                  withdrawalsHistory.map((w) => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-black text-purple-400 text-sm">₹{w.amount.toFixed(2)}</span>
                        <div className="text-[11px] text-slate-400">{w.bankAccount?.bankName} ({w.bankAccount?.accountNumber})</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {w.status === "PENDING" && (
                          <button
                            onClick={() => handleCancelWithdrawal(w.id)}
                            className="px-2.5 py-1 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 font-bold text-[10px] flex items-center gap-1 transition"
                            title="Cancel Request & Refund to Wallet"
                          >
                            <XCircle className="w-3 h-3" /> Cancel & Refund
                          </button>
                        )}
                        <span
                          className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                            w.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : w.status === "REJECTED" || w.status === "CANCELLED"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
