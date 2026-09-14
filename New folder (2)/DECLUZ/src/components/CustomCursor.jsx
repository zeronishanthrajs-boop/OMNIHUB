import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const particlesRef = useRef([]);
  const canvasRef = useRef(null);

  // Custom Cursor Positions using Framer Motion springs for ultra-inertia feel
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 30, stiffness: 250, mass: 0.5 };
  const cursorSpringX = useSpring(cursorX, springConfig);
  const cursorSpringY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      if (!visible) setVisible(true);

      // Generate sparkles upon mouse movement inside canvas
      if (canvasRef.current && Math.random() < 0.35) {
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.4, // float slightly upward
          alpha: 1.0,
          radius: Math.random() * 2 + 1,
          color: Math.random() < 0.6 ? "#00f5ff" : "#e6e6fa",
        });
      }
    };

    const handleMouseDown = () => {
      setClicked(true);
      setTimeout(() => setClicked(false), 200);
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    const handleHoverStart = (e) => {
      const target = e.target;
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("interactive") ||
        target.closest(".interactive");
      if (isInteractive) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseover", handleHoverStart);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseover", handleHoverStart);
    };
  }, [visible, cursorX, cursorY]);

  // Trail Particle Canvas render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        // Draw small sparkle stars or bubbles
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Particle trail canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9999] block"
      />

      {/* Main custom glowing rabbit cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10000] rounded-full mix-blend-screen flex items-center justify-center"
        style={{
          x: cursorSpringX,
          y: cursorSpringY,
          translateX: "-50%",
          translateY: "-50%",
          width: hovered ? 44 : 20,
          height: hovered ? 44 : 20,
          backgroundColor: hovered ? "rgba(0, 245, 255, 0.2)" : "rgba(0, 128, 255, 0.4)",
          border: hovered ? "2px solid #00f5ff" : "1px solid rgba(0, 245, 255, 0.8)",
          boxShadow: hovered
            ? "0 0 25px #00f5ff, inset 0 0 10px #00f5ff"
            : "0 0 15px rgba(0, 128, 255, 0.7)",
          scale: clicked ? 0.75 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* Sleek central core rabbit dot */}
        <motion.div
          className="rounded-full bg-white"
          animate={{
            width: hovered ? 8 : 4,
            height: hovered ? 8 : 4,
            boxShadow: "0 0 10px #ffffff",
          }}
        />

        {/* Small bunny ear outline indicators if hovered */}
        {hovered && (
          <div className="absolute -top-3 w-8 flex justify-between px-0.5 animate-bounce">
            <div className="w-1.5 h-3.5 bg-[#00f5ff] rounded-t-full rotate-[-12deg]" />
            <div className="w-1.5 h-3.5 bg-[#00f5ff] rounded-t-full rotate-[12deg]" />
          </div>
        )}
      </motion.div>
    </>
  );
}
