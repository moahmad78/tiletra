"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { useQuoteModal } from "@/components/QuoteModalProvider";
import { SafeImage } from "@/components/ui/SafeImage";

const services = [
  {
    title: "Floor Tile Installation",
    image: "/images/categories/cat-tiles-stone.jpg",
  },
  {
    title: "Wall Tile Installation",
    image: "/images/categories/cat-wall-surface.jpg",
  },
  {
    title: "Bathroom Tile Installation",
    image: "/images/banners/banner-slide-2-1400.webp",
  },
  {
    title: "Kitchen Tile Installation",
    image: "/images/banners/banner-slide-1-1400.webp",
  },
  {
    title: "Marble Flooring",
    image: "/images/categories/cat-flooring.jpg",
  },
  {
    title: "Granite Installation",
    image: "/images/categories/cat-granite.jpg",
  },
  {
    title: "Commercial Tile Work",
    image: "/images/categories/cat-office-commercial.jpg",
  },
  {
    title: "Tile Repair & Replacement",
    image: "/images/categories/cat-adhesives-sealants-waterproofing.jpg",
  },
];

export default function Services() {
  const { openModal } = useQuoteModal();
  return (
    <section id="services" className="py-[80px] bg-white flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        {/* Section Title */}
        <SectionHeader 
          label="OUR SERVICES"
          heading={<>Premium <span className="text-[#F26522]">Services</span></>}
          caption="Professional tile installation for residential and commercial projects across Bangalore."
        />

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-[20px] lg:gap-6 mb-10">
          {services.map((service, index) => (
            <motion.button
              onClick={openModal}
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="text-left group relative block w-full h-[220px] lg:h-[240px] rounded-[20px] overflow-hidden shadow-sm hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
            >
              {/* Background Image */}
              <SafeImage 
                src={service.image} 
                alt={service.title} 
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#052a51]/95 via-[#052a51]/40 to-transparent transition-opacity duration-300 group-hover:from-[#052a51]" />
              
              {/* Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="flex items-end justify-between gap-2">
                  <h3 className="text-white font-bold text-lg leading-tight">
                    {service.title}
                  </h3>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="text-white w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        
        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <button 
            onClick={openModal}
            className="inline-flex items-center justify-center px-10 h-[56px] bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-full font-bold text-lg shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            Get Free Quote
          </button>
        </motion.div>
      </div>
    </section>
  );
}
