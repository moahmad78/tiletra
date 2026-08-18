"use client";

import { useState, useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CONTACT_PERSONS } from "@/lib/data/contacts";

export default function RotatingFooterContact() {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        setIndex((prev) => (prev + 1) % CONTACT_PERSONS.length);
      }
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const contact = CONTACT_PERSONS[index];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-3 select-none"
    >
      <div className="w-8 h-8 rounded-full bg-[#F26522]/20 flex items-center justify-center text-[#F26522] shrink-0">
        <Phone size={15} />
      </div>
      <div className="relative h-9 overflow-hidden flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.a
            key={contact.tel}
            href={`tel:${contact.tel}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="block text-white/80 hover:text-[#F26522] transition-colors font-medium text-xs md:text-sm"
          >
            <span className="font-bold text-white block leading-tight">{contact.name}</span>
            <span className="text-[#F26522] font-semibold text-xs tracking-wide">{contact.phone}</span>
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  );
}
