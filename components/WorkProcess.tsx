"use client";

import { motion } from "framer-motion";
import { Phone, MapPin, FileText, Wrench, CheckCircle } from "lucide-react";
import SectionHeader from "./SectionHeader";

const steps = [
  {
    number: "01",
    title: "Contact Us",
    icon: Phone,
  },
  {
    number: "02",
    title: "Free Site Visit",
    icon: MapPin,
  },
  {
    number: "03",
    title: "Quotation",
    icon: FileText,
  },
  {
    number: "04",
    title: "Installation",
    icon: Wrench,
  },
  {
    number: "05",
    title: "Project Handover",
    icon: CheckCircle,
  }
];

export default function WorkProcess() {
  return (
    <section className="py-[80px] bg-white min-h-0 flex flex-col justify-center overflow-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        {/* Header */}
        <SectionHeader 
          label="OUR PROCESS"
          heading={<>How We <span className="text-[#F26522]">Work</span></>}
          caption="A premium tiling experience that is entirely hassle-free from start to finish."
        />

        {/* Timeline */}
        <div className="relative w-full mt-12 md:mt-24">
          
          {/* Desktop SVG Wave connecting line */}
          <div className="hidden lg:block absolute top-[48px] left-0 right-0 h-[100px] z-0">
            <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F26522" stopOpacity="0" />
                  <stop offset="20%" stopColor="#F26522" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="80%" stopColor="#F26522" />
                  <stop offset="100%" stopColor="#F26522" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M 100 50 C 150 0, 250 100, 300 50 C 350 0, 450 100, 500 50 C 550 0, 650 100, 700 50 C 750 0, 850 100, 900 50" 
                fill="none" 
                stroke="#E5E7EB" 
                strokeWidth="2" 
              />
              <motion.path 
                d="M 100 50 C 150 0, 250 100, 300 50 C 350 0, 450 100, 500 50 C 550 0, 650 100, 700 50 C 750 0, 850 100, 900 50" 
                fill="none" 
                stroke="url(#glowGradient)" 
                strokeWidth="4" 
                style={{ filter: "drop-shadow(0 0 6px rgba(242,101,34,0.4))" }}
                initial={{ pathLength: 0.2, pathSpacing: 1, pathOffset: 0 }}
                animate={{ pathOffset: [0, 1] }}
                transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}
              />
            </svg>
          </div>

          {/* Mobile connecting line (vertical) */}
          <div className="block lg:hidden absolute left-[20px] top-[40px] bottom-[40px] w-[2px] bg-[#E5E7EB] z-0 -translate-x-1/2 overflow-hidden">
            <motion.div 
              className="w-full bg-gradient-to-b from-transparent via-[#F26522] to-transparent"
              style={{ height: '25%' }}
              animate={{ y: ['-100%', '400%'] }}
              transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}
            />
          </div>

          {/* Steps Container */}
          <div className="flex flex-col lg:grid lg:grid-cols-5 gap-12 lg:gap-4 relative z-10">
            
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const peak = (idx * 0.2) + 0.1; 
              
              // Keyframes for the active effect synchronized with the wave
              const times = [0, Math.max(0, peak - 0.08), peak, Math.min(1, peak + 0.08), 1];

              return (
                <div
                  key={idx}
                  className="flex flex-row lg:flex-col items-center lg:items-center lg:text-center relative group w-full lg:w-auto"
                >
                  {/* Number Badge */}
                  <motion.div 
                    animate={{ 
                      backgroundColor: ["#052a51", "#052a51", "#F26522", "#052a51", "#052a51"],
                      boxShadow: [
                        "0px 0px 0px rgba(242,101,34,0)", 
                        "0px 0px 0px rgba(242,101,34,0)", 
                        "0px 0px 15px rgba(242,101,34,0.6)", 
                        "0px 0px 0px rgba(242,101,34,0)", 
                        "0px 0px 0px rgba(242,101,34,0)"
                      ]
                    }}
                    transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, times }}
                    className="w-10 h-10 lg:w-8 lg:h-8 rounded-full text-white flex items-center justify-center font-bold text-base lg:text-sm mb-0 lg:mb-6 mr-6 lg:mr-0 group-hover:bg-[#F26522] transition-colors relative z-10 shrink-0 shadow-sm"
                  >
                    {step.number}
                  </motion.div>
                  
                  {/* Icon Card & Title Wrapper */}
                  <div className="flex flex-col items-start lg:items-center flex-1">
                    {/* Icon Card */}
                    <motion.div 
                      animate={{ 
                        scale: [1, 1, 1.1, 1, 1],
                        borderColor: ["#f9fafb", "#f9fafb", "#F26522", "#f9fafb", "#f9fafb"],
                        boxShadow: [
                          "0 8px 20px rgba(0,0,0,0.04)", 
                          "0 8px 20px rgba(0,0,0,0.04)", 
                          "0 12px 30px rgba(242,101,34,0.15)", 
                          "0 8px 20px rgba(0,0,0,0.04)", 
                          "0 8px 20px rgba(0,0,0,0.04)"
                        ]
                      }}
                      transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, times }}
                      className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-[16px] lg:rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.04)] border-2 border-gray-50 flex items-center justify-center mb-0 lg:mb-5 text-[#052a51] group-hover:border-[#F26522] group-hover:text-[#F26522] group-hover:-translate-y-1.5 transition-all duration-300 relative z-10 cursor-pointer shrink-0"
                    >
                      <Icon className="w-7 h-7 lg:w-8 lg:h-8" />
                    </motion.div>

                    {/* Title */}
                    <h3 className="font-bold text-[#052a51] text-lg lg:text-[17px] mt-4 lg:mt-0 group-hover:text-[#F26522] transition-colors">
                      {step.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
