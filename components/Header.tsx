"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, MapPin, Phone, Mail } from "lucide-react";
import { useQuoteModal } from "@/components/QuoteModalProvider";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { openModal } = useQuoteModal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Active section tracking
      const sections = ["home", "services", "projects", "faq", "contact"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            // In a real scenario we could break here, but since elements can overlap or scroll quickly, 
            // the last element that satisfies the condition is often correct for the bottom of the page.
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home", id: "home" },
    { name: "Services", href: "#services", id: "services" },
    { name: "Projects", href: "#projects", id: "projects" },
    { name: "FAQ", href: "#faq", id: "faq" },
    { name: "Contact", href: "#contact", id: "contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500">
      
      {/* Top Contact Bar (Dark Blue) */}
      <div className={cn(
        "bg-[#052a51] text-white py-2 hidden md:block transition-all duration-300 overflow-hidden",
        isScrolled ? "h-0 py-0 opacity-0" : "h-auto opacity-100"
      )}>
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
          <div className="flex justify-between items-center text-sm font-medium">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-[#F26522]" /> 41, 10th A Cross Rd, Begur, Bangalore
              </span>
              <a href="mailto:vishalpoddar393@gmail.com" className="flex items-center gap-2 hover:text-[#F26522] transition-colors">
                <Mail size={14} className="text-[#F26522]" /> vishalpoddar393@gmail.com
              </a>
            </div>
            <div>
              <a href="tel:+917870935277" className="flex items-center gap-2 hover:text-[#F26522] transition-colors font-bold tracking-wide">
                <Phone size={14} className="text-[#F26522]" /> +91 78709 35277
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar (White) */}
      <div className={cn(
        "bg-white shadow-sm transition-all duration-500 border-b border-gray-100",
        isScrolled ? "h-[85px]" : "h-[85px]"
      )}>
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] h-full flex items-center justify-between">
          
          <div className="flex-shrink-0">
            <a href="#" className="flex items-center gap-3 group">
              <img 
                src="/Tiletra/logo/icon.png" 
                alt="Tiletra Icon" 
                className="h-8 md:hidden transition-transform group-hover:scale-105"
              />
              <img 
                src="/Tiletra/logo/web-logo.png" 
                alt="Tiletra" 
                className="hidden md:block h-[45px] lg:h-[55px] w-auto object-contain transition-all duration-300 group-hover:opacity-90"
              />
              <span className="md:hidden text-2xl font-bold tracking-tight text-[#052a51]">
                Tiletra
              </span>
            </a>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  "text-[15px] font-bold transition-colors",
                  activeSection === link.id ? "text-[#F26522]" : "text-[#052a51] hover:text-[#F26522]"
                )}
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+917870935277">
              <Button variant="outline" className="rounded-xl px-6 h-[46px] font-bold text-[#052a51] border-gray-200 hover:border-[#F26522] hover:bg-[#F26522]/5 hover:text-[#F26522] transition-all shadow-sm">
                Call Now
              </Button>
            </a>
            <Button onClick={openModal} className="rounded-xl px-8 h-[46px] font-bold text-white bg-[#F26522] hover:bg-[#d95a1e] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Get Free Quote
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-[#052a51]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl py-6 px-4 flex flex-col gap-6 border-t border-gray-100">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "text-lg font-bold px-4 py-2 rounded-lg transition-colors",
                activeSection === link.id ? "text-[#F26522] bg-gray-50" : "text-[#052a51] hover:text-[#F26522] hover:bg-gray-50"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-gray-100 px-4">
            <a href="tel:+917870935277" className="w-full">
              <Button variant="outline" className="w-full rounded-xl h-14 text-lg font-bold border-gray-200 text-[#052a51]">Call Now</Button>
            </a>
            <Button onClick={() => { setMobileMenuOpen(false); openModal(); }} className="w-full rounded-xl h-14 text-lg font-bold bg-[#F26522] text-white shadow-md">
              Get Free Quote
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
