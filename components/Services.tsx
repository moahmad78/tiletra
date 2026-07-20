"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { useQuoteModal } from "@/components/QuoteModalProvider";

const services = [
  {
    title: "Floor Tile Installation",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Wall Tile Installation",
    image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Bathroom Tile Installation",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Kitchen Tile Installation",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Marble Flooring",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Granite Installation",
    image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Commercial Tile Work",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Tile Repair & Replacement",
    image: "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&q=80&w=600",
  }
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
              className="text-left group relative block w-full h-[220px] lg:h-[240px] rounded-[20px] overflow-hidden shadow-sm hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Background Image */}
              <img 
                src={service.image} 
                alt={service.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
            className="inline-flex items-center justify-center px-10 h-[56px] bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-full font-bold text-lg shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:-translate-y-1 transition-all duration-300"
          >
            Get Free Quote
          </button>
        </motion.div>
      </div>
    </section>
  );
}
