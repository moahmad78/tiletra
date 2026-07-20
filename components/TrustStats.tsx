"use client";

import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function Counter({ from, to, duration = 2 }: { from: number; to: number; duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, amount: 0.5 });
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const spring = useSpring(from, { 
    damping: 20,
    stiffness: 100,
    duration: duration * 1000
  });

  useEffect(() => {
    if (inView && !hasAnimated) {
      spring.set(to);
      setHasAnimated(true);
    }
  }, [inView, spring, to, hasAnimated]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = Math.round(latest).toString();
      }
    });
  }, [spring]);

  return <span ref={nodeRef}>{from}</span>;
}

export default function TrustStats() {
  const stats = [
    { label: "Projects Delivered", value: 500, suffix: "+" },
    { label: "Years Experience", value: 10, suffix: "+" },
    { label: "Client Satisfaction", value: 100, suffix: "%" },
    { label: "Quote Turnaround", value: 24, suffix: " Hrs" },
  ];

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        
        <div className="max-w-3xl mx-auto text-center mb-20">
          <span className="uppercase tracking-[0.2em] text-sm font-bold text-primary mb-4 block">Proven Track Record</span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-6"
          >
            The Tiletra Difference: Uncompromising Quality
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 leading-relaxed"
          >
            As a leading tile contractor in Bangalore, Tiletra is synonymous with precision and reliability. We bring over a decade of hands-on experience, premium workmanship, and an unwavering commitment to transforming your spaces into architectural masterpieces. Our track record speaks for itself.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-3xl p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.07)] hover:-translate-y-2 transition-all duration-500 border border-gray-100"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center justify-center">
                <Counter from={0} to={stat.value} />
                <span>{stat.suffix}</span>
              </div>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
