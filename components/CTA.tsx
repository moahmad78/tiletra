"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-br from-[#052a51] to-[#022046] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight"
        >
          Ready to Transform Your Space with Premium Tiles?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-indigo-100 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Book a Free Site Visit today. Our experts will assess your requirements and provide a highly competitive quotation with zero hidden charges.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <a href="#contact" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-primary rounded-full font-bold text-lg hover:bg-gray-50 transition-all duration-500 shadow-xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.15)] transform hover:-translate-y-1">
            Book Free Site Visit
            <ArrowRight size={20} />
          </a>
          <a href="tel:+917870935277" className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-transparent border border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-500">
            Call +91 78709 35277
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-indigo-100 font-medium"
        >
          <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-300" /> Fast Response</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-300" /> Professional Consultation</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-300" /> No Hidden Charges</span>
        </motion.div>
      </div>
    </section>
  );
}
