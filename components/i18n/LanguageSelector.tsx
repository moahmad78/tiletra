"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/store";
import { SupportedLanguage } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "header" | "footer" | "panel" | "minimal";
  className?: string;
}

export default function LanguageSelector({
  variant = "header",
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fix SSR hydration: zustand persist uses localStorage, must wait for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLangInfo = languages.find((l) => l.code === language) || languages[0];

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  // Skeleton placeholder before hydration — preserves layout space
  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-xl animate-pulse bg-gray-100",
          variant === "header" && "h-[40px] w-[90px]",
          variant === "minimal" && "h-8 w-14",
          variant === "panel" && "h-[36px] w-[80px]",
          variant === "footer" && "h-7 w-[140px]",
          className
        )}
      />
    );
  }

  if (variant === "footer") {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        <Globe size={15} className="text-gray-400 shrink-0" />
        <span className="text-gray-400 font-medium">Language:</span>
        <div className="flex items-center gap-1.5">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                language === l.code
                  ? "bg-[#F26522] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        className={cn(
          "flex items-center gap-1.5 rounded-xl transition-all cursor-pointer font-bold select-none",
          variant === "header" &&
            "h-[40px] px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-xs text-[#052a51]",
          variant === "panel" &&
            "h-[36px] px-3 bg-white hover:bg-gray-50 border border-gray-200 text-xs text-gray-700 shadow-2xs",
          variant === "minimal" &&
            "h-8 px-2 text-gray-600 hover:text-[#052a51] rounded-lg hover:bg-gray-100 border border-gray-200/60"
        )}
      >
        <Globe size={15} className="text-[#052a51] shrink-0" />
        {(variant === "header" || variant === "panel") && (
          <>
            <span className="text-xs">{currentLangInfo.nativeName}</span>
            <ChevronDown size={13} className="text-gray-400" />
          </>
        )}
        {variant === "minimal" && (
          <>
            <span className="text-[11px] font-black uppercase">{currentLangInfo.code}</span>
            <ChevronDown size={11} className="text-gray-400" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white shadow-xl border border-gray-100 py-1.5 z-[999] animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
            Select Language / ????
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer text-left",
                language === l.code
                  ? "bg-[#052a51]/5 text-[#052a51] font-bold"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className="flex flex-col">
                <span className="font-bold text-[13px]">{l.nativeName}</span>
                <span className="text-[10px] text-gray-400">{l.name}</span>
              </div>
              {language === l.code && <Check size={14} className="text-[#F26522] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
