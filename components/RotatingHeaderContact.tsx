"use client";

import { useState, useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CONTACT_PERSONS } from "@/lib/data/contacts";

export default function RotatingHeaderContact() {
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
      className="flex items-center gap-1.5 h-6 overflow-hidden select-none"
    >
      <Phone size={13} className="text-[#F26522] shrink-0" />
      <span className="text-white/60 text-xs hidden lg:inline">Helpline:</span>
      <div className="relative h-5 min-w-[190px] overflow-hidden flex items-center">
        <AnimatePresence mode="wait">
          <motion.a
            key={contact.tel}
            href={`tel:${contact.tel}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-white hover:text-[#F26522] transition-colors font-bold tracking-wide text-xs flex items-center gap-1 whitespace-nowrap"
          >
            <span className="text-[#F26522] font-extrabold">{contact.shortName}:</span>
            <span>{contact.phone}</span>
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  );
}
