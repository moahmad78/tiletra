"use client";

import { motion } from "framer-motion";
import { Plug, Droplet, Paintbrush, Hammer, Grid2X2, Home, Umbrella, ChefHat, Bath, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";

const services = [
  { icon: <Plug className="h-6 w-6" />, name: "Electrician", desc: "Wiring, repairs & installations" },
  { icon: <Droplet className="h-6 w-6" />, name: "Plumber", desc: "Leakages, pipes & fittings" },
  { icon: <Paintbrush className="h-6 w-6" />, name: "Painter", desc: "Interior & exterior painting" },
  { icon: <Hammer className="h-6 w-6" />, name: "Carpenter", desc: "Furniture, doors & woodwork" },
  { icon: <Grid2X2 className="h-6 w-6" />, name: "Tile Installation", desc: "Floor & wall tiling experts" },
  { icon: <Home className="h-6 w-6" />, name: "False Ceiling", desc: "POP & modern ceiling designs" },
  { icon: <Umbrella className="h-6 w-6" />, name: "Waterproofing", desc: "Roof & bathroom waterproofing" },
  { icon: <ChefHat className="h-6 w-6" />, name: "Modular Kitchen", desc: "Custom kitchen interiors" },
  { icon: <Bath className="h-6 w-6" />, name: "Bathroom Renovation", desc: "Complete remodeling" },
  { icon: <Briefcase className="h-6 w-6" />, name: "Office Interior", desc: "Commercial workspaces" },
];

export default function Services() {
  return (
    <section className="py-24 bg-slate-50" id="services">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-[#0B1F3A] sm:text-4xl"
          >
            Our Professional Services
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-gray-600"
          >
            Top-rated home maintenance and renovation experts in Bangalore. We bring quality, trust, and professionalism to your doorstep.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white transition-colors">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-[#1E293B] group-hover:text-[#0B1F3A] transition-colors">{service.name}</h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">{service.desc}</p>
              
              <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" className="rounded-full font-semibold border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white">
                  Know More
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
