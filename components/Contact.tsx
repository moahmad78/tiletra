"use client";

import { motion } from "framer-motion";
import { Phone, Mail, Clock, Building, ArrowRight, MessageCircle, User, Headphones, Cpu, Truck, PackageCheck, HelpCircle } from "lucide-react";
import { useQuoteModal } from "@/components/QuoteModalProvider";
import { CONTACT_PERSONS, CORE_DEPARTMENTS } from "@/lib/data/contacts";
import SectionHeader from "./SectionHeader";

export default function Contact() {
  const { openModal } = useQuoteModal();

  return (
    <section id="contact" className="py-[60px] md:py-[80px] bg-[#02152b] flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        <SectionHeader
          label="CONTACT US"
          heading={<>Contact & <span className="text-[#F26522]">Helpline</span></>}
          caption="Reach out directly to our leadership and core department teams for inquiries, logistics, or custom quotations."
          light={true}
        />

        {/* Top Direct Reach Out Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#F26522]/20 text-[#F26522] flex items-center justify-center shrink-0 border border-[#F26522]/30">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">General Inquiries & Support</p>
                <a
                  href="mailto:info@intrihub.com"
                  className="text-white font-bold text-base hover:text-[#F26522] transition-colors"
                >
                  info@intrihub.com
                </a>
              </div>
            </div>
            <a
              href="mailto:info@intrihub.com"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors shrink-0"
            >
              Write to Us
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Headphones size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Direct Helpline</p>
                <p className="text-white font-bold text-sm sm:text-base">
                  Available inside the Intrihub portal
                </p>
              </div>
            </div>
            <a
              href="#helplines"
              className="px-3.5 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold transition-colors shrink-0"
            >
              View Channels
            </a>
          </div>
        </motion.div>

        {/* Core Departments Grid */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span>Core Department Desks</span>
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">Route your query directly to the executive department head</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CORE_DEPARTMENTS.map((dept, idx) => {
              const icons = [Cpu, Truck, PackageCheck];
              const Icon = icons[idx % icons.length];

              return (
                <motion.div
                  key={dept.department}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {dept.role.split("|")[0]}
                      </span>
                    </div>

                    <h4 className="text-white font-bold text-base">{dept.department}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{dept.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium">Department Head</p>
                      <p className="text-xs font-bold text-gray-200">{dept.lead}</p>
                    </div>
                    <a
                      href={`mailto:${dept.email}`}
                      className="px-3 py-1.5 rounded-lg bg-[#052a51] hover:bg-[#07386d] text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
                    >
                      <Mail size={12} className="text-[#F26522]" />
                      <span>{dept.email}</span>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 2 Columns: Contact Persons List & Site Visit Quote Card */}
        <div id="helplines" className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-10">
          {/* Left Column: Direct Helpline Persons */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/20 text-[#F26522] flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Direct Phone & WhatsApp Helplines</h3>
                  <p className="text-gray-400 text-xs">Direct escalation and dedicated assistance</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {CONTACT_PERSONS.map((person) => (
                  <div
                    key={person.tel}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-[#F26522]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 text-gray-300 flex items-center justify-center shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold text-sm leading-tight">{person.name}</h4>
                          {person.isFounder && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F26522] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                              Founder & CEO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{person.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${person.tel}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#052a51] hover:bg-[#07386d] text-white text-xs font-bold transition-colors border border-white/10 shadow-2xs"
                      >
                        <Phone size={12} className="text-[#F26522]" />
                        <span>{person.phone}</span>
                      </a>

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

            {/* Office Address */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                <Building size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Central Operations Hub</h4>
                <p className="text-gray-300 text-xs font-medium mt-1">Intrihub Supply HQ</p>
                <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                  41, 10th A Cross Rd, Janapriya Layout, Begur, Bengaluru, Karnataka 560114
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Site Visit & Quote Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl text-center flex flex-col justify-center items-center border border-gray-100 relative overflow-hidden"
          >
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
