"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Users, ArrowDownLeft, ArrowUpRight, Play, Check, X, RefreshCw, FileText, Wallet, Sparkles, Sliders, Dices, Award, Zap, Clock, Trophy, Target, Search, TrendingUp, TrendingDown, DollarSign, QrCode, CreditCard, Save, Upload, Image as ImageIcon, UserPlus, Key, Trash2, CheckCircle, Lock, Ban, Unlock, MessageSquare, Headphones, CheckSquare, CornerDownRight, Send, MessageCircle, Monitor, Globe, Radio } from "lucide-react";
import AdminDashboardFrame, { AdminSection } from "@/components/AdminDashboardFrame";

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
  activeSessionsCount: number;
  todayDepositAmount: number;
  todayWithdrawalAmount: number;
  todayHouseNetProfit: number;
  roundsSettledToday: number;
  recentActivity: AuditLogItem[];
  depositTrend: { date: string; amount: number }[];
  withdrawalTrend: { date: string; amount: number }[];
}

type ToastState = { message: string; tone: "success" | "error" };

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
  const [tab, setTab] = useState<AdminSection>("dashboard");

  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdminItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "email">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingData, setLoadingData] = useState(true);

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

  const showToast = (message: string, tone: ToastState["tone"] = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4500);
  };

  const requestConfirmation = (message: string) =>
    new Promise<boolean>((resolve) => {
      confirmationResolver.current = resolve;
      setConfirmMessage(message);
    });

  const resolveConfirmation = (confirmed: boolean) => {
    confirmationResolver.current?.(confirmed);
    confirmationResolver.current = null;
    setConfirmMessage(null);
  };

  // Category & Result Strategy state
  const [adminCategory, setAdminCategory] = useState<"30s" | "1min" | "3min">("3min");
  const [selectedStrategy, setSelectedStrategy] = useState<"FAIR_RNG" | "LOWEST_WINNING_PAYOUT" | "MAX_HOUSE_PROFIT">("LOWEST_WINNING_PAYOUT");
  const [manualOutcomeOverride, setManualOutcomeOverride] = useState<number | null>(null);
  const [simData, setSimData] = useState<{ roundNumber: number; totalBetsAmount: number; simulation: SimulationRow[] } | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const confirmationResolver = useRef<((confirmed: boolean) => void) | null>(null);

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
    Promise.all([
      fetchStats(),
      fetchDeposits(),
      fetchWithdrawals(),
      fetchUsers(),
      fetchSubAdmins(),
      fetchTickets(),
      fetchSessions(),
      fetchAdminChatData(),
      fetchLogs(),
      fetchSettings(),
      fetchSimData(adminCategory),
    ]).finally(() => setLoadingData(false));
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
    if (!(await requestConfirmation(`Force advance and settle the active ${adminCategory} round${manualOutcomeOverride !== null ? ` with number ${manualOutcomeOverride}` : ""}?`))) return;
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
        showToast(`Advanced ${adminCategory} round successfully using ${overrideText}.`);
        setManualOutcomeOverride(null);
        fetchStats();
        fetchSimData(adminCategory);
        fetchLogs();
      } else {
        showToast(data.error || "Failed to advance round", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Error advancing round", "error");
    }
  };

  const handleDepositAction = async (depositId: string, status: "APPROVED" | "REJECTED") => {
    if (!(await requestConfirmation(`Confirm ${status.toLowerCase()} for deposit ${depositId}?`))) return;
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
        showToast(`Deposit ${status.toLowerCase()} successfully.`);
      } else {
        const data = await res.json();
        showToast(data.error || "Deposit action failed", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Deposit action failed", "error");
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, status: "APPROVED" | "REJECTED") => {
    const consequence = status === "REJECTED" ? " The held funds will be refunded to the user's wallet." : "";
    if (!(await requestConfirmation(`Confirm ${status.toLowerCase()} for withdrawal ${withdrawalId}?${consequence}`))) return;
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
        showToast(`Withdrawal ${status.toLowerCase()} successfully.`);
      } else {
        const data = await res.json();
        showToast(data.error || "Withdrawal action failed", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Withdrawal action failed", "error");
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
        showToast("User balance adjusted successfully.");
      } else {
        const data = await res.json();
        showToast(data.error || "Balance adjustment failed", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Balance adjustment failed", "error");
    }
  };

  const handleToggleBlockUser = async (userId: string, currentIsBlocked: boolean) => {
    const actionName = currentIsBlocked ? "unblock" : "block";
    if (!(await requestConfirmation(`Are you sure you want to ${actionName} this user account?`))) return;

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
        showToast(`User account successfully ${currentIsBlocked ? "unblocked" : "blocked"}.`);
        fetchUsers();
        fetchLogs();
      } else {
        showToast(data.error || `Failed to ${actionName} user`, "error");
      }
    } catch (e: any) {
      showToast(e.message || `Failed to ${actionName} user`, "error");
    }
  };

  const handleUpdateUserRole = async (user: UserItem) => {
    const nextRole = user.role === "USER" ? "ADMIN" : "USER";
    if (!(await requestConfirmation(`${nextRole === "ADMIN" ? "Promote" : "Demote"} ${user.email} ${nextRole === "ADMIN" ? "to administrator" : "to a regular user"}?`))) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update user role", "error");
        return;
      }
      fetchUsers();
      fetchStats();
      fetchLogs();
      showToast(`${user.email} is now ${nextRole === "ADMIN" ? "an administrator" : "a regular user"}.`);
    } catch (error: any) {
      showToast(error.message || "Failed to update user role", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!(await requestConfirmation("Are you sure you want to delete this user account? This action cannot be undone."))) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
        fetchStats();
        fetchLogs();
        showToast("User account deleted.");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete user", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to delete user", "error");
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
        showToast("Support reply sent.");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to send live reply", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to send live reply", "error");
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
        showToast("Support ticket response saved and marked as resolved.");
      } else {
        showToast(data.error || "Failed to submit reply", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to submit reply", "error");
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
        showToast(`Sub-Admin ${data.subAdmin.email} created successfully.`);
      } else {
        showToast(data.error || "Failed to create sub-admin", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to create sub-admin", "error");
    } finally {
      setCreatingSubAdmin(false);
    }
  };

  const handleUpdateSubAdminPermission = async (subAdminId: string, perm: { canCreate: boolean; canView: boolean; canUpdate: boolean; canDelete: boolean }) => {
    if (!(await requestConfirmation(`Save updated permissions for sub-admin ${subAdminId}?`))) return;
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
        showToast("Sub-admin permissions updated.");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update sub-admin permissions", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to update sub-admin permissions", "error");
    }
  };

  const handleDeleteSubAdmin = async (subAdminId: string) => {
    if (!(await requestConfirmation("Are you sure you want to delete this sub-admin account? This action cannot be undone."))) return;
    try {
      const res = await fetch(`/api/admin/subadmins?subAdminId=${subAdminId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubAdmins();
        fetchLogs();
        showToast("Sub-admin account deleted.");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete sub-admin", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to delete sub-admin", "error");
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
        showToast("Deposit UPI and QR settings saved.");
        fetchSettings();
        fetchLogs();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to save settings", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to save settings", "error");
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
        showToast("QR image uploaded. Save settings to apply it.");
      } else {
        showToast(data.error || "Upload failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "File upload error", "error");
    } finally {
      setUploadingQr(false);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const directionMultiplier = sortDirection === "asc" ? 1 : -1;
  const filteredDeposits = deposits
    .filter((deposit) =>
      (statusFilter === "ALL" || deposit.status === statusFilter) &&
      (!normalizedSearch ||
        deposit.user.email.toLowerCase().includes(normalizedSearch) ||
        deposit.txId.toLowerCase().includes(normalizedSearch))
    )
    .sort((left, right) => {
      if (sortBy === "amount") return (left.amount - right.amount) * directionMultiplier;
      if (sortBy === "email") return left.user.email.localeCompare(right.user.email) * directionMultiplier;
      return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * directionMultiplier;
    });
  const filteredWithdrawals = withdrawals
    .filter((withdrawal) =>
      (statusFilter === "ALL" || withdrawal.status === statusFilter) &&
      (!normalizedSearch ||
        withdrawal.user.email.toLowerCase().includes(normalizedSearch) ||
        withdrawal.bankAccount.accountNumber.toLowerCase().includes(normalizedSearch))
    )
    .sort((left, right) => {
      if (sortBy === "amount") return (left.amount - right.amount) * directionMultiplier;
      if (sortBy === "email") return left.user.email.localeCompare(right.user.email) * directionMultiplier;
      return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * directionMultiplier;
    });
  const filteredUsers = users
    .filter((user) =>
      !normalizedSearch ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      (user.phone && user.phone.includes(normalizedSearch))
    )
    .sort((left, right) => {
      if (sortBy === "amount") return ((left.wallet?.balance || 0) - (right.wallet?.balance || 0)) * directionMultiplier;
      if (sortBy === "email") return left.email.localeCompare(right.email) * directionMultiplier;
      return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * directionMultiplier;
    });
  const pageSize = 10;
  const depositsPage = filteredDeposits.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const withdrawalsPage = filteredWithdrawals.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const usersPage = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, statusFilter, searchQuery, sortBy, sortDirection]);

  const refreshAll = async () => {
    setLoadingData(true);
    await Promise.all([
      fetchStats(),
      fetchDeposits(),
      fetchWithdrawals(),
      fetchUsers(),
      fetchSubAdmins(),
      fetchTickets(),
      fetchSessions(),
      fetchAdminChatData(activeChatUserId),
      fetchLogs(),
      fetchSettings(),
      fetchSimData(adminCategory),
    ]);
    setLoadingData(false);
  };

  const toggleSort = (column: "date" | "amount" | "email") => {
    if (sortBy === column) {
      setSortDirection((value) => value === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection(column === "date" ? "desc" : "asc");
    }
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const lastItem = Math.min(currentPage * pageSize, totalItems);
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <span className="text-[10px] font-bold text-slate-500">Showing {firstItem}-{lastItem} of {totalItems}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="rounded-lg border border-slate-800 px-3 py-1.5 text-[10px] font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[10px] font-bold text-slate-400">Page {currentPage} / {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="rounded-lg border border-slate-800 px-3 py-1.5 text-[10px] font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

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
  const trendMaximum = Math.max(
    1,
    ...(stats?.depositTrend || []).map((item) => item.amount),
    ...(stats?.withdrawalTrend || []).map((item) => item.amount)
  );

  return (
    <AdminDashboardFrame
      activeSection={tab}
      onSectionChange={(section) => setTab(section)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      notificationCount={pendingDeposits + pendingWithdrawals}
      onRefresh={refreshAll}
    >
      <div className="space-y-8 pb-16">
      {tab === "dashboard" && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loadingData
              ? Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />)
              : [
                  { label: "Total Users", value: totalUsers.toLocaleString(), hint: `${totalBetsCount.toLocaleString()} bets placed`, icon: Users, color: "text-indigo-300" },
                  { label: "Active Sessions", value: (stats?.activeSessionsCount || 0).toLocaleString(), hint: "Currently online", icon: Monitor, color: "text-emerald-300" },
                  { label: "Today's Deposits", value: `₹${(stats?.todayDepositAmount || 0).toFixed(2)}`, hint: "Approved today", icon: ArrowDownLeft, color: "text-emerald-300" },
                  { label: "Today's Withdrawals", value: `₹${(stats?.todayWithdrawalAmount || 0).toFixed(2)}`, hint: "Approved today", icon: ArrowUpRight, color: "text-amber-300" },
                  { label: "House Profit", value: `${(stats?.todayHouseNetProfit || 0) >= 0 ? "+" : ""}₹${(stats?.todayHouseNetProfit || 0).toFixed(2)}`, hint: `Gross today · margin ${profitMargin.toFixed(1)}% overall`, icon: DollarSign, color: (stats?.todayHouseNetProfit || 0) >= 0 ? "text-emerald-300" : "text-red-300" },
                  { label: "Rounds Settled Today", value: (stats?.roundsSettledToday || 0).toLocaleString(), hint: `Active round #${stats?.activeRoundNumber || 0}`, icon: Trophy, color: "text-purple-300" },
                ].map(({ label, value, hint, icon: Icon, color }) => (
                  <article key={label} className="glass-panel rounded-2xl border-slate-800/80 p-5 shadow-xl">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>{label}</span>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className={`mt-4 truncate font-mono text-2xl font-black ${color}`}>{value}</div>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500">{hint}</p>
                  </article>
                ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <article className="glass-panel rounded-2xl border-slate-800/80 p-5 xl:col-span-3">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-white">Deposit & Withdrawal Trends</h2>
                  <p className="mt-1 text-[10px] text-slate-500">Approved totals · last 7 days</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-300"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Deposits</span>
                  <span className="flex items-center gap-1.5 text-purple-300"><i className="h-2 w-2 rounded-full bg-purple-400" /> Withdrawals</span>
                </div>
              </div>
              <div className="flex h-40 items-end justify-between gap-2 border-b border-slate-800 pb-2">
                {(stats?.depositTrend || []).map((deposit, index) => {
                  const withdrawal = stats?.withdrawalTrend?.[index];
                  return (
                    <div key={deposit.date} className="relative flex h-full flex-1 items-end justify-center gap-1 pb-5">
                      <div title={`Deposits ₹${deposit.amount.toFixed(2)}`} className="w-3 rounded-t bg-emerald-400/80 transition hover:bg-emerald-300" style={{ height: `${Math.max(4, (deposit.amount / trendMaximum) * 100)}%` }} />
                      <div title={`Withdrawals ₹${(withdrawal?.amount || 0).toFixed(2)}`} className="w-3 rounded-t bg-purple-400/80 transition hover:bg-purple-300" style={{ height: `${Math.max(4, ((withdrawal?.amount || 0) / trendMaximum) * 100)}%` }} />
                      <span className="absolute bottom-0 text-[8px] text-slate-500">{new Date(`${deposit.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short" })}</span>
                    </div>
                  );
                })}
                {!loadingData && !stats?.depositTrend?.length && (
                  <p className="w-full self-center text-center text-xs text-slate-500">No trend data available yet.</p>
                )}
              </div>
            </article>

            <article className="glass-panel rounded-2xl border-slate-800/80 p-5 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white">Recent Activity</h2>
                  <p className="mt-1 text-[10px] text-slate-500">Latest administrator actions</p>
                </div>
                <button type="button" onClick={() => setTab("logs")} className="text-[10px] font-bold text-purple-300 hover:text-purple-200">View audit trail</button>
              </div>
              <div className="space-y-3">
                {loadingData
                  ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-900" />)
                  : stats?.recentActivity?.map((activity) => (
                      <div key={activity.id} className="flex gap-3 border-b border-slate-800/70 pb-3 last:border-0 last:pb-0">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-400 shadow-glow-violet" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-slate-200">{activity.action.replace(/_/g, " ")}</p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">{activity.admin.email} · {new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                {!loadingData && !stats?.recentActivity?.length && <p className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-xs text-slate-500">No activity recorded yet.</p>}
              </div>
            </article>
          </div>
        </section>
      )}

      {/* Manual Round Control & Outcome Override Engine */}
      {tab === "round" && <div className="glass-panel border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl bg-slate-900/90">
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
      </div>}

      {/* TAB 1: DEPOSITS */}
      {tab === "deposits" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Deposit Requests Management</h2>
              <p className="mt-1 text-[10px] text-slate-500">Review payment references and confirm each request.</p>
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500">
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("date")}>Date {sortBy === "date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("email")}>User Email {sortBy === "email" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("amount")}>Amount {sortBy === "amount" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3">Tx ID / UTR</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loadingData ? (
                  Array.from({ length: 4 }, (_, index) => <tr key={index}><td colSpan={6} className="py-4"><div className="h-5 animate-pulse rounded bg-slate-800/70" /></td></tr>)
                ) : depositsPage.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center"><div className="mx-auto max-w-sm rounded-2xl border border-dashed border-slate-700 p-6"><p className="text-sm font-bold text-slate-300">No deposit requests found</p><p className="mt-1 text-xs text-slate-500">Try a different search or status filter.</p></div></td></tr>
                ) : (
                  depositsPage.map((d) => (
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
          {renderPagination(filteredDeposits.length)}
        </div>
      )}

      {/* TAB 2: WITHDRAWALS */}
      {tab === "withdrawals" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Withdrawal Requests Management</h2>
              <p className="mt-1 text-[10px] text-slate-500">Validate payout details before processing.</p>
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500">
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("date")}>Date {sortBy === "date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("email")}>User Email {sortBy === "email" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("amount")}>Amount {sortBy === "amount" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3">Bank Details</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loadingData ? (
                  Array.from({ length: 4 }, (_, index) => <tr key={index}><td colSpan={6} className="py-4"><div className="h-5 animate-pulse rounded bg-slate-800/70" /></td></tr>)
                ) : withdrawalsPage.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center"><div className="mx-auto max-w-sm rounded-2xl border border-dashed border-slate-700 p-6"><p className="text-sm font-bold text-slate-300">No withdrawal requests found</p><p className="mt-1 text-xs text-slate-500">Try a different search or status filter.</p></div></td></tr>
                ) : (
                  withdrawalsPage.map((w) => (
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
          {renderPagination(filteredWithdrawals.length)}
        </div>
      )}

      {/* TAB 3: USERS DIRECTORY WITH BLOCK / UNBLOCK CONTROLS */}
      {tab === "users" && (
        <div className="glass-panel border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-black text-white">Registered Players Directory</h2>
            <p className="text-[10px] text-slate-500">Use the global search to find users by email or phone.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("email")}>Email {sortBy === "email" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Account Status</th>
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("date")}>Joined Date {sortBy === "date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3"><button onClick={() => toggleSort("amount")}>Wallet Balance {sortBy === "amount" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loadingData ? (
                  Array.from({ length: 4 }, (_, index) => <tr key={index}><td colSpan={6} className="py-4"><div className="h-5 animate-pulse rounded bg-slate-800/70" /></td></tr>)
                ) : usersPage.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center"><div className="mx-auto max-w-sm rounded-2xl border border-dashed border-slate-700 p-6"><p className="text-sm font-bold text-slate-300">No users found</p><p className="mt-1 text-xs text-slate-500">Try another search term.</p></div></td></tr>
                ) : usersPage.map((u) => (
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

                      {(u.role === "USER" || u.role === "ADMIN") && (
                        <button
                          onClick={() => handleUpdateUserRole(u)}
                          className={`px-3 py-1 rounded-xl font-bold text-xs ${u.role === "USER" ? "bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/60" : "bg-amber-600/30 text-amber-200 hover:bg-amber-600/60"}`}
                        >
                          {u.role === "USER" ? "Promote to Admin" : "Demote to User"}
                        </button>
                      )}

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
          {renderPagination(filteredUsers.length)}
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
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl border px-4 py-3 text-xs font-bold shadow-2xl ${
            toast.tone === "success"
              ? "border-emerald-500/30 bg-slate-900 text-emerald-200 shadow-glow-green"
              : "border-red-500/30 bg-slate-900 text-red-200 shadow-glow-red"
          }`}
        >
          {toast.message}
        </div>
      )}
      {confirmMessage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" className="glass-panel w-full max-w-md rounded-2xl border-purple-500/30 p-6 shadow-2xl">
            <h2 id="admin-confirm-title" className="text-base font-black text-white">Confirm administrator action</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{confirmMessage}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => resolveConfirmation(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800">
                Cancel
              </button>
              <button type="button" onClick={() => resolveConfirmation(true)} className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-glow-violet transition hover:from-purple-500 hover:to-indigo-500">
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminDashboardFrame>
  );
}
