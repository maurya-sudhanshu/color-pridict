"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, THEMES, ThemeId } from "@/lib/theme-context";
import { Palette, Check, Sparkles, ChevronDown } from "lucide-react";

export default function ThemeSelector() {
  const { currentTheme, themeId, setThemeId, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 transition shadow-md group"
        title="Change Website Theme"
      >
        <span className="text-sm">{currentTheme.icon}</span>
        <span className="hidden md:inline text-[11px] font-black uppercase tracking-wider text-slate-300">
          {currentTheme.name}
        </span>
        <div
          className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
          style={{ backgroundColor: currentTheme.primaryColor }}
        />
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Theme Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel border border-slate-800 bg-slate-950/95 shadow-2xl p-2.5 z-50 space-y-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              Website Themes
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="space-y-1 pt-1">
            {availableThemes.map((t) => {
              const isSelected = themeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setThemeId(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-slate-900 border border-slate-700 text-white font-bold"
                      : "hover:bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-base">{t.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{t.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {t.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ backgroundColor: t.primaryColor }}
                    />
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 font-bold" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
