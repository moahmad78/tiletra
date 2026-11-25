"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVendorAuth } from "@/lib/vendor-auth";
import {
  sendVendorWebOtp,
  verifyVendorWebOtp,
} from "@/lib/actions/web-portal-auth";
import {
  Store,
  ArrowRight,
  Mail,
  KeyRound,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Headphones,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import AuthPortalShell from "@/components/auth/AuthPortalShell";

export default function VendorLoginPage() {
  const router = useRouter();
  const { setVendor, isAuthenticated } = useVendorAuth();

  // If already authenticated, redirect to /vendor
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/vendor");
    }
  }, [isAuthenticated, router]);

  // Portal presentation toggle (both Vendor & CPO use the unified sendVendorWebOtp gateway)
  const [portalMode, setPortalMode] = useState<"vendor" | "cpo">("vendor");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("portal") === "cpo") {
        const frame = requestAnimationFrame(() => setPortalMode("cpo"));
        return () => cancelAnimationFrame(frame);
      }
    }
  }, []);

  // Auth Steps: "email" | "otp" | "not_found" | "pending" | "rejected"
  const [step, setStep] = useState<"email" | "otp" | "not_found" | "pending" | "rejected">("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(3);

  // OTP form state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
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

  // Resend cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (step === "otp" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Auto-focus first OTP input
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

  // ── Step 1: Submit Email for Password-less OTP Dispatch ──────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your registered vendor or partner email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await sendVendorWebOtp(cleanEmail);

      if (res.success) {
        toast.success(res.message);
        if (res.vendorName) {
          setVendorName(res.vendorName);
        }
        setStep("otp");
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
      } else {
        if (res.locked) {
          setIsLockedOut(true);
          setLockoutTimer(res.retryAfterSeconds || 900);
          setStep("email");
        } else {
          setIsLockedOut(false);
        }

        if (typeof res.remainingAttempts === "number") {
          setRemainingAttempts(res.remainingAttempts);
        }

        if (res.reason === "NOT_FOUND") {
          if (res.locked) {
            setStep("email");
          } else {
            setStep("not_found");
          }
        } else if (res.reason === "PENDING_APPROVAL") {
          setVendorName(res.vendorName || null);
          setStep("pending");
        } else if (res.reason === "REJECTED") {
          setVendorName(res.vendorName || null);
          setRejectionReason(res.rejectionReason || null);
          setStep("rejected");
        } else {
          setErrorMessage(res.message || "Unable to dispatch verification code.");
          toast.error(res.message || "Vendor lookup failed");
        }
      }
    } catch (err: unknown) {
      console.error("Vendor OTP request error:", err);
      setErrorMessage("Failed to connect to authentication service. Please try again.");
      toast.error("Failed to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Handle OTP Input & Paste ─────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const nextDigits = ["", "", "", "", "", ""];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || "";
        }
        setOtpDigits(nextDigits);
        if (pasted.length === 6) {
          inputRefs.current[5]?.focus();
          handleOtpSubmit(undefined, pasted);
        } else {
          const focusIndex = Math.min(pasted.length, 5);
          inputRefs.current[focusIndex]?.focus();
        }
        return;
      }
    }

    const clean = value.replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = clean;
    setOtpDigits(nextDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (clean && index === 5) {
      const fullCode = nextDigits.join("");
      if (fullCode.length === 6) {
        handleOtpSubmit(undefined, fullCode);
      }
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
      const nextDigits = ["", "", "", "", "", ""];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = pasted[i] || "";
      }
      setOtpDigits(nextDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
        handleOtpSubmit(undefined, pasted);
      } else {
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
      }
    }
  };

  // ── Step 2: Submit OTP for Verification ──────────────────────────────────
  const handleOtpSubmit = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    if (otpLoading || isLockedOut) return;
    setErrorMessage("");

    const fullOtp = overrideCode || otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    setOtpLoading(true);

    try {
      const res = await verifyVendorWebOtp(email.trim().toLowerCase(), fullOtp);

      if (res.success) {
        const portalRes = res as { redirectTo?: string; role?: string };
        if (portalRes.redirectTo === "/cpo" || portalRes.role === "cpo") {
          toast.success("Welcome back, Chief Product Officer!");
          router.push("/cpo");
          return;
        }
        if (res.vendor) {
          toast.success("Welcome to your Vendor Panel!");
          setVendor(res.vendor);
          router.push("/vendor");
          return;
        }
        // Fallback for general authorized partner session
        router.push("/vendor");
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
    } catch (err: unknown) {
      console.error("Vendor OTP verify error:", err);
      setErrorMessage("Verification failed. Please check network connection.");
      toast.error("Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || otpLoading || isLockedOut) return;
    setOtpLoading(true);
    setErrorMessage("");

    try {
      const res = await sendVendorWebOtp(email.trim().toLowerCase());

      if (res.success) {
        toast.success("A new 6-digit verification code has been sent!");
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
      toast.error("Failed to resend verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const portalTitle =
    portalMode === "cpo" ? "IntriHub CPO Portal" : "IntriHub Partner Portal";
  const portalDescription =
    step === "otp"
      ? `Enter the 6-digit security code sent to ${email || "your email"}.`
      : portalMode === "cpo"
        ? "Chief Product Officer & catalog operations gateway. Enter your registered CPO email to receive a 6-digit OTP."
        : "Seller & CPO operations workspace. Enter your registered vendor or partner email to receive a 6-digit code.";

  return (
    <AuthPortalShell
      portalTitle={portalTitle}
      portalSubtitle="Password-less Security OTP"
      portalDescription={portalDescription}
      portalType="vendor"
    >
      {/* Portal Role Switcher (Vendor Partner / CPO Portal) */}
      {step === "email" && (
        <div
          className="mb-5 grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80"
          role="tablist"
          aria-label="Select partner portal role"
        >
          <button
            type="button"
            role="tab"
            aria-selected={portalMode === "vendor"}
            onClick={() => {
              setPortalMode("vendor");
              setErrorMessage("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              portalMode === "vendor"
                ? "bg-[#052a51] text-white shadow-xs"
                : "text-slate-600 hover:text-[#052a51]"
            }`}
          >
            <Store size={14} />
            <span>Vendor Portal</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={portalMode === "cpo"}
            onClick={() => {
              setPortalMode("cpo");
              setErrorMessage("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              portalMode === "cpo"
                ? "bg-[#052a51] text-white shadow-xs"
                : "text-slate-600 hover:text-[#052a51]"
            }`}
          >
            <Briefcase size={14} />
            <span>CPO Portal</span>
          </button>
        </div>
      )}

      {/* Lockout Warning */}
      {isLockedOut && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 animate-in fade-in">
          <Clock size={18} className="shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-extrabold text-amber-950">Security Lockout Active</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Too many failed attempts recorded (3/3). For account security, access from this network is locked.
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
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ── STATE 1: EMAIL REQUEST FORM ──────────────────────────────── */}
      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold text-[#052a51] uppercase tracking-wider mb-1.5">
              {portalMode === "cpo" ? "Registered CPO / Partner Email" : "Registered Partner Email"}
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={email}
                disabled={isLockedOut}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  portalMode === "cpo"
                    ? "Enter authorized CPO email"
                    : "Enter registered vendor or partner email"
                }
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#052a51] placeholder-slate-400 focus:bg-white focus:border-[#F26522] focus:outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 pl-0.5">
              {portalMode === "cpo"
                ? "Restricted to authorized CPO personnel (Max 3 failed attempts)."
                : "Approved vendors & CPO accounts receive an instant 6-digit OTP."}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || isLockedOut}
            className="w-full py-3.5 px-4 bg-[#052a51] hover:bg-[#031d38] disabled:bg-slate-300 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Security Code...</span>
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
      )}

      {/* ── STATE 2: 6-DIGIT OTP VERIFICATION ───────────────────────── */}
      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold text-[#052a51] uppercase tracking-wider">
                6-Digit Login Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setErrorMessage("");
                }}
                className="text-xs text-[#F26522] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} />
                Change Email
              </button>
            </div>

            {vendorName && (
              <p className="text-[11px] font-semibold text-slate-500 mb-2">
                Account: <strong className="text-[#052a51]">{vendorName}</strong>
              </p>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-between gap-2 sm:gap-2.5 my-2">
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
                  className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-black rounded-xl border transition-all ${
                    digit
                      ? "border-[#052a51] bg-white text-[#052a51] shadow-xs"
                      : "border-slate-200 bg-slate-50 text-slate-800"
                  } focus:outline-none focus:border-[#F26522] focus:bg-white focus:ring-2 focus:ring-[#F26522]/20`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={otpLoading || otpDigits.some((d) => !d) || isLockedOut}
            className="w-full py-3.5 px-4 bg-[#052a51] hover:bg-[#031d38] disabled:bg-slate-300 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {otpLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Verify & Enter Panel</span>
              </>
            )}
          </button>

          {/* Resend Action */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || otpLoading || isLockedOut}
              className="text-xs font-bold text-slate-500 hover:text-[#052a51] disabled:text-slate-400 inline-flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed cursor-pointer"
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

      {/* ── STATE 3: NOT REGISTERED AS VENDOR SCREEN ─────────────────── */}
      {step === "not_found" && (
        <div className="text-center space-y-4 py-1">
          <div className="w-13 h-13 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Store size={26} />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900">Access Denied: Email Not Registered</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
              The email <strong className="text-slate-800">{email}</strong> is not registered as an approved vendor or CPO on IntriHub.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-bold text-amber-800">
              <span>{remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining before 15-min lockout</span>
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link
              href="/vendor/apply"
              className="w-full py-3 px-4 bg-[#F26522] hover:bg-[#d95315] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Store size={15} />
              <span>Apply as a Vendor Partner</span>
              <ArrowRight size={14} />
            </Link>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setErrorMessage("");
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Try Another Email</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 4: APPLICATION PENDING REVIEW SCREEN ──────────────── */}
      {step === "pending" && (
        <div className="text-center space-y-4 py-1">
          <div className="w-13 h-13 rounded-2xl bg-blue-100 text-[#052a51] flex items-center justify-center mx-auto">
            <Clock size={26} />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900">Application Under Review</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
              {vendorName ? <strong>{vendorName}</strong> : "Your store application"} is currently being reviewed by our merchant onboarding team.
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200/60 rounded-xl text-left text-xs text-blue-900 space-y-1">
            <p className="font-bold">Next Steps:</p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              We verify GSTIN, bank records, and warehouse location within 24–48 business hours. You will receive an approval email once activated.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setErrorMessage("");
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 5: APPLICATION REJECTED SCREEN ─────────────────────── */}
      {step === "rejected" && (
        <div className="text-center space-y-4 py-1">
          <div className="w-13 h-13 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <XCircle size={26} />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900">Application Not Approved</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
              Your vendor partner application could not be approved.
            </p>
          </div>

          {rejectionReason && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-900">
              <p className="font-bold text-red-950 mb-0.5">Admin Feedback:</p>
              <p className="text-red-800 leading-relaxed">{rejectionReason}</p>
            </div>
          )}

          <div className="pt-1 space-y-2.5">
            <a
              href="mailto:support@intrihub.com"
              className="w-full py-2.5 px-4 bg-[#052a51] hover:bg-[#031d38] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Headphones size={15} />
              <span>Contact Partner Support</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setErrorMessage("");
              }}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      )}

      {/* Vendor Partner Application Prompt */}
      {portalMode === "vendor" && step === "email" && (
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Not a registered vendor yet?{" "}
            <Link
              href="/vendor/apply"
              className="font-bold text-[#F26522] hover:underline"
            >
              Apply as a Vendor Partner →
            </Link>
          </p>
        </div>
      )}
    </AuthPortalShell>
  );
}
