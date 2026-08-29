"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  X,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Store,
  FileQuestion,
  Users,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CONTACT_PERSONS, LEADERSHIP_TEAM } from "@/lib/data/contacts";

const FAQS = [
  {
    q: "How do I track my order status?",
    a: "Go to your Account > Orders section or contact our delivery desk directly on WhatsApp with your Order ID for real-time dispatch updates.",
  },
  {
    q: "How can I register as a Vendor / Seller?",
    a: "Visit intrihub.com/vendor/apply or tap 'Apply as Vendor' below. Fill in your business & GST details, and our onboarding team will activate your account within 24–48 hours.",
  },
  {
    q: "Do you offer bulk project discounts for Contractors & Architects?",
    a: "Yes! We offer wholesale project pricing and dedicated credit lines for architects, interior designers, and contractors. Tap the WhatsApp button to connect directly with our B2B team.",
  },
  {
    q: "I didn't receive my 6-digit login OTP code. What should I do?",
    a: "Please check your Spam / Promotions folder. If you still do not see it after 60 seconds, tap 'Resend OTP' or contact our support team on WhatsApp for immediate assistance.",
  },
  {
    q: "What are your delivery locations & timelines?",
    a: "We deliver directly to your construction or renovation site within 60 minutes across Bangalore with live GPS tracking, and rapid dispatch nationwide.",
  },
];

