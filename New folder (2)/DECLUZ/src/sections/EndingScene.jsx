import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function EndingScene() {
  const moonRef = useRef(null);
  const bunnyRef = useRef(null);

  useEffect(() => {
    // Parallax mouse interaction for the ending moon and bunny
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX - window.innerWidth / 2) * 0.02;
      const y = (clientY - window.innerHeight / 2) * 0.02;

      gsap.to(moonRef.current, {
        x,
        y,
        duration: 1.5,
        ease: "power2.out",
      });

      gsap.to(bunnyRef.current, {
        x: x * 0.5,
        y: y * 0.5,
        duration: 1.8,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section
      id="ending"
      className="relative min-h-screen w-full flex flex-col justify-between items-center py-20 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-dreamBlue-deep to-[#02050f] select-none"
    >
      {/* Background stars fade layer */}
      <div className="absolute inset-0 bg-[#00f5ff]/[0.015] pointer-events-none" />

      {/* Main Closing Vector Content */}
      <div className="relative w-full max-w-4xl mx-auto z-10 flex flex-col justify-center items-center text-center mt-12">
        
        {/* Sleeping/Sitting peaceful bunny silhouette under moon */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-6 flex items-center justify-center">
          {/* Giant full moon glowing brighter */}
          <div
            ref={moonRef}
            className="absolute w-44 h-44 md:w-60 md:h-60 rounded-full bg-gradient-to-tr from-cyanGlow/30 via-white to-lavenderGlow/50 shadow-cyan flex items-center justify-center animate-neon-pulse gpu-accelerated"
          >
            {/* Outer halo */}
            <div className="absolute w-[110%] h-[110%] rounded-full border border-cyanGlow/10 animate-ping pointer-events-none" />
          </div>

          {/* Resting rabbit vector looking at moon */}
          <div
            ref={bunnyRef}
            className="absolute z-20 w-32 h-32 md:w-44 md:h-44 filter drop-shadow-[0_0_15px_rgba(2,5,15,0.9)] opacity-95 pointer-events-none"
          >
            <svg
              viewBox="0 0 200 200"
              fill="#02050f"
              className="w-full h-full"
            >
              {/* Cute resting rabbit sleeping profile */}
              <path d="M40 150 C40 120 70 110 90 120 C110 110 140 120 140 150 C140 165 120 175 90 175 C60 175 40 165 40 150 Z" />
              {/* Ears flattened backwards in relaxed sleeping state */}
              <path d="M52 125 C30 115 10 118 5 126 C0 134 25 132 45 130 Z" fill="#02050f" />
              <path d="M50 126 C35 119 18 121 14 127 C10 132 28 130 44 128 Z" fill="rgba(0, 245, 255, 0.3)" />
              
              <path d="M60 120 C38 105 18 108 12 116 C6 124 32 122 52 121 Z" fill="#02050f" />
              <path d="M58 121 C42 109 25 111 21 117 C17 122 36 120 50 119 Z" fill="rgba(0, 245, 255, 0.3)" />
              {/* Small fluffy tail */}
              <circle cx="145" cy="155" r="10" fill="#02050f" />
            </svg>
          </div>
        </div>

        {/* Final Quote messages */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="font-orbitron font-extrabold text-2xl md:text-5xl tracking-[0.18em] text-white uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
            Every scroll ends.
          </h2>
          <h3 className="font-spaceGrotesk font-light text-cyanGlow text-base md:text-2xl tracking-[0.25em] uppercase mt-1 drop-shadow-[0_0_10px_rgba(0,245,255,0.4)]">
            Some worlds stay.
          </h3>
        </div>

        {/* Interactive return upward button */}
        <button
          onClick={handleScrollToTop}
          className="interactive mt-12 px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-cyanGlow/50 hover:bg-cyanGlow/10 transition-all duration-300 font-orbitron font-bold text-xs tracking-widest hover:shadow-cyan text-white"
        >
          SCROLL UPWARD
        </button>

      </div>

      {/* Footer Branding section */}
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-8 z-10 text-white/40 font-outfit text-xs tracking-wider select-none gap-4">
        <span>© {new Date().getFullYear()} SHIZUKAVERSE. ALL COZY DREAMS PRESERVED.</span>
        <div className="flex items-center gap-6">
          <span className="hover:text-cyanGlow transition-colors duration-300 pointer-events-auto cursor-pointer">
            PORTAL SYSTEM
          </span>
          <span className="hover:text-cyanGlow transition-colors duration-300 pointer-events-auto cursor-pointer">
            COZY CONSOLE
          </span>
        </div>
      </div>
    </section>
  );
}
