"use client";

import React, { useState } from "react";
import {
  Headphones,
  X,
  Phone,
  MessageSquare,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Clock,
  ExternalLink,
  Store,
} from "lucide-react";
import Link from "next/link";

interface AuthSupportWidgetProps {
  portalType?: "admin" | "vendor" | "general";
}

const FAQS = [
  {
    q: "Why am I not receiving my 6-digit OTP code?",
    a: "Verification emails arrive within 10–30 seconds. Please check your Spam / Promotions folder. If still not received, wait for the 60-second timer to expire and tap 'Resend OTP'.",
  },
  {
    q: "How can I register as a new Vendor Partner?",
    a: "If you are a manufacturer, distributor, or shop owner, tap 'Apply as a Vendor Partner' on the login screen or visit intrihub.com/vendor/apply. Our onboarding team reviews and activates your account within 24–48 hours.",
  },
  {
    q: "Why does my vendor login say 'Application Under Review'?",
    a: "New vendor registrations undergo standard business verification (GSTIN, bank account, and warehouse location). Once approved, you will receive an activation email and can log in instantly.",
  },
  {
    q: "Who can log in to the Super Admin Portal?",
    a: "The Super Admin portal is strictly restricted to authorized Intrihub personnel (admin@intrihub.com). Unauthorized login attempts are automatically blocked.",
  },
  {
    q: "What should I do if my account is locked?",
    a: "For system security, entering incorrect credentials 3 times triggers a 15-minute temporary IP lockout. Please wait for the lockout timer to expire, or reach out to our partner support desk.",
  },
];

export default function AuthSupportWidget({ portalType = "general" }: AuthSupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      {/* ── FLOATING CORNER BUTTON ────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#052a51] hover:bg-[#031d38] text-white rounded-full shadow-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Customer & Partner Support"
        >
          <div className="relative">
            <Headphones size={18} className="text-[#F26522] group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#052a51] animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">
            Support & Help
          </span>
        </button>
      </div>

      {/* ── SUPPORT MODAL DRAWER ───────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#052a51] to-[#0a4275] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#F26522]">
                  <Headphones size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-snug">
                    Intrihub Help & Support
                  </h3>
                  <p className="text-xs text-blue-200/80">
                    24/7 Merchant, Vendor & Admin Assistance
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Quick Contact Cards */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                  Direct Contact Channels
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <a
                    href="tel:+919264920211"
                    className="p-3.5 rounded-2xl bg-gray-50 hover:bg-blue-50/50 border border-gray-200/80 hover:border-blue-200 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#052a51] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Support Hotline</p>
                      <p className="text-xs font-bold text-gray-900">+91 92649 20211</p>
                    </div>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/919264920211?text=Hello%20Intrihub%20Support,%20I%20need%20help%20with%20Portal%20Login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-[#25D366]/5 hover:bg-[#25D366]/10 border border-[#25D366]/30 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 font-semibold">WhatsApp Chat</p>
                      <p className="text-xs font-bold text-gray-900">+91 92649 20211</p>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:support@intrihub.com"
                    className="p-3.5 rounded-2xl bg-gray-50 hover:bg-orange-50/50 border border-gray-200/80 hover:border-orange-200 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F26522] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email Desk</p>
                      <p className="text-xs font-bold text-gray-900">support@intrihub.com</p>
                    </div>
                  </a>

                  {/* Operating Hours */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Support Hours</p>
                      <p className="text-xs font-bold text-gray-900">Mon–Sat (9 AM – 8 PM)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQs Accordion */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle size={16} className="text-[#052a51]" />
                  <p className="text-xs font-black text-gray-700 uppercase tracking-wider">
                    Frequently Asked Questions (FAQ)
                  </p>
                </div>

                <div className="space-y-2">
                  {FAQS.map((faq, idx) => {
                    const isExpanded = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-2xl overflow-hidden transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(idx)}
                          className="w-full p-3.5 text-left text-xs font-bold text-gray-800 flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100/80 transition-colors cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          {isExpanded ? (
                            <ChevronUp size={16} className="shrink-0 text-gray-500" />
                          ) : (
                            <ChevronDown size={16} className="shrink-0 text-gray-500" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-3.5 text-xs text-gray-600 bg-white leading-relaxed border-t border-gray-100">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Links */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <Link
                  href="/vendor/apply"
                  className="font-bold text-[#F26522] hover:underline flex items-center gap-1"
                >
                  <Store size={13} />
                  <span>Apply as Vendor</span>
                </Link>
                <div className="flex items-center gap-3 text-gray-400">
                  <Link href="/privacy-policy" className="hover:text-gray-700">Privacy</Link>
                  <span>•</span>
                  <Link href="/terms" className="hover:text-gray-700">Terms</Link>
                  <span>•</span>
                  <Link href="/shipping-policy" className="hover:text-gray-700">Shipping</Link>
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 bg-[#052a51] hover:bg-[#031d38] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Support
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
