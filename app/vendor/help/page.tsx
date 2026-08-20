"use client";

import { useState } from "react";
import {
  Headphones,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  ShieldCheck,
  CreditCard,
  Package,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  Send,
  CheckCircle2,
} from "lucide-react";
import { INTRIHUB_BRAND, buildWhatsAppShareUrl } from "@/lib/notifications/whatsapp-templates";
import { useVendorAuth } from "@/lib/vendor-auth";

const FAQS = [
  {
    q: "How do vendor order splits and payouts work?",
    a: "When a customer places an order containing items from your store, a separate Vendor Order Split is automatically created with your net earnings (Order Subtotal minus platform commission). Payouts are reconciled and disbursed to your registered bank account or UPI ID every Tuesday and Friday.",
  },
  {
    q: "How do I update stock or pause product listings?",
    a: "Navigate to 'My Products' or 'Inventory Stock' from the sidebar. You can update box quantities directly, or click Edit to toggle product status between Active, Paused, or Draft.",
  },
  {
    q: "What are the mandatory KYC legal documents?",
    a: "To ensure a secure marketplace and comply with financial regulations, all active vendors must submit a valid PAN Card (Personal or Company) and Aadhaar Card. GST Registration and Cancelled Cheque are also required for automated payout validation.",
  },
  {
    q: "What is the dispatch SLA for new orders?",
    a: "Vendors are expected to pack and mark orders as 'Dispatched' with valid courier tracking details within 24 to 48 business hours of order confirmation. For bulk or heavy freight, our logistics desk coordinates pickup directly from your warehouse.",
  },
  {
    q: "How can I contact my Dedicated Vendor Account Manager?",
    a: "You can reach out via WhatsApp at +91 78709 35277 or email info@intrihub.com with your Shop ID. Priority support is active from 9:30 AM to 7:30 PM IST (Monday to Saturday).",
  },
];