export default function FloatingCustomerSupport() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "team" | "faq">("quick");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const isStorefront = !pathname?.startsWith("/admin") && !pathname?.startsWith("/vendor");

  return (
    <>
      {/* ── FLOATING CORNER TRIGGER BUTTON ────────────────────────────────── */}
      <aside aria-label="Customer Support Widget" className={`fixed z-40 right-4 sm:right-6 transition-all duration-300 ${
        isStorefront ? "bottom-[74px] md:bottom-6" : "bottom-5 sm:bottom-6"
      }`}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative"
        >
          {/* Pulsing ring indicator */}
          <span className="absolute -inset-1 bg-gradient-to-r from-[#F26522] to-[#ff8c42] rounded-full blur-xs opacity-60 animate-pulse pointer-events-none" />

          <button
            type="button"
            id="floating-customer-support-btn"
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2.5 px-4 py-3 bg-[#052a51] hover:bg-[#031d38] text-white rounded-full shadow-[0_8px_30px_rgba(5,42,81,0.35)] border-2 border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer group select-none"
            aria-label="Customer Support and Contact Details"
          >
            <div className="relative flex items-center justify-center">
              <Headphones size={20} className="text-[#F26522] group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#052a51]"></span>
              </span>
            </div>

            <div className="flex flex-col items-start leading-none text-left">
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                Customer Support
              </span>
              <span className="text-[9.5px] font-semibold text-[#F26522]">
                Online 24/7 • Instant Help
              </span>
            </div>
          </button>
        </motion.div>
      </aside>

      {/* ── SUPPORT MODAL DRAWER / POPUP ──────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/65 backdrop-blur-xs">
            {/* Backdrop click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh] z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#052a51] via-[#083666] to-[#0a4275] p-5 sm:p-6 text-white relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#F26522] shadow-inner shrink-0">
                      <Headphones size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-black text-lg text-white leading-tight">
                          Intrihub Support Desk
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-blue-200/80 mt-0.5">
                        Direct Assistance for Customers, Vendors & Partners
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 mt-5 p-1 bg-white/10 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab("quick")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "quick"
                        ? "bg-white text-[#052a51] shadow-xs"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <Phone size={13} />
                    <span>Quick Contact</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("team")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "team"
                        ? "bg-white text-[#052a51] shadow-xs"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <Users size={13} />
                    <span>Key Contacts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("faq")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "faq"
                        ? "bg-white text-[#052a51] shadow-xs"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <FileQuestion size={13} />
                    <span>FAQs</span>
                  </button>
                </div>
              </div>

              {/* Modal Body Content */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
                {/* ── TAB 1: QUICK CONTACT CHANNELS ── */}
                {activeTab === "quick" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2.5">
                        Instant Communication Channels
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Central Phone Hotline */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 hover:border-blue-300 transition-all flex items-center justify-between group">
                          <a
                            href="tel:+919264920211"
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#052a51] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Phone size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-gray-500 font-medium truncate">Customer Hotline</p>
                              <p className="text-xs font-bold text-gray-900 truncate">+91 92649 20211</p>
                            </div>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard("+919264920211", "Customer Hotline")}
                            title="Copy number"
                            className="p-1.5 text-gray-400 hover:text-[#052a51] transition-colors rounded-lg hover:bg-gray-200"
                          >
                            {copiedText === "+919264920211" ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>

                        {/* WhatsApp Support Desk */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 hover:border-emerald-300 transition-all flex items-center justify-between group">
                          <a
                            href="https://wa.me/919264920211?text=Hello%20Intrihub%20Support,%20I%20need%20assistance."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <MessageSquare size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-emerald-800 font-semibold truncate">WhatsApp Chat</p>
                              <p className="text-xs font-bold text-gray-900 truncate">+91 92649 20211</p>
                            </div>
                          </a>
                          <span className="px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 rounded-md">
                            Instant
                          </span>
                        </div>

                        {/* Operations & Logistics Hotline */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 hover:border-blue-300 transition-all flex items-center justify-between group">
                          <a
                            href="tel:+919198035803"
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#083666] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Phone size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-gray-500 font-medium truncate">Operations & Dispatch</p>
                              <p className="text-xs font-bold text-gray-900 truncate">+91 91980 35803</p>
                            </div>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard("+919198035803", "Operations Hotline")}
                            title="Copy number"
                            className="p-1.5 text-gray-400 hover:text-[#052a51] transition-colors rounded-lg hover:bg-gray-200"
                          >
                            {copiedText === "+919198035803" ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>

                        {/* Customer Email */}
                        <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200/80 hover:border-orange-300 transition-all flex items-center justify-between group">
                          <a
                            href="mailto:support@intrihub.com"
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#F26522] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Mail size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-orange-800 font-semibold truncate">Customer Email</p>
                              <p className="text-xs font-bold text-gray-900 truncate">support@intrihub.com</p>
                            </div>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard("support@intrihub.com", "Support Email")}
                            title="Copy email"
                            className="p-1.5 text-gray-400 hover:text-[#F26522] transition-colors rounded-lg hover:bg-orange-100"
                          >
                            {copiedText === "support@intrihub.com" ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Location & Support Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#052a51]/10 text-[#052a51] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Head Office</p>
                          <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                            Begur, Bengaluru, Karnataka 560114, India
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center shrink-0 mt-0.5">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Service Hours</p>
                          <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                            Mon–Sat: 9:00 AM – 8:00 PM IST
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: KEY TEAM & DESKS ── */}
                {activeTab === "team" && (
                  <div className="space-y-3">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Department Leads & Desks
                    </p>

                    <div className="space-y-2.5">
                      {CONTACT_PERSONS.map((person, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 hover:border-blue-200 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-gray-900 truncate">
                                {person.name}
                              </p>
                              {person.isFounder && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#052a51] text-white">
                                  Founder
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {person.role}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-700 font-semibold mt-1.5 flex-wrap">
                              <a
                                href={`tel:${person.tel}`}
                                className="text-[#052a51] hover:underline flex items-center gap-1"
                              >
                                <Phone size={11} />
                                <span>{person.phone}</span>
                              </a>
                              {person.email && (
                                <a
                                  href={`mailto:${person.email}`}
                                  className="text-gray-500 hover:text-gray-900 hover:underline flex items-center gap-1"
                                >
                                  <Mail size={11} />
                                  <span>{person.email}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          <a
                            href={person.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: FAQS ── */}
                {activeTab === "faq" && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Frequently Asked Questions
                    </p>

                    <div className="space-y-2">
                      {FAQS.map((faq, idx) => {
                        const isExpanded = openFaqIndex === idx;
                        return (
                          <div
                            key={idx}
                            className="border border-gray-200/90 rounded-2xl overflow-hidden transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(isExpanded ? null : idx)}
                              className="w-full p-3.5 text-left text-xs font-bold text-gray-800 flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100/80 transition-colors cursor-pointer"
                            >
                              <span>{faq.q}</span>
                              {isExpanded ? (
                                <ChevronUp size={15} className="shrink-0 text-gray-500" />
                              ) : (
                                <ChevronDown size={15} className="shrink-0 text-gray-500" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="p-3.5 text-xs text-gray-600 bg-white leading-relaxed border-t border-gray-100 animate-in fade-in">
                                {faq.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Navigation Footer inside Modal */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <Link
                    href="/vendor/apply"
                    onClick={() => setIsOpen(false)}
                    className="font-bold text-[#F26522] hover:underline flex items-center gap-1.5"
                  >
                    <Store size={14} />
                    <span>Apply as Vendor Partner</span>
                  </Link>

                  <div className="flex items-center gap-3 text-gray-400">
                    <Link href="/contact" onClick={() => setIsOpen(false)} className="hover:text-gray-700 font-semibold">Contact Page</Link>
                    <span>•</span>
                    <Link href="/faq" onClick={() => setIsOpen(false)} className="hover:text-gray-700 font-semibold">Help Center</Link>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Action Bar */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                <a
                  href="https://wa.me/919264920211?text=Hello%20Intrihub%20Team,%20I%20have%20an%20urgent%20query."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <MessageSquare size={15} />
                  <span>Start WhatsApp Chat</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
