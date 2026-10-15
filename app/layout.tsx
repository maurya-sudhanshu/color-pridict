import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteFrame from "@/components/SiteFrame";
import { ThemeProvider } from "@/lib/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ColorWin - 100% Provably Fair Color Prediction Game",
  description: "Play 30s Parity, 1-Min Sapre, and 3-Min Bcone color prediction games with instant UPI deposits and withdrawals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-purple-500 selection:text-white`}
      >
        <ThemeProvider>
          <SiteFrame>{children}</SiteFrame>
        </ThemeProvider>
      </body>
    </html>
  );
}
