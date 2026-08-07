"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";

const designs = [
  {
    id: "d1",
    name: "Statuario White Marble",
    category: "Premium Marble",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    description: "Classic Italian marble with striking grey veining. Perfect for luxury living rooms and master bathrooms."
  },
  {
    id: "d2",
    name: "Onyx Blue High Gloss",
    category: "Vitrified Tiles",
    image: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=2070&auto=format&fit=crop",
    description: "Stunning blue onyx pattern with a mirror-like high gloss finish for a bold statement."
  },
  {
    id: "d3",
    name: "Rustic Oak Wood Plank",
    category: "Wood Finish Tiles",
    image: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2070&auto=format&fit=crop",
    description: "Enjoy the warmth of wood with the durability of ceramic. Ideal for bedrooms and cozy spaces."
  },
  {
    id: "d4",
    name: "Moroccan Art Deco",
    category: "Designer Wall Tiles",
    image: "https://images.unsplash.com/photo-1632935560126-7e3fccf89c65?q=80&w=1964&auto=format&fit=crop",
    description: "Intricate geometric patterns that bring vibrant Mediterranean energy to kitchens or balconies."
  },
  {
    id: "d5",
    name: "Carrara Hexagon Mosaic",
    category: "Bathroom Tiles",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop",
    description: "Elegant small-format hexagon tiles for shower floors and accent walls."
  },
  {
    id: "d6",
    name: "Industrial Concrete Grey",
    category: "Matte Floor Tiles",
    image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=2070&auto=format&fit=crop",
    description: "Minimalist concrete-look tiles providing a modern, slip-resistant surface for contemporary homes."
  }
];

export default function DesignsPage() {
  const handleWhatsAppInquiry = (tileName: string) => {
    const message = `Hello Tiletra, I am interested in the "${tileName}" design from your catalog. Could you please let me know its rate and availability?`;
    window.open(`https://wa.me/917870935277?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <QuoteModalProvider>
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="pt-[140px] pb-24">
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-2 bg-[#F26522]/10 rounded-full text-[#F26522] font-bold text-sm tracking-wide mb-4 uppercase"
              >
                Tile Catalog
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#052a51] mb-6 tracking-tight"
              >
                Explore Premium <span className="text-[#F26522]">Designs</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto"
              >
                Browse our curated collection of luxury tiles. Find a design you love and get an instant quote via WhatsApp.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {designs.map((tile, index) => (
                <motion.div 
                  key={tile.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 group hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="relative h-64 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={tile.image} 
                      alt={tile.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-[#052a51] shadow-sm">
                      {tile.category}
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-[#052a51] mb-3">{tile.name}</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed line-clamp-2">
                      {tile.description}
                    </p>
                    
                    <button 
                      onClick={() => handleWhatsAppInquiry(tile.name)}
                      className="w-full h-14 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(37,211,102,0.3)] hover:-translate-y-1 transition-all group/btn"
                    >
                      <MessageCircle size={22} className="group-hover/btn:animate-pulse" />
                      Inquire Price
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20 p-10 bg-[#052a51] rounded-3xl text-center flex flex-col md:flex-row items-center justify-between gap-8"
            >
              <div className="text-left max-w-2xl">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Didn't find what you're looking for?</h3>
                <p className="text-white/70 text-lg">We have hundreds of other designs in our physical catalog. Contact us to view more options.</p>
              </div>
              <a 
                href="tel:+917870935277" 
                className="shrink-0 px-8 py-4 bg-white text-[#052a51] hover:bg-[#F26522] hover:text-white rounded-xl font-bold text-lg transition-colors shadow-lg"
              >
                Call Us Now
              </a>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    </QuoteModalProvider>
  );
}
