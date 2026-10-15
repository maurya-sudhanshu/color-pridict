"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import LiveChatWidget from "@/components/LiveChatWidget";
import Navbar from "@/components/Navbar";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? "min-h-screen w-full flex-1" : "max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10"}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <LiveChatWidget />}
    </>
  );
}
