"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Dices,
  FileClock,
  Headset,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  Users,
  X,
  KeyRound,
} from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "round"
  | "deposits"
  | "withdrawals"
  | "users"
  | "subadmins"
  | "sessions"
  | "support"
  | "logs"
  | "settings";

interface AdminDashboardFrameProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notificationCount: number;
  onRefresh: () => void;
  children: React.ReactNode;
}

const navigation: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "round", label: "Round Control", icon: Dices },
  { id: "deposits", label: "Deposit Requests", icon: CircleDollarSign },
  { id: "withdrawals", label: "Withdrawal Requests", icon: Landmark },
  { id: "users", label: "User Directory", icon: Users },
  { id: "subadmins", label: "Sub-Admin RBAC", icon: Shield },
  { id: "sessions", label: "User Sessions", icon: KeyRound },
  { id: "support", label: "Support & Live Chat", icon: Headset },
  { id: "logs", label: "Audit Trail", icon: FileClock },
  { id: "settings", label: "Payment UPI & QR", icon: Settings },
];

const titles: Record<AdminSection, string> = {
  dashboard: "Dashboard",
  round: "Round Control",
  deposits: "Deposit Requests",
  withdrawals: "Withdrawal Requests",
  users: "User Directory",
  subadmins: "Sub-Admin RBAC",
  sessions: "User Sessions",
  support: "Support & Live Chat",
  logs: "Audit Trail",
  settings: "Payment UPI & QR Settings",
};

export default function AdminDashboardFrame({
  activeSection,
  onSectionChange,
  searchQuery,
  onSearchChange,
  notificationCount,
  onRefresh,
  children,
}: AdminDashboardFrameProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [email, setEmail] = useState("Administrator");
  const sidebarCollapsed = collapsed && !mobileOpen;

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load administrator profile");
        const data = await response.json();
        if (active) setEmail(data.user.email);
      })
      .catch((error) => console.error(error));
    return () => {
      active = false;
    };
  }, []);

  const selectSection = (section: AdminSection) => {
    onSectionChange(section);
    setMobileOpen(false);
  };

  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      console.error("Administrator logout failed");
      return;
    }
    window.location.href = "/auth/login";
  };

  const sidebar = (
    <aside
      className={`flex h-full flex-col border-r border-slate-800 bg-slate-950/95 transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className={`flex h-[72px] items-center border-b border-slate-800 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <div className={`flex min-w-0 items-center gap-3 ${sidebarCollapsed ? "hidden" : ""}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 font-black text-white shadow-glow-violet">
            CW
          </span>
          <span className="truncate text-sm font-black text-white">
            Color<span className="text-purple-400">Win</span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Admin Console</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white lg:inline-flex"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={sidebarCollapsed ? label : undefined}
            onClick={() => selectSection(id)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${
              activeSection === id
                ? "border border-purple-500/30 bg-purple-500/15 text-purple-200 shadow-glow-violet"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
          >
            <Icon className={`h-[18px] w-[18px] shrink-0 ${activeSection === id ? "text-purple-300" : "text-slate-500 group-hover:text-slate-200"}`} />
            <span className={sidebarCollapsed ? "hidden" : "truncate"}>{label}</span>
            {id === "deposits" && notificationCount > 0 && !sidebarCollapsed && (
              <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                {notificationCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className={`border-t border-slate-800 p-4 text-[10px] font-bold uppercase tracking-wider text-slate-600 ${collapsed ? "text-center" : ""}`}>
        {sidebarCollapsed ? "CW" : "Cyber Neon Admin"}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative h-full w-[min(18rem,85vw)]">{sidebar}</div>
        </div>
      )}

      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center gap-3 border-b border-slate-800/80 bg-slate-950/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black tracking-tight text-white sm:text-xl">{titles[activeSection]}</h1>
            <p className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:block">Operations / {titles[activeSection]}</p>
          </div>

          <label className="relative w-28 shrink-0 sm:w-44 md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60"
            />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 transition hover:border-purple-500/40 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
                <p className="text-xs font-black text-white">Operations queue</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {notificationCount > 0 ? `${notificationCount} deposit or withdrawal requests need review.` : "No pending deposit or withdrawal requests."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    selectSection("deposits");
                  }}
                  className="mt-3 text-xs font-bold text-purple-300 hover:text-purple-200"
                >
                  Review deposits
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex max-w-[42px] items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1.5 transition hover:border-purple-500/40 sm:max-w-52 sm:px-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-black text-purple-200">
                {email.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden min-w-0 flex-1 text-left sm:block">
                <span className="block truncate text-[11px] font-bold text-white">{email}</span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-400">Administrator</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <ChartNoAxesCombined className="h-4 w-4" /> Refresh dashboard
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-300 transition hover:border-purple-500/40 hover:text-white"
            >
              <ClipboardList className="h-3.5 w-3.5" /> Refresh data
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
