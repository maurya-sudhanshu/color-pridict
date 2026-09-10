"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Users, ArrowDownLeft, ArrowUpRight, Play, Check, X, RefreshCw, FileText, Wallet, Sparkles, Sliders, Dices, Award, Zap, Clock, Trophy, Target, Search, TrendingUp, TrendingDown, DollarSign, QrCode, CreditCard, Save, Upload, Image as ImageIcon, UserPlus, Key, Trash2, CheckCircle, Lock, Ban, Unlock, MessageSquare, Headphones, CheckSquare, CornerDownRight, Send, MessageCircle, Monitor, Globe, Radio } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  totalBetsCount: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  netCashflow: number;
  totalBetsAmount: number;
  totalUserPayouts: number;
  houseNetProfit: number;
  profitMargin: number;
  activeRoundNumber: number;
}

interface DepositItem {
  id: string;
  amount: number;
  txId: string;
  status: string;
  createdAt: string;
  user: { id: string; email: string; phone?: string };
}

interface WithdrawalItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: { id: string; email: string; phone?: string };
  bankAccount: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    holderName: string;
  };
}

interface UserItem {
  id: string;
  email: string;
  phone?: string;
  role: string;
  isBlocked?: boolean;
  createdAt: string;
  wallet?: { balance: number };
}

interface SubAdminItem {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  adminPermission?: {
    canCreate: boolean;
    canView: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

interface SupportTicketItem {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  createdAt: string;
  user: { id: string; email: string; phone?: string };
}

interface UserSessionItem {
  id: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  loginAt: string;
  logoutAt?: string;
  user: { id: string; email: string; role: string };
  _count: { bets: number; deposits: number; withdrawals: number };
}

interface AuditLogItem {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  admin: { email: string };
}

interface SimulationRow {
  number: number;
  color: string;
  totalUserPayout: number;
  houseProfit: number;
}

interface ChatConversation {
  user: { id: string; email: string; phone?: string };
  latestMessage: string;
  lastTime: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  sender: "USER" | "ADMIN";
  message: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<"deposits" | "withdrawals" | "users" | "subadmins" | "support" | "sessions" | "logs" | "settings">("deposits");

  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdminItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Live Chat Messenger Admin state
  const [supportSubTab, setSupportSubTab] = useState<"chat" | "tickets">("chat");
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [adminChatInput, setAdminChatInput] = useState("");
  const [sendingAdminChat, setSendingAdminChat] = useState(false);
  const adminChatEndRef = useRef<HTMLDivElement | null>(null);

  // Ticket reply modal state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // Sub-Admin creation modal state
  const [newSubAdminEmail, setNewSubAdminEmail] = useState("");
  const [newSubAdminPassword, setNewSubAdminPassword] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [canView, setCanView] = useState(true);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [creatingSubAdmin, setCreatingSubAdmin] = useState(false);

