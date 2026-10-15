"use client";

import { useState, useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/siteConfig";

const ROTATING_HELPLINE_ITEMS = [
  {
    id: "helpline",
    label: "Toll-Free Helpline",
    phone: PHONE_DISPLAY,
    tel: PHONE_TEL,
  },
  {
    id: "support",
    label: "Customer Support",
    phone: PHONE_DISPLAY,
    tel: PHONE_TEL,
  },
  {
    id: "orders",
    label: "Order & Dispatch Desk",
    phone: PHONE_DISPLAY,
    tel: PHONE_TEL,
  },
];

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
        setIndex((prev) => (prev + 1) % ROTATING_HELPLINE_ITEMS.length);
      }
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const item = ROTATING_HELPLINE_ITEMS[index];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-1.5 h-6 overflow-hidden select-none"
    >
      <Phone size={13} className="text-[#F26522] shrink-0" />
      <div className="relative h-5 min-w-[215px] overflow-hidden flex items-center">
        <AnimatePresence mode="wait">
          <motion.a
            key={item.id}
            href={item.tel.startsWith("tel:") ? item.tel : `tel:${item.tel}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-white hover:text-[#F26522] transition-colors font-bold tracking-wide text-xs flex items-center gap-1.5 whitespace-nowrap notranslate"
            translate="no"
          >
            <span className="text-[#F26522] font-extrabold notranslate" translate="no">
              {item.label}:
            </span>
            <span className="text-white font-bold notranslate" translate="no">
              {item.phone}
            </span>
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  );
}

