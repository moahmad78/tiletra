"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SectionHeader from "./SectionHeader";
import { useQuoteModal } from "@/components/QuoteModalProvider";

const faqs = [
  {
    question: "Do you provide a free site visit in Bangalore?",
    answer: "Absolutely! We offer a 100% free site visit and professional consultation across all major areas in Bangalore. Our experts will assess your space, take measurements, and understand your requirements before providing a detailed quotation."
  },
  {
    question: "Can I supply my own tiles, or do I have to buy them from you?",
    answer: "You have complete flexibility. If you have already purchased your premium marble, granite, or ceramic tiles, we are happy to provide our expert installation services. Alternatively, we can help you source high-quality materials at competitive prices through our trusted network of suppliers."
  },
  {
    question: "How long does a standard bathroom or kitchen tiling project take?",
    answer: "The timeline depends on the complexity and size of the area. A standard bathroom usually takes 3 to 5 days, while a kitchen backsplash might take just 1 to 2 days. We always prioritize timely delivery without compromising on craftsmanship."
  },
  {
    question: "Do you handle the removal and disposal of old tiles?",
    answer: "Yes, we handle the entire process. Our team will carefully dismantle and remove your existing flooring or wall tiles, properly dispose of the debris, and expertly prepare the surface for the new installation."
  },
  {
    question: "Do you offer any warranty on your tiling work?",
    answer: "Yes, we stand firmly behind our workmanship. We offer a comprehensive warranty on our installation services. We strictly follow industry best practices for surface preparation, waterproofing, and adhesive application to ensure maximum durability."
  },
  {
    question: "How do you ensure proper waterproofing in bathrooms?",
    answer: "Waterproofing is critical for wet areas. We apply high-grade liquid waterproofing membranes and ensure proper slopes towards the drain before laying any tiles. This guarantees a leak-proof, long-lasting bathroom floor and shower area."
  },
  {
    question: "Are there any hidden charges in your quotation?",
    answer: "No. At Tiletra, transparent pricing is a core value. The detailed quotation provided after the free site visit will outline all costs involved. You will never encounter unexpected fees or hidden charges during or after the project."
  },
  {
    question: "Do you take up commercial tiling projects like offices and restaurants?",
    answer: "Yes, we have extensive experience managing large-scale commercial tiling projects, including corporate offices, hotel lobbies, retail stores, and restaurants. We are equipped to handle tight deadlines and heavy-duty flooring requirements."
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const { openModal } = useQuoteModal();

  return (
    <section id="faq" className="py-[80px] bg-gray-50 flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        
        <SectionHeader
          label="FAQ"
          heading={<>Frequently Asked <span className="text-[#F26522]">Questions</span></>}
          caption="Find answers about our tile installation services, pricing, and warranties."
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN (40%): Premium CTA Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[40%] bg-[#052a51] rounded-[24px] p-8 lg:p-10 relative overflow-hidden shadow-[0_20px_40px_rgba(5,42,81,0.15)] lg:sticky lg:top-24"
          >
            {/* Background Texture/Image Overlay */}
            <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay">
              <img 
                src="https://images.unsplash.com/photo-1550211925-69c5c0f9a3c0?auto=format&fit=crop&q=80&w=1000" 
                alt="Tile Texture" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-block bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-full px-4 py-2 mb-6 border border-white/10">
                Free Site Visit
              </div>
              
              {/* Heading */}
              <h3 className="text-3xl lg:text-4xl font-[800] text-white tracking-tight leading-[1.1] mb-4">
                Ready to Transform Your Space with Premium Tiles?
              </h3>
              
              {/* Description */}
              <p className="text-white/80 text-[15px] leading-relaxed mb-8">
                Book a free site visit today and receive a professional consultation with a transparent quotation.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col gap-3 mb-8">
                <button 
                  onClick={openModal}
                  className="w-full flex items-center justify-center h-[56px] bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-[14px] font-bold text-lg shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:-translate-y-0.5 transition-all"
                >
                  Get Free Quote
                </button>
                <a 
                  href="tel:+917870935277" 
                  className="w-full flex items-center justify-center h-[56px] bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-[14px] font-bold text-lg transition-all"
                >
                  Call Now
                </a>
              </div>
              
              {/* Trust Points */}
              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0" />
                  <span className="text-white/90 text-sm font-semibold">Fast Response</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0" />
                  <span className="text-white/90 text-sm font-semibold">Free Site Visit</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0" />
                  <span className="text-white/90 text-sm font-semibold">No Hidden Charges</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0" />
                  <span className="text-white/90 text-sm font-semibold">Professional Consultation</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* RIGHT COLUMN (60%): FAQ Accordion */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[60%]"
          >
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-[0_4px_15px_rgba(0,0,0,0.06)]"
                >
                  <button
                    onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 lg:p-5 text-left focus:outline-none bg-white min-h-[58px]"
                  >
                    <span className="font-semibold text-[15px] lg:text-base text-[#052a51] tracking-tight pr-6">
                      {faq.question}
                    </span>
                    <ChevronDown 
                      className={cn(
                        "text-[#F26522] transition-transform duration-300 shrink-0", 
                        openIdx === idx && "rotate-180"
                      )} 
                      size={20} 
                    />
                  </button>
                  <AnimatePresence>
                    {openIdx === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-4 lg:px-5 pb-4 lg:pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
