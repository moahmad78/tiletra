"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  Truck,
  CreditCard,
  RotateCcw,
  Building2,
  Store,
  HelpCircle,
  MessageCircle,
  PhoneCall,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useQuoteModal } from "@/components/QuoteModalProvider";

export interface FAQCategory {
  id: string;
  name: string;
  icon: React.ElementType;
}

export interface FAQItem {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
}

const FAQ_CATEGORIES: FAQCategory[] = [
  { id: "all", name: "All Questions", icon: HelpCircle },
  { id: "delivery", name: "60-Min Site Delivery", icon: Truck },
  { id: "orders", name: "Ordering & Payment", icon: CreditCard },
  { id: "returns", name: "Returns & Breakage", icon: RotateCcw },
  { id: "bulk", name: "Bulk & Contractor Desk", icon: Building2 },
  { id: "vendor", name: "Vendor Onboarding", icon: Store },
];

const INTRIHUB_FAQS: FAQItem[] = [
  // ── Delivery & Timing ──
  {
    id: "del-1",
    categoryId: "delivery",
    question: "How does 60-minute direct site delivery work in Bengaluru?",
    answer: "We operate dedicated micro-dark stores and direct tier-1 manufacturer fulfillment points positioned across North, South, East, and Central Bengaluru. Once an order is confirmed, our dispatch system assigns a specialized freight vehicle with live GPS tracking directly to your construction or renovation site.",
  },
  {
    id: "del-2",
    categoryId: "delivery",
    question: "What is your delivery radius and do you deliver outside Bengaluru?",
    answer: "Our express 60-minute service covers all major zones in Bengaluru (Begur, Whitefield, HSR Layout, Indiranagar, Electronic City, Yelahanka, Kanakapura Road, etc.). For Mysuru, Hyderabad, Chennai, and other cities across India, we dispatch heavy freight consignments arriving within 24 to 72 hours.",
  },
  {
    id: "del-3",
    categoryId: "delivery",
    question: "Is delivery free, or are there minimum order requirements?",
    answer: "Standard site delivery is 100% FREE for all orders above ₹15,000. For orders below this threshold, a flat weight-based logistics fee starting from ₹99 applies. Free delivery is automatically applied in your cart upon checkout.",
  },
  {
    id: "del-4",
    categoryId: "delivery",
    question: "Do you unload materials at the site?",
    answer: "Yes, our drivers drop off materials at curbside or ground floor staging areas. If your project requires manual labor to carry tiles or plywood to upper floors without elevator access, our dispatch team can coordinate on-site unloading labor upon request.",
  },

  // ── Ordering & Payment ──
  {
    id: "ord-1",
    categoryId: "orders",
    question: "How does the Smart Calculator on product pages work?",
    answer: "Our unit-aware calculator lives right on every product page. Simply input your room dimensions (length and width in feet or meters), and it instantly calculates the exact number of boxes, square footage, and pieces required, automatically applying a standard 10% cutting and wastage margin.",
  },
  {
    id: "ord-2",
    categoryId: "orders",
    question: "What payment methods are supported on IntriHub?",
    answer: "We accept all major payment methods via PCI-DSS 256-bit encrypted Razorpay: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) for verified site orders up to eligible limits.",
  },
  {
    id: "ord-3",
    categoryId: "orders",
    question: "Can I get a GST invoice for commercial input tax credit (ITC)?",
    answer: "Yes. During checkout or in your Account profile, enter your company name and 15-digit GSTIN. We issue automated B2B GST tax invoices with 100% valid Input Tax Credit (ITC) eligibility.",
  },

  // ── Returns & Breakage ──
  {
    id: "ret-1",
    categoryId: "returns",
    question: "What if tiles or delicate sanitaryware arrive broken or damaged?",
    answer: "We offer an unconditional Damage Protection Guarantee. Simply take clear photos or a short video of the damaged carton or tiles and WhatsApp them to our priority resolution desk at +91 78709 35277 within 48 hours of delivery. We immediately dispatch free priority replacement crates.",
  },
  {
    id: "ret-2",
    categoryId: "returns",
    question: "What is the return window for unused boxes?",
    answer: "Unopened, full boxes in their original manufacturer packaging can be returned within 7 calendar days of delivery. For site safety and batch control, opened or partially used boxes cannot be accepted.",
  },
  {
    id: "ret-3",
    categoryId: "returns",
    question: "How quickly are refunds processed?",
    answer: "Once returned boxes are received and verified at our warehouse, refunds are initiated back to your original payment mode (UPI, card, bank transfer) within 3 to 5 business days.",
  },

  // ── Bulk & Contractor Desk ──
  {
    id: "blk-1",
    categoryId: "bulk",
    question: "Do contractors, interior designers, and architects get trade pricing?",
    answer: "Yes. We offer tiered wholesale trade discounts on commercial volume orders. You can connect with our Trade Desk via WhatsApp (+91 92649 20211) or register for a Contractor Account to receive dedicated relationship management and custom quotes.",
  },
  {
    id: "blk-2",
    categoryId: "bulk",
    question: "Can I request physical tile or surface samples before placing a large order?",
    answer: "Yes! We provide free sample pieces and catalog swatches for architects, interior designers, and builders in Bengaluru. Book a free site consultation or sample request via our Helpline.",
  },

  // ── Vendor Onboarding ──
  {
    id: "ven-1",
    categoryId: "vendor",
    question: "How can manufacturers and distributors sell on IntriHub?",
    answer: "If you manufacture or distribute certified tiles, electrical, plumbing, sanitary, plywood, or hardware supplies, you can apply directly at intrihub.com/vendor/apply. Our vendor onboarding team will review your catalog and verify your warehouse within 24 to 48 hours.",
  },
  {
    id: "ven-2",
    categoryId: "vendor",
    question: "What are the payout terms for vendors?",
    answer: "Vendor payouts are processed on an automated weekly settlement cycle directly to your verified business bank account with detailed itemized remittance statements.",
  },
];

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openIdx, setOpenIdx] = useState<string | null>("del-1");
  const { openModal } = useQuoteModal();

  const filteredFaqs = useMemo(() => {
    return INTRIHUB_FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === "all" || faq.categoryId === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section id="faq" className="w-full space-y-8">
      {/* ── 1. Search & Category Filter Bar ── */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g., 60 minutes delivery, GST invoice, tile breakage, samples)..."
            className="w-full h-12 pl-11 pr-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FAQ_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === "all"
                ? INTRIHUB_FAQS.length
                : INTRIHUB_FAQS.filter((f) => f.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-[#052a51] text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <Icon size={14} className={isSelected ? "text-[#F26522]" : "text-neutral-500"} />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. FAQ Accordion List & Side Contact Card ── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left / Main Accordion Area */}
        <div className="w-full lg:flex-1 space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <h4 className="text-base font-bold text-[#052a51]">No matching questions found</h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                We couldn't find an exact answer for "{searchQuery}". You can chat with our team on WhatsApp for immediate guidance.
              </p>
              <a
                href={`https://wa.me/919264920211?text=Hi%20IntriHub,%20I%20have%20a%20question:%20${encodeURIComponent(
                  searchQuery
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E9E6B] text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle size={14} />
                <span>Ask on WhatsApp Desk</span>
              </a>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openIdx === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all duration-200 hover:border-[#F26522]/30"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none bg-white cursor-pointer gap-4"
                  >
                    <span className="font-bold text-xs sm:text-sm text-[#052a51] tracking-tight leading-snug">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-[#F26522] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-neutral-600 text-xs sm:text-sm leading-relaxed border-t border-neutral-100 pt-3 font-normal">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Right Sticky Help & Consultation Card */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-28 space-y-4">
          <div className="bg-gradient-to-br from-[#052a51] to-[#0a3e74] text-white rounded-3xl p-6 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#F26522] text-[11px] font-black uppercase tracking-wider border border-white/10">
              <Sparkles size={12} />
              <span>Direct Support</span>
            </div>

            <h3 className="text-lg font-black leading-tight text-white">
              Still Have Questions on Materials or Delivery?
            </h3>

            <p className="text-xs text-white/80 leading-relaxed font-medium">
              Our Bangalore engineering and operations team can assist with measurements, buffer estimations, or custom bulk pricing.
            </p>

            <div className="space-y-2.5 pt-2">
              <a
                href="https://wa.me/919264920211?text=Hi%20Intrihub,%20I%20need%20assistance%20with%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 bg-[#1E9E6B] hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                <MessageCircle size={15} />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href="tel:+919264920211"
                className="w-full h-11 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneCall size={14} className="text-[#F26522]" />
                <span>Call Helpline (+91 92649 20211)</span>
              </a>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-[11px] text-white/70 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#1E9E6B]" />
                <span>Free Site Visits across Bengaluru</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#F26522]" />
                <span>60-Minute GPS Tracked Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
