import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="relative flex min-h-[65vh] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      <section className="glass-panel relative w-full max-w-lg rounded-3xl border-purple-500/30 p-8 text-center shadow-2xl sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-purple-300">
          Access control
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white">Access Denied</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          This account does not have permission to open this area. Contact an administrator if you believe this is a mistake.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-glow-violet transition hover:from-purple-500 hover:to-indigo-500"
        >
          Return to home
        </Link>
      </section>
    </div>
  );
}
