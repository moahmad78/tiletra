"use client";

import React from "react";
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
  ExternalLink,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export type PolicyTabId = "privacy" | "terms" | "returns" | "shipping" | "faq" | "contact";

interface PolicyLayoutProps {
  currentTab: PolicyTabId;
  title: string;
  categoryTag?: string;
  lastUpdated?: string;
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
  children,
}: PolicyLayoutProps) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      {/* Top Hero Banner with Safe Padding for Fixed Navbar */}
      <section className="bg-gradient-to-b from-[#031c38] via-[#052a51] to-[#0a396b] text-white pt-[140px] md:pt-[175px] pb-12 sm:pb-16 border-b border-white/10 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F26522]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-3 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-white/80">Help & Legal</span>
            <ChevronRight size={12} />
            <span className="text-[#F26522] font-semibold">{title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#F26522] bg-[#F26522]/15 border border-[#F26522]/30 px-3 py-1 rounded-full mb-2.5">
                {categoryTag}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
                {title}
              </h1>
            </div>
            <div className="text-xs sm:text-sm text-white/60 shrink-0">
              Last updated: <span className="text-white font-medium">{lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Horizontal Quick Navigation Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-[56px] z-20 shadow-xs">
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
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#F26522]" : "text-gray-500"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area with Left Sidebar on Desktop */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
        <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
          {/* Desktop Left Sidebar Navigation */}
          <aside className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-[140px] space-y-4">
            <div className="bg-white rounded-3xl p-3 border border-gray-200/80 shadow-xs">
              <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-gray-400">
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
                          ? "bg-[#052a51] text-white shadow-sm ring-1 ring-[#052a51]"
                          : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isActive
                            ? "bg-white/15 text-[#F26522]"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-tight">
                          {item.label}
                        </div>
                        <div
                          className={`text-[11px] leading-tight mt-1 truncate ${
                            isActive ? "text-white/70" : "text-gray-500"
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
                <span>Need Assistance?</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Have questions regarding orders, transit breakage, or policies? Our Bangalore support desk is here to help.
              </p>
              <div className="space-y-2 pt-1">
                <a
                  href="tel:+919198035803"
                  className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-[#052a51] transition-colors"
                >
                  <Phone size={13} className="text-[#F26522]" />
                  <span>+91 91980 35803</span>
                </a>
                <a
                  href="https://wa.me/917870935277"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-[#052a51] transition-colors"
                >
                  <MessageCircle size={13} className="text-emerald-600" />
                  <span>WhatsApp Priority Desk</span>
                </a>
                <a
                  href="mailto:support@intrihub.com"
                  className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-[#052a51] transition-colors"
                >
                  <Mail size={13} className="text-[#052a51]" />
                  <span>support@intrihub.com</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Right Main Policy Content Body */}
          <div className="flex-1 w-full min-w-0">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-xs border border-gray-200/80 space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