  // UPI Settings state
  const [upiId, setUpiId] = useState("colorwin@upi");
  const [qrUrl, setQrUrl] = useState("");
  const [minDeposit, setMinDeposit] = useState("100");
  const [minWithdrawal, setMinWithdrawal] = useState("200");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Category & Result Strategy state
  const [adminCategory, setAdminCategory] = useState<"30s" | "1min" | "3min">("3min");
  const [selectedStrategy, setSelectedStrategy] = useState<"FAIR_RNG" | "LOWEST_WINNING_PAYOUT" | "MAX_HOUSE_PROFIT">("LOWEST_WINNING_PAYOUT");
  const [manualOutcomeOverride, setManualOutcomeOverride] = useState<number | null>(null);
  const [simData, setSimData] = useState<{ roundNumber: number; totalBetsAmount: number; simulation: SimulationRow[] } | null>(null);

  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Balance adjustment modal state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustReason, setAdjustReason] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await fetch("/api/admin/deposits");
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubAdmins = async () => {
    try {
      const res = await fetch("/api/admin/subadmins");
      if (res.ok) {
        const data = await res.json();
        setSubAdmins(data.subAdmins || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/admin/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminChatData = async (targetId = activeChatUserId) => {
    try {
      const url = targetId ? `/api/admin/support/chat?targetUserId=${targetId}` : `/api/admin/support/chat`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setChatConversations(data.conversations || []);
        if (targetId) {
          setActiveMessages(data.activeMessages || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setUpiId(data.settings.deposit_upi_id || "colorwin@upi");
          setQrUrl(data.settings.deposit_qr_url || "");
          setMinDeposit(data.settings.min_deposit_amount || "100");
          setMinWithdrawal(data.settings.min_withdrawal_amount || "200");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSimData = async (cat = adminCategory) => {
    try {
      const res = await fetch(`/api/admin/round/advance?category=${cat}`);
      if (res.ok) {
        const data = await res.json();
        setSimData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDeposits();
    fetchWithdrawals();
    fetchUsers();
    fetchSubAdmins();
    fetchTickets();
    fetchSessions();
    fetchAdminChatData();
    fetchLogs();
    fetchSettings();
    fetchSimData(adminCategory);
  }, []);

  useEffect(() => {
    fetchSimData(adminCategory);
  }, [adminCategory]);

  useEffect(() => {
    if (tab === "support" && supportSubTab === "chat") {
      const interval = setInterval(() => {
        fetchAdminChatData(activeChatUserId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [tab, supportSubTab, activeChatUserId]);

  useEffect(() => {
    if (activeMessages.length > 0) {
      adminChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  const handleAdvanceRound = async () => {
    try {
      const res = await fetch("/api/admin/round/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: adminCategory,
          strategy: selectedStrategy,
          forcedNumber: manualOutcomeOverride !== null ? manualOutcomeOverride : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const overrideText = manualOutcomeOverride !== null ? `Forced Number ${manualOutcomeOverride}` : `Strategy ${selectedStrategy}`;
        setActionMsg(`Advanced ${adminCategory} round successfully using ${overrideText}!`);
        setManualOutcomeOverride(null);
        fetchStats();
        fetchSimData(adminCategory);
        fetchLogs();
      } else {
        alert(data.error || "Failed to advance round");
      }
    } catch (e: any) {
      alert(e.message || "Error");
    }
  };

  const handleDepositAction = async (depositId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId, status }),
      });
      if (res.ok) {
        fetchDeposits();
        fetchStats();
        fetchUsers();
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, status }),
      });
      if (res.ok) {
        fetchWithdrawals();
        fetchStats();
        fetchUsers();
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: Number(adjustAmount),
          type: adjustType,
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        setSelectedUser(null);
        setAdjustAmount(100);
        setAdjustReason("");
        fetchUsers();
        fetchStats();
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Adjustment failed");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleBlockUser = async (userId: string, currentIsBlocked: boolean) => {
    const actionName = currentIsBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${actionName} this user account?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          isBlocked: !currentIsBlocked,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(`User account successfully ${currentIsBlocked ? "unblocked" : "blocked"}!`);
        fetchUsers();
        fetchLogs();
      } else {
        alert(data.error || `Failed to ${actionName} user`);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user account?")) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
        fetchStats();
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSendAdminChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUserId || !adminChatInput.trim()) return;

    setSendingAdminChat(true);
    try {
      const res = await fetch("/api/admin/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: activeChatUserId,
          message: adminChatInput,
        }),
      });

      if (res.ok) {
        setAdminChatInput("");
        fetchAdminChatData(activeChatUserId);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send live reply");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSendingAdminChat(false);
    }
  };

  const handleReplyTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setReplying(true);

    try {
      const res = await fetch("/api/admin/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          adminReply: adminReplyText,
          status: "RESOLVED",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(null);
        setAdminReplyText("");
        fetchTickets();
        fetchLogs();
        setActionMsg("Support ticket response saved and marked as RESOLVED!");
      } else {
        alert(data.error || "Failed to submit reply");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReplying(false);
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSubAdmin(true);
    try {
      const res = await fetch("/api/admin/subadmins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newSubAdminEmail,
          password: newSubAdminPassword,
          canCreate,
          canView,
          canUpdate,
          canDelete,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewSubAdminEmail("");
        setNewSubAdminPassword("");
        setCanCreate(false);
        setCanView(true);
        setCanUpdate(false);
        setCanDelete(false);
        fetchSubAdmins();
        fetchLogs();
        setActionMsg(`Sub-Admin ${data.subAdmin.email} created successfully!`);
      } else {
        alert(data.error || "Failed to create sub-admin");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreatingSubAdmin(false);
    }
  };

  const handleUpdateSubAdminPermission = async (subAdminId: string, perm: { canCreate: boolean; canView: boolean; canUpdate: boolean; canDelete: boolean }) => {
    try {
      const res = await fetch("/api/admin/subadmins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subAdminId,
          ...perm,
        }),
      });
      if (res.ok) {
        fetchSubAdmins();
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update sub-admin permissions");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteSubAdmin = async (subAdminId: string) => {
    if (!confirm("Are you sure you want to delete this sub-admin account?")) return;
    try {
      const res = await fetch(`/api/admin/subadmins?subAdminId=${subAdminId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubAdmins();
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete sub-admin");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit_upi_id: upiId,
          deposit_qr_url: qrUrl,
          min_deposit_amount: minDeposit,
          min_withdrawal_amount: minWithdrawal,
        }),
      });
      if (res.ok) {
        setActionMsg("Deposit UPI & QR Settings saved successfully!");
        fetchSettings();
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save settings");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setQrUrl(data.url);
        setActionMsg("QR Code image uploaded successfully! Click Save Settings below to apply.");
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err: any) {
      alert(err.message || "File upload error");
    } finally {
      setUploadingQr(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearchQuery))
  );

  const houseProfit = stats?.houseNetProfit ?? 0;
  const netCashflow = stats?.netCashflow ?? 0;
  const profitMargin = stats?.profitMargin ?? 0;
  const totalBetsAmount = stats?.totalBetsAmount ?? 0;
  const totalDepositAmount = stats?.totalDepositAmount ?? 0;
  const totalWithdrawalAmount = stats?.totalWithdrawalAmount ?? 0;
  const pendingDeposits = stats?.pendingDepositsCount ?? 0;
  const pendingWithdrawals = stats?.pendingWithdrawalsCount ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const totalBetsCount = stats?.totalBetsCount ?? 0;
  const pendingTicketsCount = tickets.filter((t) => t.status === "OPEN").length;
  const totalUnreadChatCount = chatConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const activeChatUser = users.find((u) => u.id === activeChatUserId);

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="glass-panel border-purple-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-glow-violet">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Executive Command Center</h1>
            <p className="text-xs text-slate-400">P&L metrics, session-wise activity tracking, live support chat & RBAC</p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchStats();
            fetchDeposits();
            fetchWithdrawals();
            fetchUsers();
            fetchSubAdmins();
            fetchTickets();
            fetchSessions();
            fetchAdminChatData(activeChatUserId);
            fetchLogs();
            fetchSettings();
            fetchSimData(adminCategory);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh All Data
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-between shadow-glow-green">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Financial P&L Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel border-slate-800/80 rounded-3xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>NET HOUSE PROFIT</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${houseProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {houseProfit >= 0 ? "+" : ""}₹{houseProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-bold">
            Margin: {profitMargin.toFixed(1)}% | Bets: ₹{totalBetsAmount.toFixed(0)}
          </div>
        </div>

        <div className="glass-panel border-slate-800/80 rounded-3xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>NET CASHFLOW</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${netCashflow >= 0 ? "text-purple-300" : "text-amber-400"}`}>
            {netCashflow >= 0 ? "+" : ""}₹{netCashflow.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-bold">
            In: ₹{totalDepositAmount.toFixed(0)} | Out: ₹{totalWithdrawalAmount.toFixed(0)}
          </div>
        </div>

        <div className="glass-panel border-slate-800/80 rounded-3xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>PENDING QUEUE</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
            {pendingDeposits + pendingWithdrawals}
          </div>
          <div className="text-[10px] text-slate-500 font-bold">
            {pendingDeposits} Deposits | {pendingWithdrawals} Withdrawals
          </div>
        </div>

        <div className="glass-panel border-slate-800/80 rounded-3xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>TOTAL PLAYERS</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {totalUsers}
          </div>
          <div className="text-[10px] text-slate-500 font-bold">
            Total Bets Placed: {totalBetsCount}
          </div>
        </div>
      </div>

      {/* Manual Round Control & Outcome Override Engine */}
      <div className="glass-panel border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl bg-slate-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Dices className="w-5 h-5 text-purple-400" />
              Manual Outcome Control & Risk Simulator
            </h2>
            <p className="text-xs text-slate-400">Override next round outcome number or let strategy select lowest house payout</p>
          </div>

          {/* Speed Mode Selector for Admin */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setAdminCategory("30s")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                adminCategory === "30s" ? "bg-amber-600 text-white font-black shadow-glow-gold" : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ 30s Parity
            </button>
            <button
              onClick={() => setAdminCategory("1min")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                adminCategory === "1min" ? "bg-emerald-600 text-white font-black shadow-glow-green" : "text-slate-400 hover:text-white"
              }`}
            >
              ⏱️ 1-Min Sapre
            </button>
            <button
              onClick={() => setAdminCategory("3min")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                adminCategory === "3min" ? "bg-purple-600 text-white font-black shadow-glow-violet" : "text-slate-400 hover:text-white"
              }`}
            >
              🏆 3-Min Bcone
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy & Override Selector Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-300">RNG Strategy</label>
              <select
                value={selectedStrategy}
                onChange={(e: any) => setSelectedStrategy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                <option value="LOWEST_WINNING_PAYOUT">🛡️ Lowest Winning Payout (Recommended)</option>
                <option value="MAX_HOUSE_PROFIT">💰 Maximize House Profit</option>
                <option value="FAIR_RNG">🎲 100% Pure Fair RNG</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-300 block">
                Forced Winning Number Override (0 - 9)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => setManualOutcomeOverride(manualOutcomeOverride === num ? null : num)}
                    className={`py-2 rounded-xl border font-black font-mono text-sm transition ${
                      manualOutcomeOverride === num
                        ? "bg-purple-600 text-white border-purple-400 shadow-glow-violet"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {manualOutcomeOverride !== null && (
                <p className="text-[11px] text-amber-400 font-bold">
                  ⚠️ Forced Number: {manualOutcomeOverride}. Click again to unselect.
                </p>
              )}
            </div>

            <button
              onClick={handleAdvanceRound}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-glow-violet transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Force Advance & Settle {adminCategory} Round
            </button>
          </div>

          {/* Active Round Payout Simulation Table */}
          <div className="lg:col-span-2 space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-white">Active Round Payout Risk Matrix ({adminCategory})</span>
              <span className="font-mono text-purple-300 font-bold">
                Pool Total: ₹{simData?.totalBetsAmount?.toFixed(2) || "0.00"}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[190px]">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-2">Outcome</th>
                    <th className="pb-2">Color</th>
                    <th className="pb-2">User Payout</th>
                    <th className="pb-2 text-right">House Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {simData?.simulation?.map((s) => (
                    <tr key={s.number} className={manualOutcomeOverride === s.number ? "bg-purple-900/40" : ""}>
                      <td className="py-1.5 font-bold text-white">Number {s.number}</td>
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.color === "GREEN" ? "text-emerald-400" : s.color === "RED" ? "text-red-400" : "text-purple-400"}`}>
                          {s.color}
                        </span>
                      </td>
                      <td className="py-1.5 text-slate-300">₹{s.totalUserPayout.toFixed(2)}</td>
                      <td className={`py-1.5 text-right font-bold ${s.houseProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {s.houseProfit >= 0 ? "+" : ""}₹{s.houseProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setTab("deposits")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            tab === "deposits" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          💳 Deposit Requests ({deposits.filter((d) => d.status === "PENDING").length})
        </button>

        <button
          onClick={() => setTab("withdrawals")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            tab === "withdrawals" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          🏦 Withdrawal Requests ({withdrawals.filter((w) => w.status === "PENDING").length})
        </button>

        <button
          onClick={() => setTab("users")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            tab === "users" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          👥 User Directory ({users.length})
        </button>

        <button
          onClick={() => setTab("subadmins")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            tab === "subadmins" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          🛡️ Sub-Admin RBAC ({subAdmins.length})
        </button>

        <button
          onClick={() => setTab("sessions")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            tab === "sessions" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          📡 User Sessions ({sessions.filter((s) => s.isActive).length} Active)
        </button>

        <button
          onClick={() => setTab("support")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition relative ${
            tab === "support" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          💬 Support & Live Chat ({pendingTicketsCount + totalUnreadChatCount})
          {totalUnreadChatCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] font-black animate-pulse">
              +{totalUnreadChatCount} Chat
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("logs")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            tab === "logs" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          📜 Audit Trail ({logs.length})
        </button>

        <button
          onClick={() => setTab("settings")}
          className={`py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            tab === "settings" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "bg-slate-950 text-slate-400 hover:text-white"
          }`}
        >
          ⚙️ Payment UPI & QR Settings
        </button>
      </div>

      {/* TAB 1: DEPOSITS */}
      {tab === "deposits" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-black text-white">Deposit Requests Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">User Email</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Tx ID / UTR</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {deposits.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-slate-500">No deposit requests recorded yet.</td></tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-3 text-slate-400 text-xs">{new Date(d.createdAt).toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-white font-sans">{d.user?.email}</td>
                      <td className="py-3.5 px-3 text-emerald-400 font-bold">₹{d.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-3 text-purple-300 font-bold">{d.txId}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black font-sans ${d.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : d.status === "REJECTED" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-sans">
                        {d.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleDepositAction(d.id, "APPROVED")} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-green">
                              Approve
                            </button>
                            <button onClick={() => handleDepositAction(d.id, "REJECTED")} className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red">
                              Reject
                            </button>
                          </div>
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

      {/* TAB 2: WITHDRAWALS */}
      {tab === "withdrawals" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-black text-white">Withdrawal Requests Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">User Email</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Bank Details</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-slate-500">No withdrawal requests recorded yet.</td></tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-3 text-slate-400 text-xs">{new Date(w.createdAt).toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-white font-sans">{w.user?.email}</td>
                      <td className="py-3.5 px-3 text-amber-400 font-bold">₹{w.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-3 font-sans text-xs">
                        <div className="font-bold text-slate-200">{w.bankAccount?.bankName} ({w.bankAccount?.holderName})</div>
                        <div className="text-slate-400 font-mono text-[11px]">Acc: {w.bankAccount?.accountNumber} | IFSC: {w.bankAccount?.ifscCode}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black font-sans ${w.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : w.status === "REJECTED" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-sans">
                        {w.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleWithdrawalAction(w.id, "APPROVED")} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-green">
                              Approve Payout
                            </button>
                            <button onClick={() => handleWithdrawalAction(w.id, "REJECTED")} className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red">
                              Reject & Refund
                            </button>
                          </div>
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

      {/* TAB 3: USERS DIRECTORY WITH BLOCK / UNBLOCK CONTROLS */}
      {tab === "users" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-black text-white">Registered Players Directory</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Account Status</th>
                  <th className="pb-3 px-3">Joined Date</th>
                  <th className="pb-3 px-3">Wallet Balance</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 text-white font-sans">{u.email}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === "ADMIN" || u.role === "SUPER_ADMIN" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : u.role === "SUB_ADMIN" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-slate-800 text-slate-300"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black font-sans flex items-center gap-1 w-max ${u.isBlocked ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                        {u.isBlocked ? <Ban className="w-3 h-3 text-red-400" /> : <CheckCircle className="w-3 h-3 text-emerald-400" />}
                        {u.isBlocked ? "BLOCKED" : "ACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400">₹{u.wallet?.balance?.toFixed(2) || "0.00"}</td>
                    <td className="py-3.5 px-3 text-right font-sans space-x-2">
                      <button onClick={() => setSelectedUser(u)} className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-glow-violet">
                        Adjust Balance
                      </button>

                      {u.role !== "ADMIN" && u.role !== "SUPER_ADMIN" && (
                        <>
                          <button
                            onClick={() => handleToggleBlockUser(u.id, !!u.isBlocked)}
                            className={`px-3 py-1 rounded-xl font-bold text-xs transition ${u.isBlocked ? "bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200" : "bg-amber-600/30 hover:bg-amber-600 text-amber-200"}`}
                          >
                            {u.isBlocked ? "Unblock User" : "Block User"}
                          </button>

                          <button onClick={() => handleDeleteUser(u.id)} className="px-2.5 py-1 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-200 font-bold text-xs transition">
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUB-ADMIN MANAGEMENT & RBAC PERMISSIONS */}
      {tab === "subadmins" && (
        <div className="space-y-6">
          {/* Create Sub-Admin Card */}
          <div className="glass-panel border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl bg-slate-900/90">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Create New Sub-Admin & Assign RBAC Permissions
              </h2>
              <p className="text-xs text-slate-400">Specify login credentials and check exact permissions (Create, View, Update, Delete)</p>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-300">Sub-Admin Email</label>
                  <input
                    type="email"
                    placeholder="subadmin@colorwin.com"
                    value={newSubAdminEmail}
                    onChange={(e) => setNewSubAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-300">Account Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newSubAdminPassword}
                    onChange={(e) => setNewSubAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* RBAC Granular Permissions Checkboxes */}
              <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                  Assign Fine-Grained Action Permissions:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/50">
                    <input
                      type="checkbox"
                      checked={canView}
                      onChange={(e) => setCanView(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">VIEW Access</span>
                      <span className="text-[10px] text-slate-400">View users, queues, stats</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/50">
                    <input
                      type="checkbox"
                      checked={canCreate}
                      onChange={(e) => setCanCreate(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">CREATE Access</span>
                      <span className="text-[10px] text-slate-400">Add data, advance rounds</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/50">
                    <input
                      type="checkbox"
                      checked={canUpdate}
                      onChange={(e) => setCanUpdate(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">UPDATE Access</span>
                      <span className="text-[10px] text-slate-400">Approve/reject deposits, edit</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/50">
                    <input
                      type="checkbox"
                      checked={canDelete}
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">DELETE Access</span>
                      <span className="text-[10px] text-slate-400">Delete users & sub-admins</span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingSubAdmin}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-glow-violet transition transform hover:scale-[1.02]"
              >
                {creatingSubAdmin ? "Creating..." : "Create Sub-Admin Account"}
              </button>
            </form>
          </div>

          {/* Sub-Admin Directory & Permissions Table */}
          <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white">Active Sub-Admin Roster & Live RBAC Toggles</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3 px-3">Sub-Admin Email</th>
                    <th className="pb-3 px-3">VIEW</th>
                    <th className="pb-3 px-3">CREATE</th>
                    <th className="pb-3 px-3">UPDATE</th>
                    <th className="pb-3 px-3">DELETE</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {subAdmins.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-500">No sub-admin accounts created yet.</td></tr>
                  ) : (
                    subAdmins.map((sa) => {
                      const p = sa.adminPermission || { canCreate: false, canView: true, canUpdate: false, canDelete: false };
                      return (
                        <tr key={sa.id} className="hover:bg-slate-800/40">
                          <td className="py-3.5 px-3 text-white font-sans font-bold">{sa.email}</td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleUpdateSubAdminPermission(sa.id, { ...p, canView: !p.canView })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-sans ${p.canView ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}
                            >
                              {p.canView ? "YES" : "NO"}
                            </button>
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleUpdateSubAdminPermission(sa.id, { ...p, canCreate: !p.canCreate })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-sans ${p.canCreate ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}
                            >
                              {p.canCreate ? "YES" : "NO"}
                            </button>
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleUpdateSubAdminPermission(sa.id, { ...p, canUpdate: !p.canUpdate })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-sans ${p.canUpdate ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}
                            >
                              {p.canUpdate ? "YES" : "NO"}
                            </button>
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleUpdateSubAdminPermission(sa.id, { ...p, canDelete: !p.canDelete })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-sans ${p.canDelete ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}
                            >
                              {p.canDelete ? "YES" : "NO"}
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-right font-sans">
                            <button
                              onClick={() => handleDeleteSubAdmin(sa.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red"
                            >
                              Delete Sub-Admin
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SESSION-WISE ACTIVITY TRACKER */}
      {tab === "sessions" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400" />
                Session-Wise User Activity Log
              </h2>
              <p className="text-xs text-slate-400">All bets, transactions, and deposits tagged to specific user login sessions</p>
            </div>

            <button
              onClick={fetchSessions}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Sessions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3">Session Start</th>
                  <th className="pb-3 px-3">User Email</th>
                  <th className="pb-3 px-3">IP & Device</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Session Activity</th>
                  <th className="pb-3 px-3 text-right">Logout Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sessions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-slate-500">No sessions recorded yet.</td></tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-3 text-slate-300 text-xs font-sans font-bold">
                        {new Date(s.loginAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-purple-300 font-sans font-bold">{s.user?.email}</td>
                      <td className="py-3.5 px-3 text-slate-400 text-xs font-sans">
                        <div className="font-mono text-slate-200">{s.ipAddress || "127.0.0.1"}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{s.userAgent}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black font-sans ${s.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}>
                          {s.isActive ? "🟢 ACTIVE" : "⚪ LOGGED OUT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-sans text-xs">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/30 mr-1.5">
                          {s._count.bets} Bets
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 mr-1.5">
                          {s._count.deposits} In
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                          {s._count.withdrawals} Out
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400 text-xs font-sans">
                        {s.logoutAt ? new Date(s.logoutAt).toLocaleTimeString() : s.isActive ? "Online Now" : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SUPPORT TICKETS & LIVE CHAT MESSENGER */}
      {tab === "support" && (
        <div className="space-y-6">
          {/* Sub Tab Switcher */}
          <div className="flex gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-max">
            <button
              onClick={() => setSupportSubTab("chat")}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                supportSubTab === "chat" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Live Chat Messenger ({chatConversations.length})
              {totalUnreadChatCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-black animate-bounce">
                  {totalUnreadChatCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSupportSubTab("tickets")}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                supportSubTab === "tickets" ? "bg-purple-600 text-white shadow-glow-violet font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-300" />
              Formal Tickets ({tickets.length})
            </button>
          </div>

          {/* LIVE CHAT MESSENGER VIEW */}
          {supportSubTab === "chat" && (
            <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-6 shadow-xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                Live Customer Support Chat Messenger
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[480px]">
                {/* Active Chat Conversations List */}
                <div className="md:col-span-1 border border-slate-800 rounded-2xl bg-slate-950 overflow-y-auto divide-y divide-slate-900">
                  {chatConversations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No active live chat conversations.</div>
                  ) : (
                    chatConversations.map((c) => {
                      const isSelected = activeChatUserId === c.user?.id;
                      return (
                        <button
                          key={c.user?.id}
                          onClick={() => {
                            setActiveChatUserId(c.user?.id);
                            fetchAdminChatData(c.user?.id);
                          }}
                          className={`w-full p-3.5 text-left transition flex items-start justify-between ${
                            isSelected ? "bg-purple-900/40 border-l-4 border-purple-500" : "hover:bg-slate-900/60"
                          }`}
                        >
                          <div className="space-y-1 overflow-hidden">
                            <span className="font-bold text-xs text-white block truncate">{c.user?.email}</span>
                            <p className="text-[11px] text-slate-400 truncate">{c.latestMessage}</p>
                            <span className="text-[9px] text-slate-500 font-mono block">
                              {new Date(c.lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {c.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-black">
                              {c.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Active Chat Message Thread */}
                <div className="md:col-span-2 border border-slate-800 rounded-2xl bg-slate-950 flex flex-col overflow-hidden">
                  {!activeChatUserId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                      <MessageCircle className="w-10 h-10 text-slate-700" />
                      <p>Select a user conversation from the left to start live chatting.</p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-white block">
                            Chatting with: {activeChatUser?.email || activeChatUserId}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">● Active 1-on-1 Session</span>
                        </div>
                        <button
                          onClick={() => fetchAdminChatData(activeChatUserId)}
                          className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                      </div>

                      {/* Chat Message Stream */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                        {activeMessages.map((m) => {
                          const isAdminSender = m.sender === "ADMIN";
                          return (
                            <div
                              key={m.id}
                              className={`flex ${isAdminSender ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`p-3 rounded-2xl max-w-[80%] space-y-1 font-sans ${
                                  isAdminSender
                                    ? "bg-purple-600 text-white rounded-tr-none shadow-glow-violet"
                                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                                }`}
                              >
                                <span className={`text-[9px] font-black block uppercase ${isAdminSender ? "text-purple-200" : "text-amber-400"}`}>
                                  {isAdminSender ? "Admin Reply" : "User Message"}
                                </span>
                                <p className="text-[11px] leading-relaxed font-medium">{m.message}</p>
                                <span className={`text-[9px] block text-right font-mono ${isAdminSender ? "text-purple-200" : "text-slate-500"}`}>
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={adminChatEndRef} />
                      </div>

                      {/* Admin Message Input */}
                      <form onSubmit={handleSendAdminChatReply} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                        <input
                          type="text"
                          placeholder="Type live reply to user..."
                          value={adminChatInput}
                          onChange={(e) => setAdminChatInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="submit"
                          disabled={sendingAdminChat || !adminChatInput.trim()}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-glow-violet transition flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FORMAL TICKETS VIEW */}
          {supportSubTab === "tickets" && (
            <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                User Support Ticket Queue
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="pb-3 px-3">Submitted</th>
                      <th className="pb-3 px-3">User</th>
                      <th className="pb-3 px-3">Subject</th>
                      <th className="pb-3 px-3">Message</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {tickets.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-500">No support tickets submitted.</td></tr>
                    ) : (
                      tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/40">
                          <td className="py-3.5 px-3 text-slate-400 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                          <td className="py-3.5 px-3 text-white font-sans font-bold">{t.user?.email}</td>
                          <td className="py-3.5 px-3 text-purple-300 font-sans font-bold">{t.subject}</td>
                          <td className="py-3.5 px-3 text-slate-300 font-sans text-xs max-w-xs truncate">{t.message}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black font-sans ${t.status === "RESOLVED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-sans">
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setAdminReplyText(t.adminReply || "");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-glow-violet"
                            >
                              {t.adminReply ? "Edit Reply" : "Reply Ticket"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {tab === "logs" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-black text-white">System Security Audit Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 px-3">Admin Account</th>
                  <th className="pb-3 px-3">Action Performed</th>
                  <th className="pb-3 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 text-slate-400 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-purple-300 font-sans">{l.admin?.email}</td>
                    <td className="py-3.5 px-3 font-bold text-amber-300">{l.action}</td>
                    <td className="py-3.5 px-3 text-slate-300 text-xs font-sans">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: PAYMENT UPI & QR SETTINGS */}
      {tab === "settings" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl max-w-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-400" />
              Deposit Payment Portal Settings
            </h2>
            <p className="text-xs text-slate-400">Configure UPI ID and upload custom QR Code image shown to users on deposit portal</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-300">Deposit UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-300 block">Deposit QR Code Image</label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingQr}
                  className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Upload className="w-4 h-4 text-purple-400" />
                  {uploadingQr ? "Uploading..." : "Upload QR Image File"}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />

                <span className="text-xs text-slate-400">Or paste image URL below:</span>
              </div>

              <input
                type="text"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="e.g. /uploads/qr-code.png"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500"
              />

              {qrUrl && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 inline-block">
                  <span className="text-[10px] text-slate-400 block mb-2 font-bold">QR Image Preview:</span>
                  <img src={qrUrl} alt="Deposit QR Code" className="w-32 h-32 object-contain rounded-xl border border-slate-700" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-glow-violet transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Deposit Settings
            </button>
          </form>
        </div>
      )}

      {/* Reply Support Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Reply to Support Ticket
              </h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">User: <strong className="text-white">{selectedTicket.user?.email}</strong></span>
                <span className="text-purple-300 font-mono text-[10px]">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>
              <div className="font-bold text-white text-sm">{selectedTicket.subject}</div>
              <p className="text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                {selectedTicket.message}
              </p>
            </div>

            <form onSubmit={handleReplyTicketSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300">Admin Official Reply</label>
                <textarea
                  rows={4}
                  placeholder="Enter response message to be sent to user..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3.5 rounded-xl border border-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replying}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-3.5 rounded-xl shadow-glow-violet text-xs uppercase"
                >
                  {replying ? "Saving..." : "Send Reply & Resolve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust User Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                Adjust User Balance
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400">Target User: </span>
              <span className="text-white font-bold">{selectedUser.email}</span>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("CREDIT")}
                    className={`py-2 rounded-xl font-bold text-xs border transition ${adjustType === "CREDIT" ? "bg-emerald-600 text-white border-emerald-400 shadow-glow-green" : "bg-slate-950 text-slate-400 border-slate-800"}`}
                  >
                    + Credit Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEBIT")}
                    className={`py-2 rounded-xl font-bold text-xs border transition ${adjustType === "DEBIT" ? "bg-red-600 text-white border-red-400 shadow-glow-red" : "bg-slate-950 text-slate-400 border-slate-800"}`}
                  >
                    - Debit Balance
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300">Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300">Reason / Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. Manual promotion credit"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3.5 rounded-xl border border-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-3.5 rounded-xl shadow-glow-violet text-xs uppercase"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
