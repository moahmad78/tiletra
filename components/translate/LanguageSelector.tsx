"use client";

import React, { useState, useRef, useEffect, useMemo, startTransition } from "react";
import { Globe, Search, Check, ChevronDown, ChevronRight, X, Loader2 } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "navbar" | "account" | "minimal";
  className?: string;
}

export default function LanguageSelector({
  variant = "navbar",
  className,
}: LanguageSelectorProps) {
  const {
    currentLang,
    currentLanguageInfo,
    isReady,
    isTranslating,
    languages,
    setLanguage,
    restoreOriginal,
  } = useLanguage();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, { passive: true });
      // Auto-focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Filter languages by search query (matches both native and English names, case-insensitive)
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return languages;

    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [languages, searchQuery]);

  // Separate pinned popular from other world languages when no active search
  const { pinnedList, otherList } = useMemo(() => {
    if (searchQuery.trim()) {
      return { pinnedList: filteredLanguages, otherList: [] };
    }
    const pinned = filteredLanguages.filter((l) => l.isPinned);
    const other = filteredLanguages.filter((l) => !l.isPinned);
    return { pinnedList: pinned, otherList: other };
  }, [filteredLanguages, searchQuery]);

  const handleSelectLanguage = (code: string) => {
    if (code === "en") {
      restoreOriginal();
    } else {
      setLanguage(code);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  // ── VARIANT 1: Account Tab Row (Mobile Web View & App) ──
  if (variant === "account") {
    return (
      <div className={cn("w-full notranslate", className)} translate="no" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => startTransition(() => setIsOpen(true))}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-100/80 text-left notranslate"
          translate="no"
          aria-label="Select Language"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#052a51] flex items-center justify-center shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#052a51] notranslate" translate="no">Language Preference</p>
              <p className="text-[11px] text-gray-500 font-medium notranslate" translate="no">
                {currentLanguageInfo.nativeName} ({currentLanguageInfo.name})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTranslating && <Loader2 size={14} className="animate-spin text-[#F26522]" />}
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        </button>

        {/* Modal / Dialog for Account View */}
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 notranslate" translate="no">
            <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-[#052a51]" />
                  <span className="font-extrabold text-sm text-[#052a51] notranslate" translate="no">Select Language</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Box */}
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search languages (English or native)..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#052a51]/20 font-medium notranslate"
                    translate="no"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Language List */}
              <div className="overflow-y-auto p-2 divide-y divide-gray-50 notranslate" translate="no" role="listbox">
                {pinnedList.length > 0 && (
                  <div className="pb-2">
                    <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 notranslate" translate="no">
                      {searchQuery ? "Search Results" : "Popular Languages"}
                    </p>
                    {pinnedList.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left notranslate",
                          currentLang === lang.code
                            ? "bg-[#052a51]/8 text-[#052a51] font-bold"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                        translate="no"
                        role="option"
                        aria-selected={currentLang === lang.code}
                      >
                        <div className="flex flex-col notranslate" translate="no">
                          <span className="font-bold text-[13px] text-[#052a51] notranslate" translate="no">{lang.nativeName}</span>
                          <span className="text-[11px] text-gray-500 notranslate" translate="no">{lang.name}</span>
                        </div>
                        {currentLang === lang.code && <Check size={16} className="text-[#F26522] shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {otherList.length > 0 && (
                  <div className="pt-2">
                    <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 notranslate" translate="no">
                      All World Languages ({otherList.length})
                    </p>
                    {otherList.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left notranslate",
                          currentLang === lang.code
                            ? "bg-[#052a51]/8 text-[#052a51] font-bold"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                        translate="no"
                        role="option"
                        aria-selected={currentLang === lang.code}
                      >
                        <div className="flex flex-col notranslate" translate="no">
                          <span className="font-medium text-[13px] text-gray-900 notranslate" translate="no">{lang.nativeName}</span>
                          <span className="text-[11px] text-gray-400 notranslate" translate="no">{lang.name}</span>
                        </div>
                        {currentLang === lang.code && <Check size={16} className="text-[#F26522] shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {filteredLanguages.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-500 notranslate" translate="no">
                    No languages matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VARIANT 2: Navbar Dropdown (Desktop & Panels) ──
  return (
    <div className={cn("relative inline-block text-left notranslate", className)} translate="no" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => startTransition(() => setIsOpen(!isOpen))}
        aria-label="Select Language"
        className={cn(
          "flex items-center gap-1.5 rounded-xl transition-all cursor-pointer font-bold select-none notranslate",
          variant === "navbar" &&
            "h-[38px] px-3 bg-gray-50/80 hover:bg-gray-100 border border-gray-200/80 text-xs text-[#052a51] shadow-2xs",
          variant === "minimal" &&
            "h-8 px-2 text-gray-600 hover:text-[#052a51] rounded-lg hover:bg-gray-100 border border-gray-200/60 text-xs"
        )}
        translate="no"
      >
        <Globe size={15} className="text-[#052a51] shrink-0" />
        <span className="text-xs notranslate truncate max-w-[85px] hidden sm:inline" translate="no">
          {currentLanguageInfo.nativeName.split(" ")[0]}
        </span>
        <span className="text-[11px] font-black uppercase sm:hidden notranslate" translate="no">
          {currentLang}
        </span>
        {isTranslating ? (
          <Loader2 size={12} className="animate-spin text-[#F26522] shrink-0" />
        ) : (
          <ChevronDown size={13} className="text-gray-400 shrink-0" />
        )}
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 max-h-[440px] rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 notranslate"
          translate="no"
          role="listbox"
        >
          {/* Search Box */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/60">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#052a51] font-medium notranslate"
                translate="no"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Languages Scrollable List */}
          <div className="overflow-y-auto p-1.5 divide-y divide-gray-50 notranslate" translate="no">
            {pinnedList.length > 0 && (
              <div className="pb-1.5">
                <p className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-gray-400 notranslate" translate="no">
                  {searchQuery ? "Search Results" : "Popular Languages"}
                </p>
                {pinnedList.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left notranslate",
                      currentLang === lang.code
                        ? "bg-[#052a51]/8 text-[#052a51] font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                    translate="no"
                    role="option"
                    aria-selected={currentLang === lang.code}
                  >
                    <div className="flex flex-col notranslate" translate="no">
                      <span className="font-bold text-[12px] text-[#052a51] notranslate" translate="no">{lang.nativeName}</span>
                      <span className="text-[10px] text-gray-400 notranslate" translate="no">{lang.name}</span>
                    </div>
                    {currentLang === lang.code && <Check size={14} className="text-[#F26522] shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {otherList.length > 0 && (
              <div className="pt-1.5">
                <p className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-gray-400 notranslate" translate="no">
                  All World Languages ({otherList.length})
                </p>
                {otherList.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left notranslate",
                      currentLang === lang.code
                        ? "bg-[#052a51]/8 text-[#052a51] font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                    translate="no"
                    role="option"
                    aria-selected={currentLang === lang.code}
                  >
                    <div className="flex flex-col notranslate" translate="no">
                      <span className="font-medium text-[12px] text-gray-900 notranslate" translate="no">{lang.nativeName}</span>
                      <span className="text-[10px] text-gray-400 notranslate" translate="no">{lang.name}</span>
                    </div>
                    {currentLang === lang.code && <Check size={14} className="text-[#F26522] shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {filteredLanguages.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400 notranslate" translate="no">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
