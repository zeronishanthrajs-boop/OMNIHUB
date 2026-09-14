import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import gsap from "gsap";

export default function MemoryClouds() {
  const containerRef = useRef(null);
  const cloud1Ref = useRef(null);
  const cloud2Ref = useRef(null);
  const cloud3Ref = useRef(null);

  // Parallax spring drift for cloud quote panels
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const w = window.innerWidth / 2;
      const h = window.innerHeight / 2;
      const mx = clientX - w;
      const my = clientY - h;

      gsap.to(cloud1Ref.current, {
        x: mx * 0.04,
        y: my * 0.04,
        duration: 1.5,
        ease: "power2.out",
      });

      gsap.to(cloud2Ref.current, {
        x: -mx * 0.03,
        y: -my * 0.03,
        duration: 1.8,
        ease: "power2.out",
      });

      gsap.to(cloud3Ref.current, {
        x: mx * 0.02,
        y: -my * 0.02,
        duration: 2.2,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const memories = [
    {
      ref: cloud1Ref,
      quote: "Perfect things are forgettable. Real souls leave echoes.",
      author: "Shizuka",
      style: "md:translate-x-[-15%] md:translate-y-[-10%]",
    },
    {
      ref: cloud2Ref,
      quote: "Amongst pixel coordinates and virtual networks, authentic human resonance is the only permanent thing we build.",
      author: "Aesthetic Core",
      style: "md:translate-x-[20%] md:translate-y-[15%]",
    },
    {
      ref: cloud3Ref,
      quote: "Cozy dreams keep us warm during tactical storms.",
      author: "Gamer Wisdom",
      style: "md:translate-x-[-5%] md:translate-y-[35%]",
    },
  ];

  return (
    <section
      id="memory"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center items-center py-20 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-dreamBlue-deep via-dreamBlue-dark to-dreamBlue-deep select-none"
    >
      {/* Background dream haze */}
      <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-150px] w-[600px] h-[600px] bg-cyanGlow/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="flex flex-col items-center mb-16 text-center select-none">
          <h2 className="font-orbitron font-extrabold text-3xl md:text-5xl tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            MEMORY CLOUDS
          </h2>
          <div className="w-24 h-[2px] bg-gradient-to-r from-cyanGlow via-neonBlue to-transparent mt-4" />
          <p className="font-outfit text-white/50 text-xs md:text-sm tracking-widest uppercase mt-3">
            Slow emotional cooldown space
          </p>
        </div>

        {/* Floating clouds cards column */}
        <div className="w-full flex flex-col items-center gap-10 relative min-h-[500px] justify-center">
          
          {memories.map((cloud, i) => (
            <div
              key={i}
              ref={cloud.ref}
              className={`w-full max-w-2xl rounded-3xl p-6 md:p-8 glass-panel border border-white/10 hover:border-cyanGlow/30 hover:bg-white/10 transition-all duration-300 relative shadow-lg shadow-black/15 group flex items-start gap-4 hover:shadow-cyan/5 ${cloud.style}`}
            >
              {/* Glowing highlight flare */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyanGlow/0 via-transparent to-white/0 group-hover:from-cyanGlow/5 group-hover:to-white/5 pointer-events-none transition-all duration-500" />
              
              <Quote className="w-8 h-8 text-cyanGlow/40 group-hover:text-cyanGlow transition-colors duration-300 shrink-0 mt-1" />
              
              <div className="flex flex-col">
                <p className="font-outfit text-white/95 text-base md:text-lg italic leading-relaxed tracking-wide mb-3">
                  “{cloud.quote}”
                </p>
                <span className="font-orbitron text-xs font-bold tracking-[0.2em] uppercase text-cyanGlow/70 group-hover:text-cyanGlow transition-colors duration-300">
                  // {cloud.author}
                </span>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
