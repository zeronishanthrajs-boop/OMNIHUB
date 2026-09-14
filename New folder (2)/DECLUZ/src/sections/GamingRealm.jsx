import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Target, Crosshair, Award } from "lucide-react";
import gsap from "gsap";

export default function GamingRealm() {
  const [battleMode, setBattleMode] = useState(false);
  const containerRef = useRef(null);
  const layerRef = useRef(null);

  // Parallax shifts on holographic HUD layers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!layerRef.current || battleMode) return;
      const { clientX, clientY } = e;
      const x = (clientX - window.innerWidth / 2) * 0.035;
      const y = (clientY - window.innerHeight / 2) * 0.035;

      gsap.to(layerRef.current, {
        x,
        y,
        duration: 0.8,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [battleMode]);

  const stats = [
    { name: "Visual Precision", value: 95, icon: <Target className="w-4 h-4 text-cyanGlow" /> },
    { name: "Aesthetic Defense", value: 88, icon: <Shield className="w-4 h-4 text-purple-400" /> },
    { name: "Creativity Burst", value: 100, icon: <Zap className="w-4 h-4 text-pink-400" /> },
    { name: "Cozy Immersion", value: 92, icon: <Award className="w-4 h-4 text-green-400" /> },
  ];

  return (
    <section
      id="gaming"
      ref={containerRef}
      className={`relative min-h-screen w-full flex flex-col justify-center py-20 px-6 md:px-12 overflow-hidden transition-colors duration-[1.2s] ${
        battleMode ? "bg-[#02050e]" : "bg-gradient-to-b from-dreamBlue-deep via-dreamBlue-dark to-dreamBlue-deep"
      }`}
    >
      {/* Background grids and glowing particles */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* Cyber ambient glow lights */}
      <div className={`absolute top-1/4 right-10 w-[350px] h-[350px] blur-[120px] rounded-full pointer-events-none transition-all duration-[1s] ${
        battleMode ? "bg-red-500/10" : "bg-cyanGlow/10"
      }`} />
      <div className={`absolute bottom-1/4 left-10 w-[400px] h-[400px] blur-[150px] rounded-full pointer-events-none transition-all duration-[1s] ${
        battleMode ? "bg-purple-600/10" : "bg-neonBlue/10"
      }`} />

      <div className="relative w-full max-w-6xl mx-auto z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-center mb-16 text-center select-none">
          <div className="flex items-center gap-2 mb-2">
            <Crosshair className={`w-6 h-6 animate-spin ${battleMode ? "text-red-500" : "text-cyanGlow"}`} />
            <span className={`font-orbitron text-xs tracking-[0.4em] uppercase ${battleMode ? "text-red-400" : "text-cyanGlow"}`}>
              System: Online
            </span>
          </div>
          <h2 className={`font-orbitron font-extrabold text-3xl md:text-5xl tracking-widest uppercase transition-colors duration-500 ${
            battleMode ? "text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" : "text-white"
          }`}>
            GAMING REALM
          </h2>
          <div className={`w-32 h-[2px] bg-gradient-to-r mt-4 ${battleMode ? "from-red-500 via-purple-600 to-transparent" : "from-cyanGlow via-neonBlue to-transparent"}`} />
          <p className="font-outfit text-white/50 text-xs md:text-sm tracking-widest uppercase mt-3">
            {battleMode ? "COZY CALM OFFLINE // BATTLE SYSTEM ENGAGED" : "Holographic panel controls"}
          </p>
        </div>

        {/* Parallax Cyber HUD Container */}
        <div
          ref={layerRef}
          className="w-full max-w-4xl mx-auto glass-panel-cyber rounded-3xl p-6 md:p-12 relative flex flex-col md:flex-row items-center gap-12"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Neon side border flares */}
          <div className={`absolute top-0 left-12 w-24 h-[2px] transition-colors duration-[1s] ${battleMode ? "bg-red-500" : "bg-cyanGlow"}`} />
          <div className={`absolute bottom-0 right-12 w-24 h-[2px] transition-colors duration-[1s] ${battleMode ? "bg-purple-500" : "bg-neonBlue"}`} />

          {/* Left panel: Mode controls & interactive buttons */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-orbitron text-xs text-white/40 tracking-wider uppercase mb-1">
              Active profile
            </span>
            <h3 className={`font-orbitron font-bold text-2xl md:text-3xl text-white tracking-widest mb-4 transition-colors duration-500 ${battleMode ? "text-red-400" : "text-cyanGlow"}`}>
              SHIZUKA MODE
            </h3>
            <p className="font-outfit text-white/70 text-sm md:text-base leading-relaxed mb-8">
              A cozy virtual domain crafted for gaming and aesthetic appreciation. Experience deep storytelling and casual gameplay overlays.
            </p>

            {/* Battle mode toggle centerpiece */}
            <motion.button
              onClick={() => setBattleMode(!battleMode)}
              className={`interactive px-8 py-3.5 rounded-xl font-orbitron font-bold text-sm tracking-widest border transition-all duration-300 shadow-md ${
                battleMode
                  ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-red-500/10"
                  : "bg-cyanGlow/10 border-cyanGlow text-cyanGlow hover:bg-cyanGlow hover:text-dreamBlue-deep shadow-cyan/10"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {battleMode ? "DEACTIVATE BATTLE MODE" : "ACTIVATE BATTLE MODE"}
            </motion.button>
            <span className="font-outfit text-[10px] text-white/30 tracking-widest uppercase mt-3 select-none">
              Click to override cozy color themes
            </span>
          </div>

          {/* Right panel: Animated Stat meters */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <h4 className="font-orbitron font-bold text-xs tracking-wider text-white/50 uppercase mb-2">
              Performance Indicators
            </h4>
            
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-2 font-spaceGrotesk text-xs tracking-wider">
                  <div className="flex items-center gap-2 text-white/80">
                    {stat.icon}
                    <span>{stat.name}</span>
                  </div>
                  <span className={battleMode ? "text-red-400 font-bold" : "text-cyanGlow font-bold"}>
                    {stat.value}%
                  </span>
                </div>
                
                {/* Meter container */}
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                  {/* Glowing progress filling */}
                  <motion.div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      battleMode
                        ? "bg-gradient-to-r from-red-600 to-purple-600 shadow-red-500/50"
                        : "bg-gradient-to-r from-cyanGlow to-neonBlue"
                    }`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${stat.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: i * 0.15 }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
