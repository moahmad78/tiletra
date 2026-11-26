"use client";

import React from "react";
import Link from "next/link";
import { Box, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import AuthSupportWidget from "@/components/auth/AuthSupportWidget";

interface AuthPortalShellProps {
  portalTitle: string;
  portalSubtitle: string;
  portalDescription: string;
  portalType: "admin" | "vendor";
  badgeIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared split-screen authentication showcase shell for Admin, Vendor, and CPO portals.
 * Mirrors IntriHub Quickcommerce brand layout while keeping security widgets modular.
 */
export default function AuthPortalShell({
  portalTitle,
  portalSubtitle,
  portalDescription,
  portalType,
  badgeIcon,
  children,
}: AuthPortalShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#063260] via-[#052a51] to-[#031b35] selection:bg-[#F26522] selection:text-white">
      {/* Main Split Stage */}
      <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">
        {/* Ambient Right Glow */}
        <div
          className="hidden lg:block absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#F26522]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* ── LEFT BRAND SHOWCASE PANEL ─────────────────────────────────────── */}
        <section className="relative lg:w-[60%] xl:w-[62%] bg-[#eef4fb] flex flex-col justify-between overflow-hidden min-h-[280px] sm:min-h-[340px] lg:min-h-0 lg:[clip-path:polygon(0_0,95%_0,87%_100%,0_100%)]">
          {/* Warehouse & Truck Scene Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-bottom lg:bg-center pointer-events-none select-none"
            style={{ backgroundImage: "url('/images/auth/portal-showcase-bg.webp')" }}
            aria-hidden="true"
          />

          {/* Soft sky gradient wash strictly across upper headline area so warehouse logo stays sharp */}
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,252,0.97)_0%,rgba(244,248,252,0.82)_30%,rgba(244,248,252,0)_52%)] pointer-events-none"
            aria-hidden="true"
          />

          {/* Bottom-Left Navy & Orange Geometric Corner Ribbon */}
          <div
            className="hidden sm:block absolute bottom-0 left-0 w-44 h-24 pointer-events-none z-10"
            aria-hidden="true"
          >
            <svg viewBox="0 0 220 120" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,36 168,120 0,120" fill="#052a51" />
              <polygon points="0,20 185,120 162,120 0,38" fill="#F26522" />
            </svg>
          </div>

          {/* Top-Right Orange Geometric Diagonal Accent Wedge */}
          <div
            className="hidden lg:block absolute top-0 right-[4.5%] w-20 h-36 pointer-events-none z-10"
            aria-hidden="true"
          >
            <svg viewBox="0 0 80 144" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="48,0 78,0 34,132 10,120" fill="#F26522" />
            </svg>
          </div>

          {/* Showcase Foreground Content */}
          <div className="relative z-10 px-6 pt-7 pb-10 sm:px-10 sm:pt-10 lg:px-14 lg:pt-12 lg:pb-16 max-w-2xl">
            <Link
              href="/"
              className="inline-flex items-center group focus:outline-none"
              title="Return to IntriHub Store"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/intri-web-logo.png"
                alt="IntriHub Quickcommerce"
                width={220}
                height={65}
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </Link>

            <h1 className="mt-5 sm:mt-8 text-2xl sm:text-4xl xl:text-[44px] font-black tracking-tight text-[#052a51] leading-[1.08]">
              Every Material for <br />
              <span className="text-[#F26522]">Every Space.</span>
            </h1>

            <p className="mt-2.5 sm:mt-3.5 text-xs sm:text-[15px] font-semibold text-slate-600 max-w-md leading-relaxed">
              Your trusted partner for construction and interior materials.
            </p>

            {/* 3 Trust Pillars */}
            <div className="mt-5 sm:mt-7 grid grid-cols-3 max-w-md divide-x divide-slate-300/80">
              <div className="pr-3 sm:pr-4 flex flex-col items-center text-center">
                <Box size={22} strokeWidth={1.9} className="text-[#052a51] mb-1.5" />
                <span className="text-[11px] sm:text-xs font-extrabold text-[#052a51] leading-tight">
                  20+
                  <br />
                  Categories
                </span>
              </div>

              <div className="px-3 sm:px-4 flex flex-col items-center text-center">
                <ShieldCheck size={22} strokeWidth={1.9} className="text-[#052a51] mb-1.5" />
                <span className="text-[11px] sm:text-xs font-extrabold text-[#052a51] leading-tight">
                  Trusted
                  <br />
                  Quality
                </span>
              </div>

              <div className="pl-3 sm:pl-4 flex flex-col items-center text-center">
                <Truck size={22} strokeWidth={1.9} className="text-[#052a51] mb-1.5" />
                <span className="text-[11px] sm:text-xs font-extrabold text-[#052a51] leading-tight">
                  Pan India
                  <br />
                  Delivery
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── RIGHT AUTHENTICATION CARD STAGE ───────────────────────────────── */}
        <section className="relative flex-1 flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10 lg:-ml-8 xl:px-12">

          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20">
            {/* Brand Emblem & Portal Title */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-md flex items-center justify-center border border-slate-200/90 ring-4 ring-slate-100/80 overflow-hidden p-1.5">
                {badgeIcon || (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/logo/intri-app-badge.png"
                    alt="IntriHub App"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <h2 className="mt-4 text-xl sm:text-2xl font-black text-[#052a51] tracking-tight">
                {portalTitle}
              </h2>

              <div className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#e25a18]">
                <ShieldCheck size={14} className="shrink-0" />
                <span>{portalSubtitle}</span>
              </div>

              <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {portalDescription}
              </p>
            </div>

            {/* Active Auth Form / Status Views */}
            {children}

            {/* Unified Card Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <div className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-slate-400" />
                <span>IntriHub Security Gateway</span>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-[#052a51] font-bold transition-colors"
              >
                <ArrowLeft size={12} />
                <span>Return to Store</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── BOTTOM DARK NAVY LEGAL & SUPPORT BAR ────────────────────────────── */}
      <footer className="relative z-20 bg-[#031b35] border-t border-white/10 px-4 sm:px-8 lg:px-12 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] sm:text-xs font-medium text-blue-100/80 tracking-wide">
          IntriHub Private Limited &nbsp;|&nbsp; Every Material for Every Space
        </p>

        <AuthSupportWidget portalType={portalType} inlineFooter />
      </footer>
    </div>
  );
}
