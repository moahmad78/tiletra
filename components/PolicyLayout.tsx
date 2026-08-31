"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  RotateCcw,
  Truck,
  HelpCircle,
  Headphones,
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  Sparkles,
  List,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export type PolicyTabId = "privacy" | "terms" | "returns" | "shipping" | "faq" | "contact";

export interface PolicySectionItem {
  id: string;
  title: string;
}

interface PolicyLayoutProps {
  currentTab: PolicyTabId;
  title: string;
  categoryTag?: string;
  lastUpdated?: string;
  sections?: PolicySectionItem[];
  children: React.ReactNode;
}

const POLICY_NAV_ITEMS: {
  id: PolicyTabId;
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "returns",
    label: "Returns & Replacement",
    href: "/returns-policy",
    icon: RotateCcw,
    description: "7-day window & transit damage replacement",
  },
  {
    id: "shipping",
    label: "Shipping & Delivery",
    href: "/shipping-policy",
    icon: Truck,
    description: "Freight rates, timelines & unloading info",
  },
  {
    id: "privacy",
    label: "Privacy Policy",
    href: "/privacy-policy",
    icon: ShieldCheck,
    description: "Data handling, encryption & security",
  },
  {
    id: "terms",
    label: "Terms of Service",
    href: "/terms",
    icon: FileText,
    description: "User agreement, pricing & jurisdiction",
  },
  {
    id: "faq",
    label: "Frequently Asked Questions",
    href: "/faq",
    icon: HelpCircle,
    description: "Common questions on orders & materials",
  },
  {
    id: "contact",
    label: "Contact & Support",
    href: "/contact",
    icon: Headphones,
    description: "Get in touch with customer care",
  },
];

export default function PolicyLayout({
  currentTab,
  title,
  categoryTag = "Policy & Legal",
  lastUpdated = "August 2026",
  sections = [],
  children,
}: PolicyLayoutProps) {
  const pathname = usePathname();
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  useEffect(() => {
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSectionId(id);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-neutral-50 font-sans">
      <Header />

      {/* Top Hero Banner with Brand Navy & Accent Colors */}
      <section className="bg-gradient-to-b from-[#031c38] via-[#052a51] to-[#0a396b] text-white pt-[140px] md:pt-[175px] pb-12 sm:pb-16 border-b border-white/10 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F26522]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-3 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-white/80">Help & Legal</span>
            <ChevronRight size={12} />
            <span className="text-[#F26522] font-bold">{title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#F26522] bg-[#F26522]/15 border border-[#F26522]/30 px-3 py-1 rounded-full mb-2.5">
                <Sparkles size={12} />
                <span>{categoryTag}</span>
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
                {title}
              </h1>
            </div>
            <div className="text-xs sm:text-sm text-white/70 shrink-0 font-medium">
              Last updated: <span className="text-white font-bold">{lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Horizontal Quick Navigation Bar */}
      <div className="md:hidden bg-white border-b border-neutral-200 sticky top-[56px] z-20 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-4 no-scrollbar">
          {POLICY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? "bg-[#052a51] text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#F26522]" : "text-neutral-500"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Jump-to-Section Dropdown / Pills if sections exist */}
        {sections.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-4 border-t border-neutral-100 bg-neutral-50 no-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 shrink-0 mr-1 flex items-center gap-1">
              <List size={11} /> Jump to:
            </span>
            {sections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 ${
                  activeSectionId === sec.id
                    ? "bg-[#F26522] text-white"
                    : "bg-white border border-neutral-200 text-neutral-700 hover:border-[#F26522]/50"
                }`}
              >
                {idx + 1}. {sec.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area with Left Sidebar on Desktop */}
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-8 sm:py-12 flex-1">
        <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
          {/* Desktop Left Sidebar Navigation */}
          <aside className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-[140px] space-y-4">
            {/* Table of Contents Widget (if sections provided) */}
            {sections.length > 0 && (
              <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-xs space-y-2.5">
                <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>Table of Contents</span>
                  <List size={13} className="text-[#F26522]" />
                </div>
                <nav className="space-y-1">
                  {sections.map((sec, idx) => {
                    const isActive = activeSectionId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#052a51] text-white shadow-xs"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                            isActive ? "bg-[#F26522] text-white" : "bg-neutral-200 text-neutral-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="leading-snug line-clamp-2">{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Policy Category Navigation */}
            <div className="bg-white rounded-3xl p-3 border border-neutral-200 shadow-xs">
              <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-neutral-400">
                Legal & Policy Center
              </div>
              <nav className="space-y-1 mt-1">
                {POLICY_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id || pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${
                        isActive
                          ? "bg-[#052a51] text-white shadow-xs ring-1 ring-[#052a51]"
                          : "hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isActive ? "bg-white/15 text-[#F26522]" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-tight">{item.label}</div>
                        <div
                          className={`text-[11px] leading-tight mt-1 truncate ${
                            isActive ? "text-white/70" : "text-neutral-500"
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Contact / Support Card */}
            <div className="bg-gradient-to-br from-[#052a51]/5 to-orange-50/60 rounded-3xl p-5 border border-orange-200/50 space-y-3">
              <div className="flex items-center gap-2 text-[#052a51] font-black text-sm">
                <Headphones size={16} className="text-[#F26522]" />
                <span>Need Direct Assistance?</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Questions regarding site delivery, transit damage replacement, or orders? Our Bangalore desk is available Mon–Sat (8AM–8PM).
              </p>
              <div className="space-y-2 pt-1">
                <a
                  href="https://wa.me/919264920211?text=Hi%20Intrihub,%20I%20have%20a%20query%20regarding%20policies%20or%20orders."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-[#1E9E6B] hover:underline"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp Priority Desk</span>
                </a>
                <a
                  href="tel:+919264920211"
                  className="flex items-center gap-2 text-xs font-bold text-neutral-800 hover:text-[#052a51] transition-colors"
                >
                  <Phone size={13} className="text-[#F26522]" />
                  <span>+91 92649 20211</span>
                </a>
                <a
                  href="mailto:support@intrihub.com"
                  className="flex items-center gap-2 text-xs font-bold text-neutral-800 hover:text-[#052a51] transition-colors"
                >
                  <Mail size={13} className="text-[#052a51]" />
                  <span>support@intrihub.com</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Right Main Policy Content Body */}
          <div className="flex-1 w-full min-w-0">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-xs border border-neutral-200 space-y-6 text-sm sm:text-base text-neutral-700 leading-relaxed font-normal">
              {children}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
