"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Clock, IndianRupee, Smile } from "lucide-react";

const trustItems = [
  {
    icon: <ShieldCheck className="h-8 w-8 text-[#22C55E]" />,
    title: "Verified Professionals",
    description: "Background checked & trained experts",
  },
  {
    icon: <Clock className="h-8 w-8 text-[#F97316]" />,
    title: "Same Day Service",
    description: "Quick and reliable response",
  },
  {
    icon: <IndianRupee className="h-8 w-8 text-[#0B1F3A]" />,
    title: "Transparent Pricing",
    description: "No hidden charges, upfront quotes",
  },
  {
    icon: <Smile className="h-8 w-8 text-[#22C55E]" />,
    title: "Customer Satisfaction",
    description: "Guaranteed quality and support",
  },
];

export default function TrustBar() {
  return (
    <section className="relative -mt-16 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 hidden md:block">
      <div className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                {item.icon}
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1E293B]">{item.title}</h4>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
