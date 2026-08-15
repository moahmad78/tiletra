"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, RotateCw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import { products } from "@/lib/data/products";
import { toast } from "sonner";

export default function LoginModal() {
  const router = useRouter();
  const { isLoginModalOpen, closeLoginModal, sendOtp, verifyOtp, googleSignIn, pendingIntent } =
    useAuthStore();
  const { addItem } = useCartStore();

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state on open/close
  useEffect(() => {
    if (!isLoginModalOpen) {
      setStep("phone");
      setPhone("");
      setOtp(["", "", "", ""]);
      setLoading(false);
      setTimer(30);
      setCanResend(false);
    }
  }, [isLoginModalOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== "otp") return;
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isLoginModalOpen) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    const res = await sendOtp(cleanPhone);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setStep("otp");
      setTimer(30);
      setCanResend(false);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } else {
      toast.error(res.message);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Paste handling
      const digits = val.slice(0, 4).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 4) newOtp[i] = d;
      });
      setOtp(newOtp);
      if (digits.length === 4) {
        verifyCode(digits.join(""));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit on 4th digit
    if (index === 3 && val) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 4) {
        verifyCode(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join("");
    if (code.length !== 4) {
      toast.error("Please enter all 4 digits");
      return;
    }

    setLoading(true);
    const res = await verifyOtp(phone, code);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);

      // Handle pending action intent
      if (pendingIntent) {
        if (pendingIntent.type === "checkout") {
          router.push("/checkout");
        } else if (pendingIntent.type === "buy_now") {
          const { productId, variantId, quantity } = pendingIntent.data;
          const foundProduct = products.find((p) => p.id === productId);
          if (foundProduct) {
            const foundVariant = foundProduct.variants.find((v) => v.id === variantId) || foundProduct.variants[0];
            addItem(foundProduct, foundVariant, quantity);
          }
          router.push("/checkout");
        }
      }
    } else {
      toast.error(res.message);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setTimer(30);
    const res = await sendOtp(phone);
    if (res.success) {
      toast.success("New OTP sent to +91 " + phone);
    }
  };

  const handleGoogleMock = () => {
    googleSignIn({
      name: "Mohammad Ahmad",
      email: "moahmad78@gmail.com",
    });
    toast.success("Signed in with Google!");
    if (pendingIntent?.type === "checkout" || pendingIntent?.type === "buy_now") {
      router.push("/checkout");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeLoginModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal / Bottom Sheet Container */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[440px] bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden border border-gray-100"
      >
        {/* Mobile Drag Indicator */}
        <div className="md:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header Branding Banner */}
        <div className="bg-gradient-to-br from-[#052a51] to-[#0a3869] text-white p-6 pt-7 md:pt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#F26522] text-[10px] font-black uppercase tracking-wider">
              Quick Checkout
            </span>
            <span className="text-xs text-white/70 font-semibold flex items-center gap-1">
              <ShieldCheck size={14} className="text-[#F26522]" /> Safe & Secure
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {step === "phone" ? "Login to Continue" : "Verify Phone Number"}
          </h2>
          <p className="text-xs text-white/75 mt-1 leading-relaxed">
            {step === "phone"
              ? "Enter your mobile number to view saved addresses, track orders, and complete your tile purchase."
              : `We sent a 4-digit code to +91 ${phone}`}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {step === "phone" ? (
            /* STEP 1: PHONE NUMBER INPUT */
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="flex rounded-2xl border-2 border-gray-200 focus-within:border-[#F26522] transition-colors overflow-hidden bg-gray-50 focus-within:bg-white">
                  <span className="flex items-center gap-1.5 px-3.5 bg-gray-100/80 text-xs font-black text-[#052a51] border-r border-gray-200 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit number"
                    autoFocus
                    className="w-full px-3.5 py-3.5 bg-transparent text-base font-bold text-[#052a51] placeholder-gray-400 focus:outline-none tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={phone.length !== 10 || loading}
                className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RotateCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200" />
                <span className="flex-shrink mx-4 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                  OR
                </span>
                <div className="flex-grow border-t border-gray-200" />
              </div>

              {/* Google One-Tap Sign In */}
              <button
                type="button"
                onClick={handleGoogleMock}
                className="w-full h-11 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-[#052a51] flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed mt-3">
                By continuing, you agree to Tiletra's{" "}
                <a href="/terms" className="text-[#052a51] underline font-semibold">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="text-[#052a51] underline font-semibold">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          ) : (
            /* STEP 2: 4-DIGIT OTP VERIFICATION */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#052a51]">
                  OTP sent to +91 {phone}
                </span>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-xs font-bold text-[#F26522] hover:underline"
                >
                  Edit Number
                </button>
              </div>

              {/* 4 OTP Inputs */}
              <div className="flex justify-between gap-3 my-2">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-14 h-14 text-center text-2xl font-black text-[#052a51] bg-gray-50 border-2 border-gray-200 focus:border-[#F26522] focus:bg-white rounded-2xl focus:outline-none transition-all shadow-2xs"
                  />
                ))}
              </div>

              {/* Demo Hint */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900 font-semibold">
                <Sparkles size={16} className="text-[#F26522] shrink-0" />
                <span>Quick Demo OTP: Enter <strong>1234</strong></span>
              </div>

              <button
                type="button"
                onClick={() => verifyCode()}
                disabled={otp.join("").length !== 4 || loading}
                className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <RotateCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Didn't receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold text-[#F26522] hover:underline"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span className="text-gray-400">Resend in {timer}s</span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
