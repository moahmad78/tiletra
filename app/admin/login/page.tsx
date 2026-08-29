"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { sendAdminWebOtp, verifyAdminWebOtp } from "@/lib/actions/web-portal-auth";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setSession, isAuthenticated } = useAdminAuth();

  // If already authenticated, redirect to /admin
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  // Auth Step: "email" (Step 1) | "otp" (Step 2)
  const [step, setStep] = useState<"email" | "otp">("email");

  // Step 1 state
  const [email, setEmail] = useState("admin@intrihub.com");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Step 2 state (OTP)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: any;
    if (isLockedOut && lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setErrorMessage("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimer]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: any;
    if (step === "otp" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Auto-focus first OTP input when switching to Step 2
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const formatLockoutTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Step 1: Request OTP ──────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your authorized admin email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await sendAdminWebOtp(cleanEmail);

      if (res.success) {
        toast.success(res.message);
        setStep("otp");
        setResendCooldown(60);
      } else {
        if (res.locked) {
          setIsLockedOut(true);
          setLockoutTimer(res.retryAfterSeconds || 900);
        } else {
          setIsLockedOut(false);
        }
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch (err: any) {
      console.error("Admin OTP request error:", err);
      setErrorMessage("Failed to connect to authentication service. Please check network logs.");
      toast.error("Failed to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Handle OTP Input & Auto-Advance ──────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || "";
        }
        setOtpDigits(nextDigits);
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
        return;
      }
    }

    const clean = value.replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = clean;
    setOtpDigits(nextDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const nextDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = pasted[i] || "";
      }
      setOtpDigits(nextDigits);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // ── Step 2: Submit OTP ───────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }

    setOtpLoading(true);

    try {
      const res = await verifyAdminWebOtp(email.trim().toLowerCase(), fullOtp);

      if (res.success && res.user) {
        toast.success("Admin identity verified! Welcome to Super Admin Console.");
        setSession(res.user);
        router.push("/admin");
      } else {
        if (res.locked) {
          setIsLockedOut(true);
          setLockoutTimer(res.retryAfterSeconds || 900);
          setStep("email");
        } else {
          setIsLockedOut(false);
        }
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch (err: any) {
      console.error("Admin OTP verification error:", err);
      setErrorMessage("Verification failed. Please check network connection.");
      toast.error("Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || otpLoading) return;
    setOtpLoading(true);
    setErrorMessage("");

    try {
      const res = await sendAdminWebOtp(email.trim().toLowerCase());

      if (res.success) {
        toast.success("A new 6-digit security code has been sent!");
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        if (res.locked) {
          setIsLockedOut(true);
          setLockoutTimer(res.retryAfterSeconds || 900);
          setStep("email");
        }
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to resend OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#052a51] via-[#031d38] to-[#02152b]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Subtle orange ambient blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F26522]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8 relative">
          <Link
            href="/"
            title="Intrihub Home"
            className="inline-flex items-center gap-2.5 bg-[#052a51]/5 hover:bg-[#052a51]/10 border border-[#052a51]/10 px-4 py-2.5 rounded-2xl shadow-xs mb-4 transition-all group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/intri-web-logo.png"
              alt="Intrihub Logo"
              width={140}
              height={36}
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#052a51] rounded-md text-white shadow-xs">
              Super Admin
            </span>
          </Link>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck size={18} className="text-[#F26522]" />
            <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">
              {step === "email" ? "Admin Security Gateway" : "Two-Factor Verification"}
            </h1>
          </div>

          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {step === "email"
              ? "Strict OTP Gated: Restricted exclusively to authorized admin personnel"
              : `Enter the 6-digit code sent to ${email || "your email"}`}
          </p>
        </div>

        {/* Lockout Alert */}
        {isLockedOut && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 animate-in fade-in">
            <Clock size={18} className="shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">Security Lockout Active</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Too many failed attempts recorded (3/3). For system security, access from this network is locked.
                {lockoutTimer > 0 ? (
                  <span className="block mt-1 font-bold text-amber-950">
                    ⏱ Retry allowed in {formatLockoutTime(lockoutTimer)}
                  </span>
                ) : (
                  <span className="block mt-1">Please wait for 15 minutes before retrying.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && !isLockedOut && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* ── STEP 1: EMAIL REQUEST FORM ─────────────────────────────────── */}
        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Authorized Admin Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  disabled={isLockedOut}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@intrihub.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522] focus:bg-white transition-all shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 pl-1">
                Only whitelisted admin accounts can receive a login OTP (Max 3 failed attempts).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || isLockedOut}
              className="w-full py-3.5 px-4 bg-[#052a51] hover:bg-[#031d38] disabled:bg-gray-300 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : isLockedOut ? (
                <>
                  <Clock size={16} />
                  <span>Locked ({formatLockoutTime(lockoutTimer)})</span>
                </>
              ) : (
                <>
                  <span>Send Security OTP</span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── STEP 2: OTP VERIFICATION FORM ────────────────────────────── */
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setErrorMessage("");
                  }}
                  className="text-xs text-[#F26522] hover:underline font-bold flex items-center gap-1"
                >
                  <ArrowLeft size={12} />
                  Change Email
                </button>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex justify-between gap-2 sm:gap-3 my-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border transition-all ${
                      digit
                        ? "border-[#052a51] bg-white text-[#052a51] shadow-xs"
                        : "border-gray-200 bg-gray-50 text-gray-800"
                    } focus:outline-none focus:border-[#F26522] focus:bg-white focus:ring-2 focus:ring-[#F26522]/20`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpDigits.some((d) => !d) || isLockedOut}
              className="w-full py-3.5 px-4 bg-[#052a51] hover:bg-[#031d38] disabled:bg-gray-300 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {otpLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Verify & Access Admin Console</span>
                </>
              )}
            </button>

            {/* Resend Action */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || otpLoading || isLockedOut}
                className="text-xs font-bold text-gray-500 hover:text-[#052a51] disabled:text-gray-400 inline-flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={13}
                  className={otpLoading ? "animate-spin" : ""}
                />
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't receive code? Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Intrihub Security Gateway</span>
          <Link
            href="/"
            className="hover:text-[#052a51] font-bold transition-colors"
          >
            ← Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
