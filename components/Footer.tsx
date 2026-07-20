"use client";

import { MapPin, Phone, Mail } from "lucide-react";
import { useQuoteModal } from "@/components/QuoteModalProvider";

export default function Footer() {
  const { openModal } = useQuoteModal();
  return (
    <>
      <footer className="bg-[#02152b] text-white/70 pt-[60px] pb-[30px] border-t border-white/10">
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            
            <div className="lg:col-span-1 pr-4">
              <div className="mb-6">
                <img 
                  src="/Tiletra/logo/web-logo.png" 
                  alt="Tiletra Premium Tile Contractor" 
                  className="h-16 opacity-100"
                />
              </div>
              <p className="mb-8 leading-relaxed text-sm">
                Bangalore's premium tile contractor. We specialize in flawless floor, wall, bathroom, and kitchen tile installations as well as luxury marble and granite flooring.
              </p>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/sahil_sheikh78/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] hover:text-white text-white transition-all duration-300 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] hover:text-white text-white transition-all duration-300 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] hover:text-white text-white transition-all duration-300 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-lg mb-6 tracking-wide">Premium Services</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><a href="#services" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Floor Tile Installation</a></li>
                <li><a href="#services" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Wall Tile Installation</a></li>
                <li><a href="#services" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Bathroom & Kitchen Tiling</a></li>
                <li><a href="#services" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Marble & Granite Flooring</a></li>
                <li><a href="#services" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Commercial Tile Work</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-6 tracking-wide">Quick Links</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><a href="#" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Home</a></li>
                <li><a href="#gallery" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Project Portfolio</a></li>
                <li><a href="#faq" className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> FAQ</a></li>
                <li><button onClick={openModal} className="hover:text-[#F26522] transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50"></span> Book Free Site Visit</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-lg mb-6 tracking-wide">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-4 group">
                  <div className="shrink-0 mt-0.5">
                    <MapPin className="text-white opacity-100 group-hover:text-[#F26522] transition-colors" size={20} />
                  </div>
                  <span className="leading-relaxed">41, 10th A Cross Rd, Janapriya Layout, Classic Paradise Layout, Begur, Bengaluru, Karnataka 560114</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="shrink-0">
                    <Phone className="text-white opacity-100 group-hover:text-[#F26522] transition-colors" size={20} />
                  </div>
                  <a href="tel:+917870935277" className="hover:text-white transition-colors font-medium">+91 78709 35277</a>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="shrink-0">
                    <Mail className="text-white opacity-100 group-hover:text-[#F26522] transition-colors" size={20} />
                  </div>
                  <a href="mailto:vishalpoddar393@gmail.com" className="hover:text-white transition-colors break-all font-medium">vishalpoddar393@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 py-4 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-white gap-4 text-center">
            <p>&copy; {new Date().getFullYear()} Tiletra. All Rights Reserved.</p>
            <p>
              Designed & Developed by{" "}
              <a 
                href="https://www.instagram.com/sahil_sheikh78/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#F26522] hover:underline"
              >
                Sahil Sheikh
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/917870935277" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 group"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-8 md:h-8">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        
        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          Chat on WhatsApp
        </span>
      </a>
    </>
  );
}
