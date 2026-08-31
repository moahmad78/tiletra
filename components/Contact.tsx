"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  Clock,
  Building,
  ArrowRight,
  MessageCircle,
  User,
  Headphones,
  Cpu,
  Truck,
  PackageCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useQuoteModal } from "@/components/QuoteModalProvider";
import { CONTACT_PERSONS, CORE_DEPARTMENTS } from "@/lib/data/contacts";
import SectionHeader from "./SectionHeader";

const SUPPORT_CATEGORIES = [
  "Urgent Site Delivery Issue",
  "Damaged / Transit Breakage Claim",
  "Bulk Project / Contractor Quotation",
  "Vendor / Manufacturer Onboarding",
  "Product Specs & Calculator Inquiry",
  "General Support",
];

export default function Contact() {
  const { openModal } = useQuoteModal();
  const [selectedCategory, setSelectedCategory] = useState(SUPPORT_CATEGORIES[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error("Please fill in your name, contact number, and message.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Inquiry received! Our Bangalore support team will reach out within 15 minutes.");
    }, 800);
  };

  return (
    <section id="contact" className="py-12 md:py-16 bg-[#02152b] text-white">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] space-y-12">
        <SectionHeader
          label="DIRECT ESCALATION"
          heading={<>Direct Helplines & <span className="text-[#F26522]">Support Desks</span></>}
          caption="Connect with our operations center, product experts, or executive leadership with guaranteed response times."
          light={true}
        />

        {/* ── 1. Top Hero Cards: WhatsApp Fast Track & Direct CEO Desk ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: WhatsApp Quick Order Desk */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border border-emerald-500/30 flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#1E9E6B] flex items-center justify-center border border-emerald-500/40">
                <MessageCircle size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block">
                ⚡ Fastest Channel (&lt; 5 Mins)
              </span>
              <h3 className="text-lg font-black text-white">WhatsApp Quick Order Desk</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                Send room dimensions, site photos, or BOM material lists for instant quote estimation and dispatch.
              </p>
            </div>

            <a
              href="https://wa.me/919264920211?text=Hi%20Intrihub,%20I%20need%20urgent%20building%20materials%20for%20my%20site."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 bg-[#1E9E6B] hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <MessageCircle size={15} />
              <span>Chat on WhatsApp (+91 92649 20211)</span>
            </a>
          </motion.div>

          {/* Card 2: Operations & Logistics Desk */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-[#052a51]/70 to-[#0a3e74]/40 border border-white/10 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F26522]/20 text-[#F26522] flex items-center justify-center border border-[#F26522]/30">
                <Truck size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522] bg-[#F26522]/10 px-2.5 py-0.5 rounded-full inline-block">
                60-Minute Site Dispatch
              </span>
              <h3 className="text-lg font-black text-white">Operations & Logistics Desk</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                Live truck tracking, delivery rescheduling, or ground-floor staging coordination across Bengaluru.
              </p>
            </div>

            <a
              href="tel:+919198035803"
              className="w-full h-11 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Phone size={14} className="text-[#F26522]" />
              <span>Call Dispatch (+91 91980 35803)</span>
            </a>
          </motion.div>

          {/* Card 3: Founder & CEO Escalation Desk */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 to-amber-900/20 border border-amber-500/30 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full inline-block">
                Executive Desk (Sahil Sheikh)
              </span>
              <h3 className="text-lg font-black text-white">Founder Escalation</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                Direct hotline for enterprise contractor partnerships, critical resolution, or institutional inquiries.
              </p>
            </div>

            <a
              href="mailto:sahil@intrihub.com"
              className="w-full h-11 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Mail size={14} className="text-amber-400" />
              <span>sahil@intrihub.com</span>
            </a>
          </motion.div>
        </div>

        {/* ── 2. Two-Column Layout: Structured Inquiry Form & HQ Office Info ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Segmented Support Ticket Form */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#F26522]">
                Submit Support Request
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                How Can Our Operations Team Assist You?
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Select your inquiry category for direct routing to the appropriate department head.
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#1E9E6B] text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-lg font-black text-white">Inquiry Received Successfully</h4>
                <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. Our dedicated department manager has been notified and will contact you at <strong>{phone}</strong> within 15 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setMessage("");
                    setOrderId("");
                  }}
                  className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection Chips */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-2">
                    Inquiry Category *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUPPORT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer border ${
                          selectedCategory === cat
                            ? "bg-[#F26522] text-white border-[#F26522] shadow-xs"
                            : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full h-11 px-3.5 bg-white/5 border border-white/15 rounded-xl text-sm font-medium text-white placeholder:text-neutral-500 focus:bg-white/10 focus:outline-none focus:border-[#F26522]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      required
                      className="w-full h-11 px-3.5 bg-white/5 border border-white/15 rounded-xl text-sm font-medium text-white placeholder:text-neutral-500 focus:bg-white/10 focus:outline-none focus:border-[#F26522]"
                    />
                  </div>
                </div>

                {/* Email & Order ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-11 px-3.5 bg-white/5 border border-white/15 rounded-xl text-sm font-medium text-white placeholder:text-neutral-500 focus:bg-white/10 focus:outline-none focus:border-[#F26522]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Order ID / Tracking # (If applicable)
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. ORD-84729"
                      className="w-full h-11 px-3.5 bg-white/5 border border-white/15 rounded-xl text-sm font-medium text-white placeholder:text-neutral-500 focus:bg-white/10 focus:outline-none focus:border-[#F26522]"
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Requirement / Issue Details *
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your site location, material quantities, or specific support requirement..."
                    required
                    className="w-full p-3.5 bg-white/5 border border-white/15 rounded-xl text-sm font-medium text-white placeholder:text-neutral-500 focus:bg-white/10 focus:outline-none focus:border-[#F26522] resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  <span>Submit Inquiry to Operations Team</span>
                </button>
              </form>
            )}
          </div>

          {/* Right 5 Columns: Registered HQ & Core Hours */}
          <div className="lg:col-span-5 space-y-4">
            {/* Headquarters Card */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-primary/30 text-white flex items-center justify-center">
                  <Building size={20} className="text-[#F26522]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">Registered Head Office</h4>
                  <p className="text-neutral-400 text-xs">Bengaluru Central Operations HQ</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                <p className="leading-relaxed">
                  <strong>IntriHub QuickCommerce Private Limited</strong><br />
                  41, 10th A Cross Rd, Janapriya Layout, Begur,<br />
                  Bengaluru, Karnataka 560114, India
                </p>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#F26522]" />
                    <span>Operating Hours: <strong>Mon – Sat: 8:00 AM – 8:00 PM</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-[#1E9E6B]" />
                    <span>Dispatch Operations: <strong>7 Days a Week</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-blue-400" />
                    <span>General Desk: <strong>info@intrihub.com</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Contacts List */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Headphones size={16} className="text-[#F26522]" />
                <span>Department Direct Directory</span>
              </h4>

              <div className="space-y-2.5 pt-1">
                {CORE_DEPARTMENTS.map((dept) => (
                  <div
                    key={dept.department}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white leading-tight">{dept.department}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{dept.lead}</p>
                    </div>
                    <a
                      href={`mailto:${dept.email}`}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#F26522] text-white text-[11px] font-bold transition-colors"
                    >
                      {dept.email}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
