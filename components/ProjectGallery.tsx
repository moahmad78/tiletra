"use client";

import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

const projects = [
  {
    id: 1,
    title: "Luxury Marble Flooring Bangalore",
    category: "Residential Flooring",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    title: "Premium Bathroom Tiles Installation",
    category: "Bathroom Renovation",
    image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 3,
    title: "Commercial Granite Lobby",
    category: "Commercial Tile Contractor",
    image: "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 4,
    title: "Outdoor Patio Stonework",
    category: "Exterior Tiling",
    image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 5,
    title: "Restaurant Feature Wall Tiles",
    category: "Wall Tile Installation",
    image: "https://images.unsplash.com/photo-1582719478250-c89af14eb422?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 6,
    title: "Walk-in Shower Enclosure",
    category: "Waterproof Tiling",
    image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800",
  },
];

export default function ProjectGallery() {
  return (
    <section id="projects" className="py-[80px] bg-white flex flex-col justify-center min-h-0">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        <SectionHeader
          label="PROJECT GALLERY"
          heading={<>Our <span className="text-[#F26522]">Projects</span></>}
          caption="Explore our curated portfolio of residential and commercial tiling projects across Bangalore."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-[20px] lg:gap-6">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative overflow-hidden rounded-3xl aspect-square shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.1)] transition-all duration-500 border border-gray-100"
            >
              <img 
                src={project.image} 
                alt={`${project.title} by Tiletra Bangalore`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02152b]/95 via-[#02152b]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 lg:p-10">
                <span className="text-white/80 font-medium text-xs mb-2 uppercase tracking-[0.15em]">{project.category}</span>
                <h3 className="text-white text-2xl font-bold tracking-tight">{project.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
