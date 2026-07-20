"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import SectionHeader from "./SectionHeader";

const areas = [
  "Whitefield",
  "Electronic City",
  "Koramangala",
  "HSR Layout",
  "Sarjapur",
  "JP Nagar",
  "Begur",
  "Indiranagar",
  "Marathahalli",
  "Bannerghatta",
  "Hebbal",
  "Yelahanka",
  "Rajajinagar",
  "Jayanagar",
  "RR Nagar"
];

export default function ServiceAreas() {
  return (
    <section className="py-[80px] bg-gray-50/50 flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        
        {/* Title */}
        <SectionHeader
          label="SERVICE AREAS"
          heading={<>Service Areas in <span className="text-[#F26522]">Bangalore</span></>}
          caption="We ensure prompt service, free site visits, and timely execution across all major localities in the city."
        />
        
        {/* Balanced Grid: 5 cols (Desktop), 3 cols (Tablet), 2 cols (Mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-[20px] lg:gap-6">
          {areas.map((area, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-3 h-[60px] px-4 rounded-[16px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#F26522] hover:shadow-[0_8px_20px_rgba(242,101,34,0.1)] transition-all duration-300 cursor-pointer group"
            >
              <MapPin size={18} className="text-[#052a51] group-hover:text-[#F26522] transition-colors shrink-0" />
              <span className="font-[700] text-[14px] lg:text-[15px] text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                {area}
              </span>
            </motion.div>
          ))}
        </div>
        
        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <a 
            href="#contact" 
            className="inline-flex items-center justify-center px-8 h-[44px] bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-full font-bold text-[14px] shadow-[0_6px_15px_rgba(242,101,34,0.25)] hover:-translate-y-0.5 transition-all"
          >
            View All Service Areas
          </a>
        </motion.div>

      </div>
    </section>
  );
}
