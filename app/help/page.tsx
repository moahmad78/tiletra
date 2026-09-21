"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  ArrowLeft,
  Headphones,
} from "lucide-react";
import ConnectDashboard from "@/components/connect/ConnectDashboard";

export default function HelpDeskPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check Initial Session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/help/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          const localAuth = localStorage.getItem("intrihub_help_auth");
          if (localAuth === "true") {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkSession();
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Send OTP (Step 1)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    const clean = authEmail.trim().toLowerCase();
    if (!clean) {
      setAuthError("Please enter your registered email address.");
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch("/api/help/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
        setResendCountdown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setAuthSuccessMsg("Verification code sent! Please check your email inbox and spam folder.");
      } else {
        setAuthError(data.error || "Access Denied: This email address is not authorized.");
      }
    } catch {
      setAuthError("Network error while requesting verification code.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle OTP Digit Input & Auto-Advance
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const copy = [...otpDigits];
      copy[index] = "";
      setOtpDigits(copy);
      return;
    }

    // Support pasting multi-digit code
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split("");
      const copy = [...otpDigits];
      pasted.forEach((ch, i) => {
        if (i < 6) copy[i] = ch;
      });
      setOtpDigits(copy);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      if (copy.join("").length === 6) {
        triggerVerify(copy.join(""));
      }
      return;
    }

    // Single digit input
    const copy = [...otpDigits];
    copy[index] = cleanVal;
    setOtpDigits(copy);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (copy.join("").length === 6) {
      triggerVerify(copy.join(""));
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Trigger Verify OTP (Step 2)
  const triggerVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6) {
      setAuthError("Please enter all 6 digits of the verification code.");
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    try {
      const clean = authEmail.trim().toLowerCase();
      const res = await fetch("/api/help/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("intrihub_help_auth", "true");
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || "Invalid or expired verification code. Please try again.");
      }
    } catch {
      setAuthError("Network error during verification.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerify();
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/help/auth/logout", { method: "POST" });
      localStorage.removeItem("intrihub_help_auth");
      setIsAuthenticated(false);
      setStep("email");
      setOtpDigits(["", "", "", "", "", ""]);
      setAuthEmail("");
      setAuthError(null);
      setAuthSuccessMsg(null);
    } catch {
      setIsAuthenticated(false);
    }
  };

  // 1. Loading Session
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-3 border-[#052a51] border-t-[#F26522] rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Verifying Support Portal Session...</p>
      </div>
    );
  }

  // 2. IntriHub Website Themed Login Gateway
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/70 to-slate-200/50 flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
        {/* Subtle Decorative Ambient Brand Accents */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#052a51]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#F26522]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Center Login Card Container */}
        <div className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(5,42,81,0.08)] border border-slate-200/90 space-y-6 transition-all">
            {/* IntriHub Official Logo & Slogan */}
            <div className="text-center space-y-1.5">
              <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
                <img
                  src="/logo/intri-web-logo.png"
                  alt="IntriHub"
                  width={170}
                  height={44}
                  className="h-10 sm:h-11 w-auto mx-auto object-contain"
                />
              </Link>
              <div className="pt-1">
                <p className="text-xs font-black text-[#F26522] uppercase tracking-wider">
                  Build Better, We Deliver Faster
                </p>
                <h1 className="text-xl font-extrabold text-[#052a51] tracking-tight flex items-center justify-center gap-2 mt-2">
                  <Headphones className="h-5 w-5 text-[#F26522]" />
                  <span>Customer Support Desk</span>
                </h1>
              </div>
            </div>

            {/* Security Notice (No Authorized Email Disclosed) */}
            <div className="p-3.5 rounded-2xl bg-[#052a51]/5 border border-[#052a51]/10 text-xs text-slate-700 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#052a51] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Authorized Access Only:</strong> Enter your registered company email to receive a secure one-time verification code (OTP).
              </span>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Success Message */}
            {authSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{authSuccessMsg}</span>
              </div>
            )}

            {step === "email" ? (
              /* ── STEP 1: EMAIL INPUT FORM ── */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Authorized Support Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Enter authorized email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-[#052a51] placeholder-slate-400 focus:outline-none focus:border-[#F26522] focus:bg-white focus:ring-2 focus:ring-[#F26522]/15 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || !authEmail.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#F26522] hover:bg-[#d95316] text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-[#F26522]/25 hover:shadow-lg hover:shadow-[#F26522]/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ── STEP 2: 6-DIGIT OTP FORM ── */
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider">
                      6-Digit Security Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setAuthError(null);
                        setAuthSuccessMsg(null);
                      }}
                      className="text-xs text-[#F26522] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Change Email
                    </button>
                  </div>

                  {/* 6 Individual Digit Inputs */}
                  <div className="flex justify-between gap-2 sm:gap-2.5 my-3">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-11 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono text-[#052a51] bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#052a51] focus:bg-white focus:ring-2 focus:ring-[#052a51]/15 transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 px-1">
                    <span>Code valid for 5 mins</span>
                    {resendCountdown > 0 ? (
                      <span className="text-slate-400 font-medium">Resend in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-[#F26522] hover:underline font-bold cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || otpDigits.join("").length !== 6}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#052a51] hover:bg-[#031d38] text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-[#052a51]/20 hover:shadow-lg hover:shadow-[#052a51]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Security Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[#F26522]" />
                      <span>Verify Code & Open Help Desk</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Trust & Security Badge */}
            <div className="text-center pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>IntriHub Enterprise Security • 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Branded Footer */}
        <footer className="text-center text-xs text-slate-500 py-3 relative z-10">
          © {new Date().getFullYear()} IntriHub Supply Network. All rights reserved. • Customer Support Operating System
        </footer>
      </div>
    );
  }

  // 3. Authenticated Customer Support Workspace
  return (
    <div className="min-h-screen bg-[#071321] flex flex-col">
      <ConnectDashboard
        portalContext="help"
        currentAgentEmail="info@intrihub.com"
        showLogout={true}
        onLogout={handleLogout}
      />
    </div>
  );
}
