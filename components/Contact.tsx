"use client";

import { motion } from "framer-motion";
import { Phone, Mail, Clock, Building, ArrowRight, MessageCircle, User } from "lucide-react";
import { useQuoteModal } from "@/components/QuoteModalProvider";
import { CONTACT_PERSONS } from "@/lib/data/contacts";
import SectionHeader from "./SectionHeader";

export default function Contact() {
  const { openModal } = useQuoteModal();

  return (
    <section id="contact" className="py-[60px] md:py-[80px] bg-[#02152b] flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        <SectionHeader
          label="CONTACT US"
          heading={<>Contact & <span className="text-[#F26522]">Helpline</span></>}
          caption="Reach out directly to our team for sales inquiries, order updates, or to schedule a free site visit."
          light={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mt-8">
          {/* Left Column: Helplines & Office Info */}
          <div className="space-y-8">
            {/* 3 Contact Persons List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/20 text-[#F26522] flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Direct Helpline Numbers</h3>
                  <p className="text-gray-400 text-xs">Call or WhatsApp any of our team members directly</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {CONTACT_PERSONS.map((person, idx) => (
                  <div
                    key={person.tel}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-[#F26522]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 text-gray-300 flex items-center justify-center shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm leading-tight">{person.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{person.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Click to call button */}
                      <a
                        href={`tel:${person.tel}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#052a51] hover:bg-[#07386d] text-white text-xs font-bold transition-colors border border-white/10 shadow-2xs"
                      >
                        <Phone size={12} className="text-[#F26522]" />
                        <span>{person.phone}</span>
                      </a>

                      {/* Direct WhatsApp button */}
                      <a
                        href={person.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Chat with ${person.name} on WhatsApp`}
                        className="w-8 h-8 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white flex items-center justify-center transition-all border border-emerald-500/30"
                      >
                        <MessageCircle size={15} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Email & Office Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Email Us</h4>
                  <a
                    href="mailto:hello@intrihub.com"
                    className="text-gray-300 hover:text-[#F26522] transition-colors text-xs font-medium block mt-1"
                  >
                    hello@intrihub.com
                  </a>
                  <p className="text-[11px] text-gray-500 mt-1">Replies within 2 hours</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                  <Building size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Visit Our Office</h4>
                  <p className="text-gray-300 text-xs font-medium mt-1">Intrihub Supply HQ</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                    Begur, Bengaluru, Karnataka 560114
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Site Visit & Quote Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl text-center flex flex-col justify-center items-center border border-gray-100 relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F26522]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="w-16 h-16 bg-[#F26522]/10 rounded-2xl flex items-center justify-center mb-6 text-[#F26522]">
              <Clock size={32} />
            </div>
            <h3 className="text-2xl md:text-3xl font-black mb-3 text-[#052a51]">Ready to Build?</h3>
            <p className="text-gray-500 mb-8 text-sm md:text-base max-w-md leading-relaxed">
              Book your free site visit today. Our experts will arrive at your location and provide a transparent, wholesale quotation tailored to your architectural plans.
            </p>

            <button
              onClick={openModal}
              className="w-full sm:w-auto px-8 py-4 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:shadow-[0_12px_25px_rgba(242,101,34,0.4)] hover:-translate-y-0.5 transition-all duration-300 relative z-10 cursor-pointer active:scale-98"
            >
              Get Free Quote <ArrowRight size={18} />
            </button>
            <p className="text-center text-xs text-gray-400 mt-4 font-medium uppercase tracking-wide">
              No commitment required • Free Site Consultation
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
