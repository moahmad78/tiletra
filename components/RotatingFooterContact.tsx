"use client";

import { Phone } from "lucide-react";

export default function RotatingFooterContact() {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="w-8 h-8 rounded-full bg-[#F26522]/20 flex items-center justify-center text-[#F26522] shrink-0">
        <Phone size={15} />
      </div>
      <div className="flex flex-col justify-center">
        <span className="font-bold text-white block leading-tight text-xs md:text-sm">Intrihub Support</span>
        <a
          href="tel:+917090120211"
          className="text-[#F26522] hover:text-white font-semibold text-xs tracking-wide transition-colors"
        >
          +91 70901 20211
        </a>
      </div>
    </div>
  );
}
