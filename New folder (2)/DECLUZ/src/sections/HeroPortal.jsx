import React, { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";

export default function HeroPortal() {
  const headingRef = useRef(null);
  const containerRef = useRef(null);
  const moonRef = useRef(null);
  const bunnyRef = useRef(null);

  useEffect(() => {
    // Letter-by-letter animated timeline setup using GreenSock
    const textNode1 = headingRef.current.querySelector(".line-1");
    const textNode2 = headingRef.current.querySelector(".line-2");

    const splitTextIntoSpans = (element) => {
      const text = element.innerText;
      element.innerHTML = "";
      [...text].forEach((char) => {
        const span = document.createElement("span");
        span.innerText = char === " " ? "\u00A0" : char;
        span.className = "inline-block opacity-0 translate-y-4 filter blur-[2px]";
        element.appendChild(span);
      });
    };

    splitTextIntoSpans(textNode1);
    splitTextIntoSpans(textNode2);

    const t1 = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Introductory load animations
    t1.to(headingRef.current, { opacity: 1, duration: 0.1 })
      .to(
        textNode1.children,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.04,
        },
        "+=0.2"
      )
      .to(
        textNode2.children,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.04,
        },
        "+=0.3"
      );

    // Parallax mouse movements for the moon and rabbit silhouette
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xOffset = (clientX - window.innerWidth / 2) * 0.025;
      const yOffset = (clientY - window.innerHeight / 2) * 0.025;

      gsap.to(moonRef.current, {
        x: xOffset,
        y: yOffset,
        duration: 1.2,
        ease: "power2.out",
      });

      gsap.to(bunnyRef.current, {
        x: xOffset * 0.4,
        y: yOffset * 0.4,
        duration: 1.5,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleScrollNext = () => {
    const nextSection = document.getElementById("identity");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="portal"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 overflow-hidden py-24 select-none"
    >
      {/* Dynamic glow overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyanGlow/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="relative w-full max-w-6xl mx-auto flex flex-col justify-center items-center text-center z-10">
        
        {/* Cinematic Parallax Glowing Moon & Rabbit Backdrop */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 mb-8 flex items-center justify-center">
          {/* Glowing Moon base */}
          <div
            ref={moonRef}
            className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-cyanGlow/40 via-white to-lavenderGlow/60 shadow-cyanThick flex items-center justify-center animate-neon-pulse gpu-accelerated"
          >
            {/* Soft inner texture ring */}
            <div className="w-11/12 h-11/12 rounded-full border border-white/20 bg-gradient-to-tr from-cyan-400/20 via-transparent to-white/10" />
          </div>

          {/* Parallax rabbit silhouette overlay */}
          <div
            ref={bunnyRef}
            className="absolute z-20 w-44 h-44 md:w-56 md:h-56 filter drop-shadow-[0_0_12px_rgba(3,11,30,0.9)] opacity-90 transition-transform duration-300 pointer-events-none"
          >
            <svg
              viewBox="0 0 200 200"
              fill="#030b1e"
              className="w-full h-full"
            >
              {/* Cute Rabbit Sitting and looking up */}
              <path d="M100 180 C80 180 50 160 50 130 C50 100 80 100 80 120 C85 100 95 100 100 100 C105 100 115 100 120 120 C120 100 150 100 150 130 C150 160 120 180 100 180 Z" />
              {/* Left long ear */}
              <path d="M85 110 C80 80 60 20 75 10 C85 5 95 65 92 102 Z" fill="#030b1e" />
              <path d="M86 100 C83 80 68 30 78 22 C84 18 92 65 90 92 Z" fill="rgba(0, 245, 255, 0.4)" />
              {/* Right long ear */}
              <path d="M115 110 C120 80 140 20 125 10 C115 5 105 65 108 102 Z" fill="#030b1e" />
              <path d="M114 100 C117 80 132 30 122 22 C116 18 108 65 110 92 Z" fill="rgba(0, 245, 255, 0.4)" />
            </svg>
          </div>
        </div>

        {/* Cinematic narrative reveal heading */}
        <div
          ref={headingRef}
          className="opacity-0 flex flex-col items-center gap-2 select-none"
        >
          <h1 className="line-1 font-orbitron font-extrabold text-2xl md:text-5xl tracking-[0.18em] text-white uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
            Some people play games.
          </h1>
          <h2 className="line-2 font-spaceGrotesk font-light text-cyanGlow text-base md:text-2xl tracking-[0.25em] uppercase mt-2 drop-shadow-[0_0_10px_rgba(0,245,255,0.4)]">
            Some people build worlds.
          </h2>
        </div>

        {/* Micro intro-note */}
        <p className="mt-8 font-outfit text-white/50 text-xs md:text-sm tracking-widest uppercase animate-pulse">
          Explore Shizuka's Digital Sanctuary
        </p>

        {/* Pulse scrolling prompt */}
        <button
          onClick={handleScrollNext}
          className="interactive mt-16 p-3 rounded-full bg-white/5 border border-white/10 hover:border-cyanGlow/50 hover:bg-cyanGlow/10 transition-all duration-300 hover:shadow-cyan animate-bounce group"
        >
          <ChevronDown className="w-5 h-5 text-white/80 group-hover:text-cyanGlow transition-colors duration-300" />
        </button>
      </div>

      {/* Floating cinematic side clouds overlay */}
      <div className="absolute top-1/3 left-[-150px] w-96 h-96 bg-white/5 blur-[80px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-[-100px] w-[500px] h-[500px] bg-cyanGlow/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
    </section>
  );
}
