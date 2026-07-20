"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, MapPin, Clock, Users, Star, ArrowRight, Lock, User, Phone, ClipboardList, ChevronDown } from "lucide-react";
import { useQuoteModal } from "@/components/QuoteModalProvider";

export default function Hero() {
  const { openModal } = useQuoteModal();
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=2070",
  ];

  useEffect(() => {
    // Preload images
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (<>
    <section id="home" className="relative min-h-[calc(100vh-150px)] flex flex-col justify-between overflow-hidden bg-[#052a51]">
      {/* Background Image Slider & Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-[#052a51] overflow-hidden">
        {images.map((src, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <div
              className={`w-full h-full bg-cover bg-center bg-no-repeat ${
                currentSlide === idx ? "animate-kenburns" : ""
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          </div>
        ))}

        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(to right, rgba(5,25,55,0.75) 0%, rgba(5,25,55,0.45) 50%, rgba(5,25,55,0.20) 100%)"
          }}
        />

        {/* Navigation Dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? "bg-[#F26522] w-8" : "bg-white/50 hover:bg-white"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] relative z-10 flex-1 flex items-center pb-4 pt-10">
        <div className="flex flex-col lg:flex-row w-full items-center gap-8 lg:gap-12 pt-24">

          {/* LEFT SIDE (55%) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full lg:w-[55%]"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-[#052a51]/80 backdrop-blur-sm text-white px-5 py-2.5 rounded-full mb-8 border border-white/10">
              <span className="font-bold text-sm tracking-wide">⭐ Premium Tile Contractor in Bangalore</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-[76px] font-[800] leading-[1.05] tracking-tight text-white mb-8">
              <span className="block text-white">Premium Tile</span>
              <span className="block text-[#F26522]">Installation</span>
            </motion.h1>

            {/* Paragraph */}
            <motion.p variants={itemVariants} className="max-w-[500px] text-white/90 text-[18px] lg:text-[20px] leading-[1.7] font-medium mb-10">
              Premium tile installation for homes, offices and commercial spaces with flawless finishing and lasting quality.
            </motion.p>

            {/* Trust Points */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-10 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#25D366] w-5 h-5" />
                <span className="text-white">Free Site Visit</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#25D366] w-5 h-5" />
                <span className="text-white">Same-Day Quote</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#25D366] w-5 h-5" />
                <span className="text-white">Expert Team</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#25D366] w-5 h-5" />
                <span className="text-white">Premium Finish</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-5">
              <Button
                onClick={openModal}
                size="lg"
                className="w-full sm:w-auto sm:px-8 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-[14px] h-[56px] font-bold text-lg shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:-translate-y-1 transition-all"
              >
                Get Free Quote <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <a href="tel:+917870935277" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:px-8 bg-[#052a51]/80 hover:bg-[#031b36] backdrop-blur-md text-white rounded-[14px] h-[56px] font-bold text-lg border border-white/10 hover:-translate-y-1 transition-all"
                >
                  Call Now
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE (45%) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full lg:w-[45%] flex items-center justify-center"
          >
            <div className="w-full max-w-[500px] bg-white/90 backdrop-blur-xl rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.12)] p-6 lg:p-8 animate-[float_6s_ease-in-out_infinite]">
              <h3 className="text-2xl font-[800] text-[#052a51] mb-3">Request Free Estimate</h3>
              <p className="text-[#052a51]/70 text-sm mb-4">Fill the form and we’ll get back shortly.</p>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                {/* Row 1 – Name */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Row 3 – Location & Service (two columns) */}
                <div className="flex gap-2">
                  {/* Location */}
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Location"
                      className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none placeholder:text-gray-400"
                    />
                  </div>
                  {/* Service dropdown */}
                  <div className="relative flex-1">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      defaultValue=""
                      className="w-full h-12 pl-10 pr-8 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] appearance-none outline-none"
                    >
                      <option value="" disabled className="text-gray-400">Select Service</option>
                      <option value="floor">Floor Tile Installation</option>
                      <option value="wall">Wall Tile Installation</option>
                      <option value="bathroom">Bathroom Tiling</option>
                      <option value="marble">Marble / Granite</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {/* Row 4 – Requirement textarea */}
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    placeholder="Your Requirement"
                    className="w-full h-24 pl-10 pr-3 pt-8 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] placeholder:text-gray-400 resize-none outline-none"
                  />
                </div>
                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-[56px] bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-xl font-bold text-lg shadow-[0_8px_20px_rgba(242,101,34,0.3)] hover:-translate-y-0.5 transition-all"
                >
                  Get Free Quote
                </button>
                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-[#052a51]/60 text-xs font-semibold mt-2">
                  <Lock size={12} />
                  <span>Your information is 100% secure.</span>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>


    <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] relative z-10 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-[20px] lg:gap-6"
      >
        {[{ value: "500+", label: "Projects Delivered" }, { value: "10+", label: "Years Experience" }, { value: "100%", label: "Client Satisfaction" }, { value: "24Hrs", label: "Quote Turnaround" }].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col items-center">
            <span className="text-3xl font-[800] text-[#F26522] mb-1">{stat.value}</span>
            <span className="text-sm font-bold text-[#052a51]">{stat.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
      {/* Custom animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
        .animate-kenburns { animation: kenburns 6s linear forwards; }
      `}} />
 
  </> );
}
