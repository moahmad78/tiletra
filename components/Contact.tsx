"use client";

import { motion } from "framer-motion";
import { Phone, Mail, Clock, MapPin, Building, ArrowRight } from "lucide-react";
import { useQuoteModal } from "@/components/QuoteModalProvider";
import SectionHeader from "./SectionHeader";

export default function Contact() {
  const { openModal } = useQuoteModal();
  return (
    <section id="contact" className="py-[80px] bg-[#02152b] flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        <SectionHeader
          label="CONTACT US"
          heading={<>Contact <span className="text-[#F26522]">Us</span></>}
          caption="Reach out today to schedule your free site visit and receive a transparent quotation."
          light={true}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-6">
          <div className="lg:pr-10">

            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-5"
              >
                <div className="w-14 h-14 bg-primary/20 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1 text-white">Call Us Directly</h4>
                  <p className="text-gray-400 hover:text-white transition-colors text-lg"><a href="tel:+917870935277">+91 78709 35277</a></p>
                  <p className="text-sm text-gray-500 mt-1">Available for WhatsApp messages</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-5"
              >
                <div className="w-14 h-14 bg-primary/20 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1 text-white">Email Us</h4>
                  <p className="text-gray-400 hover:text-white transition-colors text-lg"><a href="mailto:vishalpoddar393@gmail.com">vishalpoddar393@gmail.com</a></p>
                  <p className="text-sm text-gray-500 mt-1">We typically reply within 2 hours</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-5"
              >
                <div className="w-14 h-14 bg-primary/20 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                  <Building size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1 text-white">Visit Our Office</h4>
                  <p className="text-gray-400 font-medium">Tiletra - Vishal Poddar</p>
                  <p className="text-gray-400 leading-relaxed mt-1">
                    41, 10th A Cross Rd, Janapriya Layout<br />
                    Classic Paradise Layout, Begur<br />
                    Bengaluru, Karnataka 560114
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-10 md:p-14 rounded-[32px] shadow-2xl text-center flex flex-col justify-center items-center border border-gray-100 relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F26522]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-8 text-primary">
              <Clock size={40} className="text-[#F26522]" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-[#052a51]">Ready to Start?</h3>
            <p className="text-gray-500 mb-10 text-lg max-w-sm leading-relaxed">
              Book your free site visit today. Our experts will arrive at your location and provide a transparent, detailed quotation.
            </p>
            
            <button 
              onClick={openModal}
              className="w-full sm:w-auto px-10 py-5 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:shadow-[0_12px_25px_rgba(242,101,34,0.4)] hover:-translate-y-1 transition-all duration-300 relative z-10"
            >
              Get Free Quote <ArrowRight size={20} />
            </button>
            <p className="text-center text-sm text-gray-400 mt-6 font-medium uppercase tracking-wide">No commitment required</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
