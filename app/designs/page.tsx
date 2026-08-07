"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MessageCircle, Phone, Maximize2, Tag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";

// Define categories
const CATEGORIES = [
  "All",
  "Matte Tile",
  "Glossy Tile",
  "Marble",
  "Granite",
  "Bathroom Tile",
  "Bedroom Tile",
];

const designs = [
  {
    id: 1,
    name: "Statuario White Marble",
    category: "Marble",
    image: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&q=80&w=800",
    price: "₹120 / sq.ft",
    dimension: "800x1600 mm"
  },
  {
    id: 2,
    name: "Onyx Blue Glossy",
    category: "Glossy Tile",
    image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800",
    price: "₹65 / sq.ft",
    dimension: "600x1200 mm"
  },
  {
    id: 3,
    name: "Rustic Wood Finish",
    category: "Bedroom Tile",
    image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&q=80&w=800",
    price: "₹55 / sq.ft",
    dimension: "200x1200 mm"
  },
  {
    id: 4,
    name: "Cement Concrete Matte",
    category: "Matte Tile",
    image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=800",
    price: "₹45 / sq.ft",
    dimension: "600x600 mm"
  },
  {
    id: 5,
    name: "Moroccan Art Pattern",
    category: "Bathroom Tile",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
    price: "₹75 / sq.ft",
    dimension: "300x300 mm"
  },
  {
    id: 6,
    name: "Black Galaxy Granite",
    category: "Granite",
    image: "https://images.unsplash.com/photo-1588824345437-080bc2b6f131?auto=format&fit=crop&q=80&w=800",
    price: "₹150 / sq.ft",
    dimension: "Custom Size"
  },
  {
    id: 7,
    name: "Travertine Beige",
    category: "Matte Tile",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800",
    price: "₹60 / sq.ft",
    dimension: "600x1200 mm"
  },
  {
    id: 8,
    name: "Aqua Blue Mosaic",
    category: "Bathroom Tile",
    image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800",
    price: "₹85 / sq.ft",
    dimension: "300x450 mm"
  },
];

export default function DesignsCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredDesigns = selectedCategory === "All" 
    ? designs 
    : designs.filter(d => d.category === selectedCategory);

  return (
    <QuoteModalProvider>
      <main className="min-h-screen bg-[#F8FAFC]">
        <Header />
        
        {/* Page Hero */}
        <div className="pt-32 pb-16 bg-[#052a51] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay"></div>
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            >
              Tile <span className="text-[#F26522]">Catalog</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/80 text-lg md:text-xl max-w-2xl"
            >
              Explore our premium collection of tiles, marbles, and granites. Find the perfect match for your space.
            </motion.p>
          </div>
        </div>

        {/* Catalog Section */}
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-12 lg:py-20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* Left Sidebar Filter */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100">
                <h3 className="text-lg font-bold text-[#052a51] mb-4 flex items-center gap-2">
                  <Tag size={18} className="text-[#F26522]" />
                  Categories
                </h3>
                
                {/* Mobile: Horizontal scroll, Desktop: Vertical list */}
                <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        selectedCategory === category
                          ? "bg-[#052a51] text-white shadow-md"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#052a51]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Grid Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                <h2 className="text-2xl font-bold text-[#052a51]">
                  {selectedCategory === "All" ? "All Designs" : selectedCategory}
                </h2>
                <span className="text-gray-500 text-sm font-medium">
                  Showing {filteredDesigns.length} result{filteredDesigns.length !== 1 && 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredDesigns.map((tile) => {
                    const message = encodeURIComponent(`Hi Tiletra, I want to inquire about the price for the *${tile.name}* (${tile.dimension}). Please share the details.`);
                    const whatsappLink = `https://wa.me/917870935277?text=${message}`;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        key={tile.id}
                        className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 group hover:-translate-y-2 transition-all duration-300 flex flex-col"
                      >
                        {/* Image */}
                        <div className="relative h-64 w-full overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={tile.image} 
                            alt={tile.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#052a51] shadow-sm">
                            {tile.category}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-6 flex-1 flex flex-col">
                          <h3 className="text-xl font-bold text-[#052a51] mb-4 leading-tight">{tile.name}</h3>
                          
                          <div className="space-y-2 mb-6 mt-auto">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center gap-1.5"><Maximize2 size={14}/> Size:</span>
                              <span className="font-semibold text-gray-900">{tile.dimension}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center gap-1.5"><Tag size={14}/> Price:</span>
                              <span className="font-bold text-[#F26522] text-base">{tile.price}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-auto">
                            <a 
                              href="tel:+917870935277"
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#052a51] rounded-xl font-bold text-sm transition-colors"
                            >
                              <Phone size={16} />
                              Call
                            </a>
                            <a 
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-[#25D366]/20"
                            >
                              <MessageCircle size={18} />
                              Inquire Price
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
              
              {filteredDesigns.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-lg">No designs found in this category.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pb-20">
          <div className="bg-[#052a51] rounded-3xl p-10 md:p-14 text-center flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay"></div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">Don&apos;t see what you need?</h3>
            <p className="text-white/80 text-lg max-w-2xl mb-8 relative z-10">We have hundreds of other designs in our physical catalog, including custom imports. Contact us to view more options tailored to your project.</p>
            <a 
              href="tel:+917870935277"
              className="inline-flex items-center gap-2 bg-[#F26522] text-white px-8 py-4 rounded-full font-bold hover:bg-[#d85515] transition-all hover:-translate-y-1 relative z-10"
            >
              <Phone size={20} />
              Speak to an Expert
            </a>
          </div>
        </div>

        <Footer />
      </main>
    </QuoteModalProvider>
  );
}
