"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const images = [
  "/images/house.png",
  "/images/electrician.png",
  "/images/painter.png",
];

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {/* Background Slider */}
      <AnimatePresence initial={false}>
        <motion.img
          key={currentImageIndex}
          src={images[currentImageIndex]}
          alt="UrbanFix Hero"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 lg:flex-row lg:justify-between lg:px-8">
        
        {/* Left Side: Text */}
        <div className="flex max-w-2xl flex-col justify-center text-center lg:text-left mt-20 lg:mt-0">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Professional Home Services <br className="hidden lg:block"/> You Can Trust
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-lg leading-8 text-gray-200"
          >
            From electrical repairs to complete home renovation, UrbanFix provides reliable, affordable and professional services across Bangalore.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 lg:justify-start"
          >
            <Button size="lg" variant="accent" className="w-full sm:w-auto">
              Book Service
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20">
              Get Free Quote
            </Button>
          </motion.div>
        </div>

        {/* Right Side: Floating Form */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 w-full max-w-md lg:mt-0 lg:w-96 hidden md:block"
        >
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Get a Free Estimate</h3>
            <form className="space-y-4">
              <Input placeholder="Your Name" className="bg-white/90 border-transparent placeholder:text-gray-500" />
              <Input placeholder="Phone Number" type="tel" className="bg-white/90 border-transparent placeholder:text-gray-500" />
              <select className="flex h-12 w-full rounded-lg border border-transparent bg-white/90 px-3 py-2 text-sm text-[#1E293B] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F97316]">
                <option value="" disabled selected>Select Service</option>
                <option value="electrician">Electrician</option>
                <option value="plumbing">Plumbing</option>
                <option value="painting">Painting</option>
                <option value="renovation">Renovation</option>
              </select>
              <Input placeholder="Location (e.g. HSR Layout)" className="bg-white/90 border-transparent placeholder:text-gray-500" />
              <textarea 
                placeholder="Message (Optional)" 
                className="flex w-full rounded-lg border border-transparent bg-white/90 px-3 py-2 text-sm text-[#1E293B] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F97316] min-h-[80px]"
              />
              <Button variant="accent" className="w-full h-12 mt-2">
                Submit Request
              </Button>
            </form>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
