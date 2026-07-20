"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Gem, IndianRupee, Clock, Sparkles, Target, Droplets, Smile } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function WhyChooseUs() {
  const features = [
    { title: "Experienced Team", icon: ShieldCheck },
    { title: "Premium Quality", icon: Gem },
    { title: "Transparent Pricing", icon: IndianRupee },
    { title: "On-Time Delivery", icon: Clock },
    { title: "Clean Workmanship", icon: Sparkles },
    { title: "Attention to Detail", icon: Target },
    { title: "Waterproof Install", icon: Droplets },
    { title: "100% Satisfaction", icon: Smile }
  ];

  return (
    <section className="py-[80px] bg-white flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        
        {/* TOP SECTION: Heading & Paragraph */}
        <SectionHeader
          label="WHY CHOOSE US"
          heading={<>Why Choose <span className="text-[#F26522]">Tiletra</span></>}
          caption="Flawless craftsmanship, transparent pricing, and punctual delivery for a premium finish."
        />

        {/* BOTTOM SECTION: Image & Grid */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          
          {/* LEFT SIDE (45%): Large Premium Image */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[45%] h-[420px] lg:h-[480px] rounded-[20px] overflow-hidden relative group shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
          >
            <img 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000" 
              alt="Premium tile installation craftsmanship"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1000"; }}
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </motion.div>

          {/* RIGHT SIDE (55%): Grid */}
          <div className="flex-1 w-full flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-[20px] lg:gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 h-[72px] px-4 rounded-[16px] bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-[#F26522]/50 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#052a51]/5 flex items-center justify-center shrink-0 group-hover:bg-[#F26522]/10 transition-colors">
                      <Icon className="text-[#052a51] group-hover:text-[#F26522] transition-colors" size={20} />
                    </div>
                    <span className="font-bold text-[#052a51] text-[14px] leading-tight">
                      {feature.title}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
