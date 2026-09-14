import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";

export default function RabbitGalaxy() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeMessage, setActiveMessage] = useState("");
  const [clickedSpirits, setClickedSpirits] = useState(new Set());
  const [showSecretModal, setShowSecretModal] = useState(false);

  const rabbitMessages = [
    "Achievement unlocked: soft soul 🌸",
    "Respawning happiness... please wait 💫",
    "Loading another dream... 😴",
    "You are doing amazing today! 💖",
    "Everything you seek is seeking you ✨",
    "Cozy energy fully recharged! 🔋🌸",
  ];

  // Spirited Rabbits floating across galaxy
  const initialSpirits = [
    { id: 1, x: "20%", y: "30%", scale: 1.1, label: "Sprout" },
    { id: 2, x: "75%", y: "25%", scale: 0.9, label: "Starry" },
    { id: 3, x: "15%", y: "70%", scale: 1.0, label: "Cosmo" },
    { id: 4, x: "80%", y: "65%", scale: 1.2, label: "Nebula" },
    { id: 5, x: "45%", y: "80%", scale: 0.85, label: "Luna" },
  ];

  // Galaxy Particle Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];
    const constellationPoints = [];

    // Map a cute rabbit constellation outline relative to canvas width/height
    const generateConstellationPoints = (width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const points = [];

      // Head circle
      for (let a = 0; a < Math.PI * 2; a += 0.4) {
        points.push({ x: cx + Math.cos(a) * 45, y: cy + Math.sin(a) * 45 });
      }
      // Left Ear
      for (let i = 0; i <= 6; i++) {
        points.push({ x: cx - 25 - i * 3, y: cy - 40 - i * 15 });
        points.push({ x: cx - 10 - i * 2, y: cy - 40 - i * 15 });
      }
      // Right Ear
      for (let i = 0; i <= 6; i++) {
        points.push({ x: cx + 25 + i * 3, y: cy - 40 - i * 15 });
        points.push({ x: cx + 10 + i * 2, y: cy - 40 - i * 15 });
      }
      // Face details
      points.push({ x: cx - 12, y: cy - 5 }); // Left eye
      points.push({ x: cx + 12, y: cy - 5 }); // Right eye
      points.push({ x: cx, y: cy + 12 });     // Nose

      return points;
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGalaxy();
    };

    const initGalaxy = () => {
      particles = [];
      const points = generateConstellationPoints(canvas.width, canvas.height);
      const density = Math.min(300, Math.floor((canvas.width * canvas.height) / 3800));

      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.min(canvas.width, canvas.height) * 0.4 + 40;
        
        // Pick an associated constellation point for some stars to snap to on scroll/proximity
        const mappedPoint = points[i % points.length];

        particles.push({
          x: canvas.width / 2 + Math.cos(angle) * dist,
          y: canvas.height / 2 + Math.sin(angle) * dist,
          ox: canvas.width / 2 + Math.cos(angle) * dist, // original coordinates
          oy: canvas.height / 2 + Math.sin(angle) * dist,
          cx: mappedPoint.x, // target constellation coordinates
          cy: mappedPoint.y,
          size: Math.random() * 2.2 + 0.5,
          color: i % 4 === 0 ? "rgba(0, 245, 255, 0.7)" : i % 5 === 0 ? "rgba(230, 230, 250, 0.8)" : "rgba(255, 255, 255, 0.6)",
          speed: Math.random() * 0.005 + 0.002,
          angle,
          dist,
          snapFactor: 0, // 0 = standard spiral, 1 = snapped constellation
        });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track scroll to trigger constellation morphing
    const handleScroll = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      // Calculate active intersection factor
      const middleY = rect.top + rect.height / 2;
      const distanceFromCenter = Math.abs(viewHeight / 2 - middleY);
      const snapRange = viewHeight * 0.6;

      let factor = 0;
      if (distanceFromCenter < snapRange) {
        factor = (snapRange - distanceFromCenter) / snapRange;
      }

      particles.forEach((p) => {
        p.snapFactor = Math.min(1.0, factor * 1.35); // Boost morphing curve
      });
    };

    window.addEventListener("scroll", handleScroll);

    // Animating render
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Increment orbital angle in standard spiral mode
        p.angle += p.speed;
        
        // Calculate orbital coordinates
        const orbX = canvas.width / 2 + Math.cos(p.angle) * p.dist;
        const orbY = canvas.height / 2 + Math.sin(p.angle) * p.dist;

        // Smooth morphing interpolation between spiral and rabbit constellation
        const finalX = orbX * (1 - p.snapFactor) + p.cx * p.snapFactor;
        const finalY = orbY * (1 - p.snapFactor) + p.cy * p.snapFactor;

        // Draw particle with glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(finalX, finalY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        if (p.snapFactor > 0.4) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#00f5ff";
        }
        
        ctx.fill();
        ctx.restore();
      });

      // Draw starry lines connecting the constellation when highly snapped
      const sample = particles[0];
      if (sample && sample.snapFactor > 0.6) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 245, 255, ${(sample.snapFactor - 0.6) * 1.5})`;
        ctx.lineWidth = 0.5;
        
        // Gather snapped constellation points
        const activeConst = particles.filter(p => p.snapFactor > 0.6).slice(0, 80);
        for (let i = 0; i < activeConst.length; i++) {
          for (let j = i + 1; j < activeConst.length; j++) {
            const dist = Math.hypot(activeConst[i].cx - activeConst[j].cx, activeConst[i].cy - activeConst[j].cy);
            if (dist < 40) {
              const startX = activeConst[i].ox * (1 - activeConst[i].snapFactor) + activeConst[i].cx * activeConst[i].snapFactor;
              const startY = activeConst[i].oy * (1 - activeConst[i].snapFactor) + activeConst[i].cy * activeConst[i].snapFactor;
              const endX = activeConst[j].ox * (1 - activeConst[j].snapFactor) + activeConst[j].cx * activeConst[j].snapFactor;
              const endY = activeConst[j].oy * (1 - activeConst[j].snapFactor) + activeConst[j].cy * activeConst[j].snapFactor;
              
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle click on floating rabbit spirits
  const handleSpiritClick = (id) => {
    const updated = new Set(clickedSpirits);
    updated.add(id);
    setClickedSpirits(updated);

    // Dynamic message reveal
    const nextMsg = rabbitMessages[(id - 1) % rabbitMessages.length];
    setActiveMessage(nextMsg);

    // Burst visual sparkles using canvas-confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#00f5ff", "#e6e6fa", "#ffffff"],
    });

    // Check if all are clicked
    if (updated.size === initialSpirits.length) {
      setTimeout(() => {
        setShowSecretModal(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#00f5ff", "#e6e6fa", "#0080ff"],
        });
      }, 1200);
    }
  };

  return (
    <section
      id="galaxy"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-dreamBlue-deep select-none"
    >
      {/* Dynamic Star Spiral and Morphing Constellation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 gpu-accelerated block"
      />

      {/* Floating Ambient Nebulas */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Section content */}
      <div className="relative w-full max-w-6xl mx-auto z-10 flex flex-col justify-between items-center text-center px-6 min-h-screen py-24 pointer-events-none">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <h2 className="font-orbitron font-extrabold text-3xl md:text-5xl tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            RABBIT GALAXY
          </h2>
          <div className="w-24 h-[2px] bg-gradient-to-r from-cyanGlow via-neonBlue to-transparent mt-4" />
          <p className="font-outfit text-white/50 text-xs md:text-sm tracking-widest uppercase mt-3">
            Scroll centered to gather the celestial bunny constellation
          </p>
        </div>

        {/* Dynamic floating cozy alert overlay */}
        <div className="h-16 flex items-center justify-center pointer-events-auto">
          <AnimatePresence mode="wait">
            {activeMessage && (
              <motion.div
                key={activeMessage}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                className="px-6 py-3 rounded-full glass-panel-glow border border-cyanGlow/40 font-spaceGrotesk text-xs tracking-wider uppercase text-cyanGlow shadow-lg shadow-cyan/5 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyanGlow animate-spin" />
                {activeMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Counter of clicked spirits */}
        <div className="flex flex-col items-center select-none font-orbitron text-xs tracking-widest text-white/40">
          <span>COSMIC SHARDS HARVESTED</span>
          <span className="text-white font-bold text-lg mt-1 tracking-[0.2em] font-mono">
            {clickedSpirits.size} / {initialSpirits.length}
          </span>
        </div>

      </div>

      {/* Floating Interactive Rabbit Spirits */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {initialSpirits.map((spirit) => {
          const isClicked = clickedSpirits.has(spirit.id);
          return (
            <motion.button
              key={spirit.id}
              onClick={() => handleSpiritClick(spirit.id)}
              className="interactive absolute pointer-events-auto flex flex-col items-center group"
              style={{
                left: spirit.x,
                top: spirit.y,
              }}
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 6 + spirit.id * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.15 }}
            >
              {/* Spirit Outer Pulse */}
              <div
                className={`w-14 h-14 rounded-full border border-dashed flex items-center justify-center transition-all duration-500 relative ${
                  isClicked
                    ? "border-purple-500/20 bg-purple-500/5 shadow-none"
                    : "border-cyanGlow/30 bg-cyanGlow/5 group-hover:border-cyanGlow group-hover:shadow-cyan"
                }`}
              >
                {/* Custom Glowing SVG Rabbit Spirit */}
                <svg
                  viewBox="0 0 100 100"
                  className={`w-10 h-10 transition-colors duration-300 ${
                    isClicked ? "fill-purple-400 opacity-40" : "fill-white group-hover:fill-cyanGlow"
                  }`}
                >
                  <path d="M50 85 C35 85 20 70 20 50 C20 30 35 30 35 45 C38 30 42 30 45 30 C48 30 52 30 55 45 C55 30 70 30 70 50 C70 70 65 85 50 85 Z" />
                  <path d="M40 35 C38 25 30 5 35 0 C40 0 43 25 42 35 Z" />
                  <path d="M60 35 C62 25 70 5 65 0 C60 0 57 25 58 35 Z" />
                </svg>

                {/* Sparkling orbit aura when unclicked */}
                {!isClicked && (
                  <div className="absolute inset-0 rounded-full border border-cyanGlow/10 animate-ping pointer-events-none" />
                )}
              </div>
              <span className={`font-spaceGrotesk text-[10px] tracking-widest uppercase mt-2 transition-colors duration-300 ${
                isClicked ? "text-purple-400/40" : "text-white/40 group-hover:text-cyanGlow"
              }`}>
                {spirit.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Secret Completion Achievement Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -30 }}
              className="w-full max-w-md glass-panel-glow rounded-3xl p-6 md:p-8 border border-cyanGlow/30 relative text-center flex flex-col items-center"
            >
              <button
                onClick={() => setShowSecretModal(false)}
                className="interactive absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
              >
                <X className="w-5 h-5 text-white/60 hover:text-white" />
              </button>

              <div className="p-4 bg-cyanGlow/10 rounded-full border border-cyanGlow/30 mb-6 animate-bounce">
                <Trophy className="w-8 h-8 text-cyanGlow" />
              </div>

              <span className="font-orbitron text-xs tracking-wider text-cyanGlow uppercase font-bold mb-1">
                Cosmic Shards Unlocked
              </span>
              <h3 className="font-orbitron font-extrabold text-xl md:text-2xl text-white tracking-widest mb-4">
                SANCTUARY ALIGNMENT COMPLETED
              </h3>
              
              <p className="font-outfit text-white/80 text-sm md:text-base leading-relaxed mb-6 font-medium italic">
                “In the vast expanses of cyberspace, amongst millions of coordinates, finding a cozy sanctuary to rest is the ultimate victory. Respawn happiness inside your thoughts today.”
              </p>

              <button
                onClick={() => setShowSecretModal(false)}
                className="interactive w-full py-3 rounded-xl bg-cyanGlow font-orbitron font-bold text-xs tracking-widest text-dreamBlue-deep hover:bg-white hover:text-dreamBlue-deep hover:shadow-white transition-all duration-300"
              >
                RETURN TO GALAXY
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
