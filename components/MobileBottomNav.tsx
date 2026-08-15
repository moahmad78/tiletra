"use client";

import { usePathname } from "next/navigation";
import { Home, Wrench, Grid2X2, HelpCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuoteModal } from "@/components/QuoteModalProvider";

const navItems = [
  { label: "Home", href: "/#home", icon: Home, id: "home" },
  { label: "Services", href: "/#services", icon: Wrench, id: "services" },
  { label: "Shop", href: "/designs", icon: Grid2X2, id: "designs" },
  { label: "FAQ", href: "/#faq", icon: HelpCircle, id: "faq" },
  { label: "Contact", href: "/contact", icon: Phone, id: "contact" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { openModal } = useQuoteModal();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/designs"
              ? pathname === "/designs"
              : item.href === "/contact"
              ? pathname === "/contact"
              : false;

          return (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                isActive ? "text-[#F26522]" : "text-[#052a51]"
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  "transition-colors",
                  isActive ? "text-[#F26522]" : "text-[#052a51]"
                )}
              />
              {item.label}
            </a>
          );
        })}

        {/* CTA button */}
        <button
          onClick={openModal}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-white bg-[#F26522] active:bg-[#d95a1e] transition-colors"
        >
          <span className="text-[18px] leading-none">✦</span>
          Quote
        </button>
      </div>
    </nav>
  );
}
