"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Phone, User, Mail, MapPin, Wrench, Building2, Ruler, Calendar, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QuoteModalContextProps {
  openModal: () => void;
  closeModal: () => void;
}

const QuoteModalContext = createContext<QuoteModalContextProps | undefined>(undefined);

export const useQuoteModal = () => {
  const context = useContext(QuoteModalContext);
  if (!context) {
    throw new Error("useQuoteModal must be used within a QuoteModalProvider");
  }
  return context;
};

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    setIsSuccess(false);
  };
  
  const closeModal = () => setIsOpen(false);

  // Focus trap & ESC close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate if needed, then show success
    setIsSuccess(true);
  };

  return (
    <QuoteModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#052a51]/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[700px] bg-white rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-[#052a51] tracking-tight">Request Your Free Quote</h2>
                  <p className="text-sm text-gray-500 mt-1">Fill out the form and our Tiletra team will contact you shortly.</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-6 scroll-smooth">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500"
                    >
                      <CheckCircle2 size={40} />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-[#052a51] mb-2">Thank you!</h3>
                    <p className="text-gray-600 mb-8 text-lg">Our team will contact you shortly.</p>
                    <div className="flex gap-4">
                      <a href="tel:+917870935277" className="w-full">
                        <Button className="w-full px-6 h-12 bg-[#052a51] hover:bg-[#031b36] text-white rounded-xl font-bold">
                          Call Now
                        </Button>
                      </a>
                      <a href="https://wa.me/917870935277" target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button className="w-full px-6 h-12 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl font-bold">
                          WhatsApp Us
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input required type="text" placeholder="Your Name" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors" />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input required type="tel" pattern="[0-9]{10}" placeholder="10-digit mobile number" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input type="email" placeholder="Optional" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors" />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Location *</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input required type="text" placeholder="Area in Bangalore" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Select Service *</label>
                      <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select required defaultValue="" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors appearance-none bg-white">
                          <option value="" disabled>Choose a service...</option>
                          <option value="floor">Floor Tile Installation</option>
                          <option value="wall">Wall Tile Installation</option>
                          <option value="bathroom">Bathroom Tile Installation</option>
                          <option value="kitchen">Kitchen Tile Installation</option>
                          <option value="marble">Marble Flooring</option>
                          <option value="granite">Granite Installation</option>
                          <option value="commercial">Commercial Tile Work</option>
                          <option value="repair">Tile Repair</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 4 & 5 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Project Type *</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select required defaultValue="" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors appearance-none bg-white">
                            <option value="" disabled>Select Type...</option>
                            <option value="residential">Residential</option>
                            <option value="commercial">Commercial</option>
                            <option value="office">Office</option>
                            <option value="villa">Villa</option>
                            <option value="apartment">Apartment</option>
                            <option value="retail">Retail</option>
                            <option value="hotel">Hotel</option>
                          </select>
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Approx Area *</label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select required defaultValue="" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors appearance-none bg-white">
                            <option value="" disabled>Select Area...</option>
                            <option value="500">Upto 500 Sqft</option>
                            <option value="1000">500 - 1000 Sqft</option>
                            <option value="1500">1000 - 1500 Sqft</option>
                            <option value="2000">1500 - 2000 Sqft</option>
                            <option value="2000+">2000+ Sqft</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 6 */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Preferred Site Visit Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="date" className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors bg-white" />
                      </div>
                    </div>

                    {/* Row 7 */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Requirements</label>
                      <div className="relative">
                        <ClipboardList className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea placeholder="Tell us more about your project..." className="w-full h-24 pl-10 pr-4 pt-3 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none transition-colors resize-none" />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full h-14 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-xl font-bold text-lg shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:-translate-y-0.5 transition-all"
                      >
                        Get Free Quote
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </QuoteModalContext.Provider>
  );
}
