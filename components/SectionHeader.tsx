"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  label: string;
  heading: ReactNode;
  caption?: string;
  className?: string;
  light?: boolean;
}

export default function SectionHeader({ label, heading, caption, className = "", light = false }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-0 w-full mb-[40px] ${className}`}>
      {/* Left Side (55%) */}
      <div className="w-full lg:w-[55%]">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="uppercase tracking-[0.3em] text-[13px] md:text-[14px] font-[600] text-[#F26522] mb-[12px] block"
        >
          {label}
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className={`text-[32px] md:text-[42px] lg:text-[56px] font-[800] tracking-tight leading-[1.1] ${light ? "text-white" : "text-[#052a51]"}`}
        >
          {heading}
        </motion.h2>
      </div>

      {/* Right Side (45%) */}
      {caption && (
        <div className="w-full lg:w-[45%] flex lg:justify-start">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-[420px]"
          >
            <p className={`text-[18px] leading-[1.7] ${light ? "text-white/80" : "text-[#64748B]"}`}>
              {caption}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
