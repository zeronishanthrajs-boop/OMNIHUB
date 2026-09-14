import React, { useState, useEffect } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";

export default function Navbar({ audioPlaying, setAudioPlaying }) {
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll offset for navbar glass intensity shift
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[999] transition-all duration-500 py-4 px-6 md:px-12 flex justify-between items-center ${
        scrolled
          ? "backdrop-blur-md bg-dreamBlue-deep/60 border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Branding Rabbit Logo */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => handleScrollTo("portal")}
      >
        <div className="relative w-8 h-8 flex items-center justify-center bg-white/10 rounded-full border border-white/20 transition-all duration-300 group-hover:border-cyanGlow group-hover:shadow-cyan overflow-visible">
          {/* Bunny silhouette icon / ears */}
          <div className="absolute top-1 w-5 flex justify-between px-0.5">
            <div className="w-1 h-3.5 bg-white group-hover:bg-cyanGlow rounded-t-full rotate-[-12deg] transition-all duration-300 origin-bottom group-hover:rotate-[-25deg]" />
            <div className="w-1 h-3.5 bg-white group-hover:bg-cyanGlow rounded-t-full rotate-[12deg] transition-all duration-300 origin-bottom group-hover:rotate-[25deg]" />
          </div>
          <div className="absolute bottom-1.5 w-4 h-3 bg-white group-hover:bg-cyanGlow rounded-full flex items-center justify-center transition-all duration-300">
            {/* Small eyes */}
            <div className="w-0.5 h-0.5 bg-dreamBlue-deep rounded-full -translate-x-0.5" />
            <div className="w-0.5 h-0.5 bg-dreamBlue-deep rounded-full translate-x-0.5" />
          </div>
        </div>
        <span className="font-orbitron font-bold text-lg md:text-xl tracking-wider text-white select-none">
          SHIZUKA<span className="text-cyanGlow group-hover:text-neonBlue transition-colors duration-300">VERSE</span>
        </span>
      </div>

      {/* Modern Navigation Links */}
      <div className="hidden md:flex items-center gap-8 font-spaceGrotesk text-sm tracking-wide text-white/80">
        {[
          { label: "Portal", id: "portal" },
          { label: "Identity", id: "identity" },
          { label: "Gaming", id: "gaming" },
          { label: "Galaxy", id: "galaxy" },
          { label: "Memory", id: "memory" },
          { label: "Ending", id: "ending" },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => handleScrollTo(link.id)}
            className="hover:text-cyanGlow transition-colors duration-300 font-medium tracking-widest uppercase text-xs relative group"
          >
            {link.label}
            <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-cyanGlow transition-all duration-300 group-hover:w-full" />
          </button>
        ))}
      </div>

      {/* Dreamy Ambient Music Wave Toggler */}
      <button
        onClick={() => setAudioPlaying(!audioPlaying)}
        className="interactive flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md bg-white/5 border border-white/10 hover:border-cyanGlow/50 hover:bg-white/10 transition-all duration-300 group shadow-md shadow-black/10"
      >
        {/* Animated wave bars when audio is playing */}
        <div className="flex items-end gap-[2px] w-6 h-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-[2px] bg-cyanGlow rounded-full transition-all duration-300 ${
                audioPlaying ? "animate-wave" : "h-[2px]"
              }`}
              style={{
                height: audioPlaying ? "auto" : "2px",
                animationDelay: audioPlaying ? `${index * 0.15}s` : "0s",
                animationDuration: "0.8s",
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
                animationName: audioPlaying ? "audioWaveAnimation" : "none",
              }}
            />
          ))}
        </div>

        {audioPlaying ? (
          <Volume2 className="w-4 h-4 text-cyanGlow animate-pulse" />
        ) : (
          <VolumeX className="w-4 h-4 text-white/50 group-hover:text-white transition-colors duration-300" />
        )}

        <span className="hidden sm:inline font-outfit text-xs font-semibold tracking-wider uppercase text-white/80 group-hover:text-white transition-colors duration-300">
          {audioPlaying ? "Mute Ambient" : "Play Ambient"}
        </span>

        {/* Global style keyframe injector for wave bars */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes audioWaveAnimation {
            0%, 100% { height: 4px; }
            50% { height: 16px; }
          }
        `}} />
      </button>
    </nav>
  );
}
