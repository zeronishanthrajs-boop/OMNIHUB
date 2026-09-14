import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Heart, Gamepad2, Sparkles } from "lucide-react";

export default function IdentityScene() {
  const cards = [
    {
      title: "BCom Graduate",
      icon: <GraduationCap className="w-6 h-6 text-cyanGlow" />,
      desc: "Balancing analytical business concepts with infinite digital artistry. A unique blend of structured finance knowledge and absolute creative exploration.",
      delay: 0.1,
    },
    {
      title: "Rabbit Lover",
      icon: <Heart className="w-6 h-6 text-pink-400" />,
      desc: "Captivated by soft fluffy creatures and calm aesthetics. Designing comforting environments filled with cute symbols and gentle details.",
      delay: 0.25,
    },
    {
      title: "Gamer Identity",
      icon: <Gamepad2 className="w-6 h-6 text-neonBlue" />,
      desc: "Immersed in fantasy worlds, virtual stories, and tactical cooperation. Expressing a cozy yet competitive gamer soul under the name Shizuka.",
      delay: 0.4,
    },
    {
      title: "Aesthetic Mind",
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      desc: "Obsessed with perfect visual alignments, vaporwave/dreamcore tones, and creating interactive structures that evoke a cozy, cinematic mood.",
      delay: 0.55,
    },
  ];

  return (
    <section
      id="identity"
      className="relative min-h-screen w-full flex flex-col justify-center py-20 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-dreamBlue-deep via-dreamBlue-dark to-dreamBlue-deep"
    >
      {/* Background soft ambient glowing circles */}
      <div className="absolute top-1/2 left-[5%] w-[400px] h-[400px] bg-neonBlue/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-[5%] w-[450px] h-[450px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-6xl mx-auto z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-center mb-16 text-center select-none">
          <h2 className="font-orbitron font-extrabold text-3xl md:text-5xl tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            THE IDENTITY
          </h2>
          <div className="w-24 h-[2px] bg-gradient-to-r from-cyanGlow via-neonBlue to-transparent mt-4" />
          <p className="font-outfit text-white/50 text-xs md:text-sm tracking-widest uppercase mt-3">
            Floating memories of a digital soul
          </p>
        </div>

        {/* Dynamic Centerpiece: Interactive Profile Avatar */}
        <div className="flex flex-col items-center mb-16">
          <motion.div
            className="interactive relative w-36 h-36 md:w-44 md:h-44 rounded-full border border-white/20 p-2 bg-gradient-to-tr from-cyanGlow/20 to-white/10 group cursor-pointer shadow-lg shadow-black/30"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Glowing inner avatar shell */}
            <div className="w-full h-full rounded-full bg-dreamBlue-deep overflow-hidden border border-white/10 flex items-center justify-center relative">
              
              {/* Premium Vector Shizuka Profile Avatar Graphic */}
              <svg viewBox="0 0 100 100" className="w-24 h-24 mt-2">
                {/* Hair back */}
                <path d="M25,55 C25,25 75,25 75,55 C75,55 75,70 75,75" fill="#1e4b85" />
                {/* Neck */}
                <rect x="46" y="60" width="8" height="15" fill="#fdd4c5" />
                {/* Face */}
                <path d="M30,45 C30,30 70,30 70,45 C70,60 65,65 50,65 C35,65 30,60 30,45 Z" fill="#ffe5db" />
                {/* Blush cheeks */}
                <circle cx="38" cy="52" r="4" fill="#ffa7a7" opacity="0.6" />
                <circle cx="62" cy="52" r="4" fill="#ffa7a7" opacity="0.6" />
                {/* Cute eyes (closed happy arcs) */}
                <path d="M35,46 Q40,43 43,47" fill="none" stroke="#0a1c36" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M57,47 Q60,43 65,46" fill="none" stroke="#0a1c36" strokeWidth="2.5" strokeLinecap="round" />
                {/* Sweet smile */}
                <path d="M47,54 Q50,57 53,54" fill="none" stroke="#0a1c36" strokeWidth="2" strokeLinecap="round" />
                {/* Bangs hair */}
                <path d="M28,42 C35,28 65,28 72,42 C68,36 60,38 58,40 C55,42 52,38 50,40 C48,42 45,38 42,40 C40,41 32,36 28,42 Z" fill="#153664" />
                {/* Hair buns (Odango style) */}
                <circle cx="26" cy="28" r="9" fill="#153664" />
                <circle cx="74" cy="28" r="9" fill="#153664" />
              </svg>
              
              {/* Floating aesthetic cyber glints */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyanGlow/10 via-transparent to-white/5 pointer-events-none" />
            </div>

            {/* Glowing neon ears revealed on hover */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-16 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0">
              <div className="w-4 h-14 bg-gradient-to-t from-cyanGlow via-white to-transparent rounded-t-full rotate-[-15deg] shadow-cyan filter drop-shadow-[0_0_8px_#00f5ff]" />
              <div className="w-4 h-14 bg-gradient-to-t from-cyanGlow via-white to-transparent rounded-t-full rotate-[15deg] shadow-cyan filter drop-shadow-[0_0_8px_#00f5ff]" />
            </div>
            
            {/* Interactive outer glowing border pulse */}
            <div className="absolute inset-0 rounded-full border border-cyanGlow/0 group-hover:border-cyanGlow/50 group-hover:scale-105 transition-all duration-300 animate-neon-pulse pointer-events-none" />
          </motion.div>

          <span className="font-spaceGrotesk text-sm font-semibold tracking-[0.2em] uppercase text-white mt-4 text-center">
            shizuka
          </span>
          <span className="font-outfit text-xs text-cyanGlow tracking-widest uppercase mt-1 animate-pulse">
            Active Mode
          </span>
        </div>

        {/* 3D Glass Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 justify-items-center">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className="w-full max-w-lg rounded-2xl p-6 md:p-8 glass-panel border border-white/10 hover:border-cyanGlow/40 hover:bg-white/10 transition-all duration-300 relative group cursor-default shadow-md hover:shadow-cyan/10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: card.delay }}
              whileHover={{
                rotateX: 2,
                rotateY: -2,
                scale: 1.02,
                z: 10,
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Border glow gradient highlight */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyanGlow/0 via-transparent to-white/0 group-hover:from-cyanGlow/5 group-hover:to-white/5 pointer-events-none transition-all duration-500" />

              {/* Card Title Header with Icons */}
              <div className="flex items-center gap-4 mb-4" style={{ transform: "translateZ(30px)" }}>
                <div className="p-3 bg-white/5 rounded-xl border border-white/15 transition-colors duration-300 group-hover:bg-white/10 group-hover:border-cyanGlow/30">
                  {card.icon}
                </div>
                <h3 className="font-orbitron font-bold text-lg md:text-xl text-white tracking-widest">
                  {card.title}
                </h3>
              </div>

              {/* Card Description Text */}
              <p
                className="font-outfit text-white/70 text-sm md:text-base leading-relaxed tracking-wide"
                style={{ transform: "translateZ(20px)" }}
              >
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