export default function VendorHelpPage() {
  const { vendor } = useVendorAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const whatsappText = `Hi Intrihub Seller Desk, I am reaching out regarding my vendor shop "${vendor?.businessName || "My Store"}" (ID: ${vendor?.id || "N/A"}). I need assistance with: `;
  const whatsappDeskUrl = `https://wa.me/917870935277?text=${encodeURIComponent(whatsappText)}`;

  const handleQuickInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    const fullText = `*Vendor Support Request*\n• Shop: ${vendor?.businessName || "My Store"}\n• Email: ${vendor?.contactEmail || "N/A"}\n• Subject: ${inquirySubject || "General Inquiry"}\n• Details: ${inquiryMessage}`;
    const url = `https://wa.me/917870935277?text=${encodeURIComponent(fullText)}`;
    window.open(url, "_blank");
    setSubmitted(true);
    setInquiryMessage("");
    setInquirySubject("");
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#052a51] via-[#0b3b6d] to-[#052a51] rounded-3xl p-6 md:p-10 text-white shadow-md border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#F26522]/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-emerald-400 backdrop-blur-xs">
            <Headphones size={14} />
            <span>Dedicated Seller Support Desk</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            How can we help your business today?
          </h1>

          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Get priority assistance with catalog uploads, KYC verification, payout reconciliation, or logistics fulfillment from the Intrihub seller support team.
          </p>
        </div>
      </div>

      {/* 4 Dedicated Executive & Department Support Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Founder & CEO Escalation Card */}
        <div className="bg-gradient-to-b from-amber-500/10 to-white rounded-3xl p-6 border-2 border-amber-500/30 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                Founder, CEO & CTO
              </span>
              <h3 className="font-black text-gray-900 text-base mt-1">Sahil Sheikh</h3>
              <p className="text-[11px] font-bold text-amber-700">Technology & CEO Escalation</p>
              <p className="text-xs text-gray-500 mt-1">
                Executive channel for platform architecture, critical disputes & policies.
              </p>
            </div>
            <div className="space-y-1 pt-1 text-xs font-semibold text-gray-700">
              <div className="p-2 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-[11px]">
                <span>+91 92649 20211</span>
                <span className="text-[10px] text-amber-700 font-extrabold uppercase">Direct</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate">sahil@intrihub.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={`https://wa.me/919264920211?text=${encodeURIComponent(`Hi Sahil Sheikh (Founder & CEO), I am reaching out regarding vendor store "${vendor?.businessName || "My Store"}" (ID: ${vendor?.id || "N/A"}). I need escalation support for: `)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>WhatsApp</span>
            </a>
            <a
              href="mailto:sahil@intrihub.com"
              className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* 2. COO Operations & Logistics Card (Gulshan) */}
        <div className="bg-gradient-to-b from-blue-500/10 to-white rounded-3xl p-6 border border-blue-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#052a51] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package size={24} />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-[#052a51] text-white text-[9px] font-black uppercase tracking-wider">
                Chief Operating Officer
              </span>
              <h3 className="font-black text-gray-900 text-base mt-1">Gulshan</h3>
              <p className="text-[11px] font-bold text-blue-700">Operations & Logistics Desk</p>
              <p className="text-xs text-gray-500 mt-1">
                Vendor relations, warehouse logistics, freight tracking & ground operations.
              </p>
            </div>
            <div className="space-y-1 pt-1 text-xs font-semibold text-gray-700">
              <div className="p-2 bg-white rounded-xl border border-blue-200 flex items-center justify-between text-[11px]">
                <span>+91 91980 35803</span>
                <span className="text-[10px] text-blue-700 font-extrabold uppercase">COO</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate">gulshan@intrihub.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={`https://wa.me/919198035803?text=${encodeURIComponent(`Hi Gulshan (COO), I am reaching out regarding vendor store "${vendor?.businessName || "My Store"}" (ID: ${vendor?.id || "N/A"}). I need assistance with logistics/operations: `)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#052a51] hover:bg-[#0a3e74] text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>WhatsApp</span>
            </a>
            <a
              href="mailto:gulshan@intrihub.com"
              className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* 3. CPO Product & Merchandising Card (Vishal Poddar) */}
        <div className="bg-gradient-to-b from-purple-500/10 to-white rounded-3xl p-6 border border-purple-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard size={24} />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider">
                Chief Product Officer
              </span>
              <h3 className="font-black text-gray-900 text-base mt-1">Vishal Poddar</h3>
              <p className="text-[11px] font-bold text-purple-700">Product & Catalog Merchandising</p>
              <p className="text-xs text-gray-500 mt-1">
                Catalog onboarding, product categorization, pricing approvals & quality benchmarks.
              </p>
            </div>
            <div className="space-y-1 pt-1 text-xs font-semibold text-gray-700">
              <div className="p-2 bg-white rounded-xl border border-purple-200 flex items-center justify-between text-[11px]">
                <span>+91 78709 35277</span>
                <span className="text-[10px] text-purple-700 font-extrabold uppercase">CPO</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate">vishal@intrihub.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={`https://wa.me/917870935277?text=${encodeURIComponent(`Hi Vishal Poddar (CPO), I am reaching out regarding vendor store "${vendor?.businessName || "My Store"}" (ID: ${vendor?.id || "N/A"}). I need assistance with products/catalog: `)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>WhatsApp</span>
            </a>
            <a
              href="mailto:vishal@intrihub.com"
              className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* 4. Central Support Desk */}
        <div className="bg-gradient-to-b from-orange-500/10 to-white rounded-3xl p-6 border border-orange-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F26522] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Headphones size={24} />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-[#F26522] text-white text-[9px] font-black uppercase tracking-wider">
                Central Helpdesk
              </span>
              <h3 className="font-black text-gray-900 text-base mt-1">General Support Desk</h3>
              <p className="text-[11px] font-bold text-[#F26522]">Live Seller Hotline</p>
              <p className="text-xs text-gray-500 mt-1">
                Fastest response for urgent order updates, bank payouts & KYC verification.
              </p>
            </div>
            <div className="space-y-1 pt-1 text-xs font-semibold text-gray-700">
              <div className="p-2 bg-white rounded-xl border border-orange-200 flex items-center justify-between text-[11px]">
                <span>+91 78709 35277</span>
                <span className="text-[10px] text-[#F26522] font-extrabold uppercase">Live</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate">info@intrihub.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={whatsappDeskUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>WhatsApp</span>
            </a>
            <a
              href={`mailto:${INTRIHUB_BRAND.supportEmail}?subject=Seller%20Support%20Request%20-%20${encodeURIComponent(vendor?.businessName || "")}`}
              className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Fast Support Ticket Message + FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Quick Message Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-2xs space-y-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F26522] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
              Instant Ticket
            </span>
            <h3 className="text-lg font-black text-gray-900 mt-2">Send Message to Support Desk</h3>
            <p className="text-xs text-gray-500 mt-1">
              Your inquiry will be routed directly with your shop metadata for immediate resolution.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
              <p className="font-bold text-sm text-emerald-900">Request Dispatched!</p>
              <p className="text-xs text-emerald-700">
                Opening WhatsApp chat with your account details attached.
              </p>
            </div>
          ) : (
            <form onSubmit={handleQuickInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Inquiry Topic
                </label>
                <select
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  required
                >
                  <option value="">Select a topic...</option>
                  <option value="KYC & Legal Documents Verification">KYC & Legal Documents Verification</option>
                  <option value="Bank Payout & Settlement Issue">Bank Payout & Settlement Issue</option>
                  <option value="New Order Fulfillment & Logistics">New Order Fulfillment & Logistics</option>
                  <option value="Product Listing & Catalog Approval">Product Listing & Catalog Approval</option>
                  <option value="Account Settings & Contact Change">Account Settings & Contact Change</option>
                  <option value="Other Assistance">Other Assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Describe Your Issue *
                </label>
                <textarea
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Provide order numbers, product names, or details of the issue..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={14} />
                <span>Send to WhatsApp Support</span>
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-500">
            <Clock size={14} className="text-[#F26522] shrink-0" />
            <span>Support Desk Active: Mon – Sat, 9:30 AM – 7:30 PM IST</span>
          </div>
        </div>

        {/* Vendor FAQ Accordion */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="text-[#F26522]" size={20} />
            <h3 className="text-lg font-black text-gray-900">Seller Knowledge Base & FAQs</h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-gray-200/80 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-gray-900">{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[#F26522]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-2 text-xs text-gray-600 leading-relaxed bg-white border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
