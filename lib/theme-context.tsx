"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "cyber" | "light" | "gold" | "emerald" | "sapphire" | "crimson";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  icon: string;
  primaryColor: string;
  badgeBg: string;
  glowClass: string;
  borderClass: string;
  description: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cyber: {
    id: "cyber",
    name: "Cyber Neon",
    icon: "🌌",
    primaryColor: "#a855f7",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    glowClass: "shadow-glow-violet",
    borderClass: "border-purple-500/40",
    description: "Deep Neon Purple & Indigo VIP Casino",
  },
  light: {
    id: "light",
    name: "Light Crystal",
    icon: "☀️",
    primaryColor: "#4f46e5",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-300",
    glowClass: "shadow-glow-cyan",
    borderClass: "border-indigo-300",
    description: "Clean Light Pearl White & Sapphire VIP",
  },
  gold: {
    id: "gold",
    name: "Royal Gold",
    icon: "🏆",
    primaryColor: "#f59e0b",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    glowClass: "shadow-glow-gold",
    borderClass: "border-amber-500/40",
    description: "High Roller Gold & Obsidian Luxury",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Luck",
    icon: "⚡",
    primaryColor: "#10b981",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    glowClass: "shadow-glow-green",
    borderClass: "border-emerald-500/40",
    description: "Cyber Mint Green & Fortune Matrix",
  },
  sapphire: {
    id: "sapphire",
    name: "Sapphire Ice",
    icon: "💎",
    primaryColor: "#06b6d4",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    glowClass: "shadow-glow-cyan",
    borderClass: "border-cyan-500/40",
    description: "Electric Blue & Crystal Frost",
  },
  crimson: {
    id: "crimson",
    name: "Dragon Crimson",
    icon: "🌇",
    primaryColor: "#f43f5e",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    glowClass: "shadow-glow-red",
    borderClass: "border-rose-500/40",
    description: "Ruby Red & Sunset Fire",
  },
};

interface ThemeContextType {
  currentTheme: ThemeConfig;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: THEMES.cyber,
  themeId: "cyber",
  setThemeId: () => {},
  availableThemes: Object.values(THEMES),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("cyber");

  useEffect(() => {
    const savedTheme = localStorage.getItem("colorwin_theme") as ThemeId;
    if (savedTheme && THEMES[savedTheme]) {
      setThemeIdState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      }
    } else {
      document.documentElement.setAttribute("data-theme", "cyber");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const setThemeId = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeIdState(id);
      localStorage.setItem("colorwin_theme", id);
      document.documentElement.setAttribute("data-theme", id);

      if (id === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      }
    }
  };

  const currentTheme = THEMES[themeId] || THEMES.cyber;

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeId,
        setThemeId,
        availableThemes: Object.values(THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
