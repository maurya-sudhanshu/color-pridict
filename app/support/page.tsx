"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, Send, MessageSquare, Mail, PhoneCall, HelpCircle, CheckCircle, Clock, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Sparkles, LogIn } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  createdAt: string;
}

export default function SupportPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Please login to your account to submit a support ticket.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSubmittedMsg(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubject("");
        setMessage("");
        setSubmittedMsg("Support ticket created! Our team will respond shortly.");
        fetchTickets();
      } else {
        setErrorMsg(data.error || "Failed to submit ticket.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error connecting to support server.");
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: "How do I deposit money into my wallet?",
      answer: "Go to the Wallet portal, select Deposit, copy the official UPI ID or scan the QR code. Pay via PhonePe, Paytm, or Google Pay, and submit your 12-digit UTR/TxID number. Your balance will be credited upon admin verification."
    },
    {
      question: "How long do withdrawal payouts take?",
      answer: "Withdrawals are processed within 15–30 minutes directly into your saved bank account upon admin approval."
    },
    {
      question: "What are the color multipliers in the game?",
      answer: "Single Digit Numbers (0–9) pay 9x. Green & Red pay 2x (1.5x on Violet numbers 0 & 5). Violet pays 4x."
    },
    {
      question: "My deposit is pending for more than 30 minutes. What should I do?",
      answer: "Submit a support ticket below with your deposit UTR number or contact our live 24/7 Telegram support team."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="glass-panel border-purple-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mx-auto shadow-glow-violet">
          <Headphones className="w-8 h-8 animate-bounce" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">24/7 Customer Support Desk</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Need help with deposits, withdrawals, or game rules? Our dedicated VIP support team is available 24/7.
        </p>
      </div>

      {/* Direct Contact Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="https://t.me/colorwinsupport"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel border-slate-800 hover:border-purple-500/50 rounded-3xl p-5 space-y-3 text-center transition transform hover:-translate-y-1 shadow-xl group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto group-hover:scale-110 transition">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="font-black text-white text-base">Telegram 24/7 VIP Help</h3>
          <p className="text-xs text-slate-400">Instant response via Telegram</p>
          <span className="inline-block px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold font-mono">@ColorWinSupport</span>
        </a>

        <a
          href="https://wa.me/919876543210"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 space-y-3 text-center transition transform hover:-translate-y-1 shadow-xl group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto group-hover:scale-110 transition">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="font-black text-white text-base">WhatsApp Helpline</h3>
          <p className="text-xs text-slate-400">Direct WhatsApp chat assistant</p>
          <span className="inline-block px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">+91 98765 43210</span>
        </a>

        <div className="glass-panel border-slate-800 rounded-3xl p-5 space-y-3 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-black text-white text-base">Official Email Support</h3>
          <p className="text-xs text-slate-400">Email query responses within 2h</p>
          <span className="inline-block px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 text-xs font-bold font-mono">support@colorwin.com</span>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="glass-panel border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          Frequently Asked Questions (FAQ)
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-800/80 rounded-2xl bg-slate-950/60 overflow-hidden transition">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between hover:text-white"
              >
                <span>{faq.question}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Ticket Submission Form */}
      <div className="glass-panel border-purple-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl bg-slate-900/90">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Submit a Support Ticket
            </h2>
            <p className="text-xs text-slate-400">Describe your issue in detail. Admin responses will appear in your Ticket History below.</p>
          </div>

          {!user && (
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-violet transition"
            >
              <LogIn className="w-4 h-4" /> Login to Submit
            </Link>
          )}
        </div>

        {submittedMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> {submittedMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-black flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" /> {errorMsg}
            </div>
            {!user && (
              <Link href="/auth/login" className="underline font-bold text-purple-300 hover:text-white">
                Login Now
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300">Ticket Subject</label>
            <input
              type="text"
              placeholder="e.g. Deposit UTR Pending / Withdrawal Question"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300">Detailed Message</label>
            <textarea
              rows={4}
              placeholder="Explain your request, UTR number, or account inquiry..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-glow-violet transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {loading ? "Submitting..." : user ? "Submit Support Ticket" : "Login Required to Submit"}
          </button>
        </form>
      </div>

      {/* Submitted Ticket History Feed */}
      <div className="glass-panel border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h2 className="text-lg font-black text-white">Your Submitted Support Tickets</h2>

        <div className="space-y-4">
          {!user ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-slate-400">Log in to view your submitted support tickets and admin replies.</p>
              <Link href="/auth/login" className="inline-block px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-bold text-xs text-purple-300 hover:text-white">
                Log In to View Tickets
              </Link>
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500">No support tickets submitted yet.</p>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">{t.subject}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(t.createdAt).toLocaleString()}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${t.status === "RESOLVED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                    {t.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {t.message}
                </p>

                {t.adminReply ? (
                  <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1">
                    <span className="text-[10px] font-black text-purple-300 uppercase block flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Admin Official Response:
                    </span>
                    <p className="text-xs text-purple-200 font-medium">{t.adminReply}</p>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-400/80 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" /> Awaiting admin reply...
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
