"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Headphones, Sparkles, ShieldCheck, User, LogIn, RefreshCw } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "USER" | "ADMIN";
  message: string;
  createdAt: string;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  const fetchChatMessages = async () => {
    try {
      const res = await fetch("/api/support/chat");
      if (res.ok) {
        const data = await res.json();
        const msgList: ChatMessage[] = data.messages || [];
        setMessages(msgList);

        // Count unread admin messages if closed
        if (!isOpen) {
          const unread = msgList.filter((m) => m.sender === "ADMIN").length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchChatMessages();
  }, []);

  // Poll chat messages every 3.5s when widget is active
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChatMessages();
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const msg = textToSend || inputMsg;
    if (!msg.trim()) return;

    if (!user) {
      alert("Please login to start live support chat.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      if (res.ok) {
        setInputMsg("");
        fetchChatMessages();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send message");
      }
    } catch (e: any) {
      alert(e.message || "Chat connection error");
    } finally {
      setSending(false);
    }
  };

  const quickChips = [
    "💳 Deposit UTR Issue",
    "🏦 Withdrawal Status",
    "🕹️ Game Rules & Multipliers",
    "🔒 Account Unblock Request",
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
            fetchChatMessages();
          }}
          className="relative group p-4 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-105 transition transform flex items-center gap-2.5 border border-purple-400/40 shadow-glow-violet"
        >
          <MessageCircle className="w-6 h-6 animate-pulse" />
          <span className="hidden sm:inline font-black text-xs uppercase tracking-wider pr-1">Live VIP Support</span>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center border border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Window Drawer */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[520px] rounded-3xl glass-panel border border-purple-500/40 bg-slate-950/95 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
          {/* Chat Window Header */}
          <div className="p-4 bg-gradient-to-r from-purple-900/80 via-slate-900 to-purple-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-xs tracking-tight flex items-center gap-1">
                  ColorWin 24/7 Live Support
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Online Assistant
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Stream View */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
            {/* Welcome Greeting */}
            <div className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-slate-200 space-y-1 max-w-[85%] shadow-md">
                <p className="font-bold text-[11px] text-purple-300">Welcome to ColorWin VIP Help Desk! 👋</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  How can we assist you today? Feel free to ask about deposits, withdrawals, or account status.
                </p>
              </div>
            </div>

            {/* Render Live Chat History */}
            {messages.map((m) => {
              const isAdmin = m.sender === "ADMIN";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 items-start ${isAdmin ? "justify-start" : "justify-end"}`}
                >
                  {isAdmin && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[82%] space-y-1 shadow-md ${
                      isAdmin
                        ? "bg-slate-900 border border-emerald-500/30 text-slate-200 rounded-tl-none"
                        : "bg-purple-600 text-white rounded-tr-none shadow-glow-violet"
                    }`}
                  >
                    {isAdmin && <span className="text-[9px] font-black text-emerald-400 block uppercase">VIP Support Team</span>}
                    <p className="text-[11px] leading-relaxed font-medium">{m.message}</p>
                    <span className={`text-[9px] block text-right font-mono ${isAdmin ? "text-slate-500" : "text-purple-200"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          {user && (
            <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white hover:border-purple-500/50 transition whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Chat Footer Input Area */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800">
            {!user ? (
              <div className="text-center py-2 space-y-1">
                <p className="text-[11px] text-slate-400 font-medium">Please login to start live support chat</p>
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-black shadow-glow-violet"
                >
                  <LogIn className="w-3.5 h-3.5" /> Login Now
                </Link>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMsg.trim()}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-glow-violet transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
