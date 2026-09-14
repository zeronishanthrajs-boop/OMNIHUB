import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import confetti from "canvas-confetti";

import Navbar from "./components/Navbar";
import CustomCursor from "./components/CustomCursor";
import BackgroundStars from "./components/BackgroundStars";

import HeroPortal from "./sections/HeroPortal";
import IdentityScene from "./sections/IdentityScene";
import GamingRealm from "./sections/GamingRealm";
import RabbitGalaxy from "./sections/RabbitGalaxy";
import MemoryClouds from "./sections/MemoryClouds";
import EndingScene from "./sections/EndingScene";

export default function App() {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const synthRef = useRef(null);
  const keysPressedRef = useRef([]);

  // 1. Globally initialize Lenis smooth scrolling engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom cubic easing
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // 2. Play/Pause real-time Web Audio Synthesizer loops
  useEffect(() => {
    if (audioPlaying) {
      startCozySynth();
    } else {
      stopCozySynth();
    }

    return () => stopCozySynth();
  }, [audioPlaying]);

  const startCozySynth = () => {
    if (synthRef.current) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();

      // Master volume controller
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, ctx.currentTime);

      // Lowpass filter for that warm, cozy, analog lofi feel
      const lofiFilter = ctx.createBiquadFilter();
      lofiFilter.type = "lowpass";
      lofiFilter.frequency.setValueAtTime(750, ctx.currentTime);
      lofiFilter.Q.setValueAtTime(1.0, ctx.currentTime);

      // Analog-style Feedback Stereo Delay node
      const delayNode = ctx.createDelay();
      delayNode.delayTime.setValueAtTime(0.45, ctx.currentTime);
      
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.setValueAtTime(0.4, ctx.currentTime);

      // Node network linking
      masterGain.connect(lofiFilter);
      lofiFilter.connect(ctx.destination);

      delayNode.connect(delayFeedback);
      delayFeedback.connect(lofiFilter);
      lofiFilter.connect(delayNode); // loop feedback

      let isPlaying = true;
      let nextChordsTimeout = null;

      // Dreamy space lofi chord progression: Cmaj9 -> Am9 -> Fmaj7 -> G6
      const chords = [
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9 (C3, E3, G3, B3, D4)
        [110.00, 146.83, 164.81, 196.00, 220.00], // Am9 (A2, D3, E3, G3, A3)
        [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj9 (F2, C3, F3, A3, C4)
        [98.00, 146.83, 196.00, 246.94, 293.66],  // G6 (G2, D3, G3, B3, D4)
      ];
      let chordIndex = 0;

      const triggerSwell = () => {
        if (!isPlaying) return;

        const now = ctx.currentTime;
        const currentChord = chords[chordIndex];

        // Swelling envelope timing parameters
        const attackTime = 1.8;
        const sustainTime = 3.2;
        const releaseTime = 1.5;

        currentChord.forEach((frequency, index) => {
          const oscNode = ctx.createOscillator();
          const oscGain = ctx.createGain();

          // Smooth triangle & sine mix to keep tones extremely mellow and non-aggressive
          oscNode.type = index % 2 === 0 ? "triangle" : "sine";
          oscNode.frequency.setValueAtTime(frequency, now);

          oscNode.connect(oscGain);
          oscGain.connect(masterGain);

          // Swell envelope activation
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.linearRampToValueAtTime(0.04 / currentChord.length, now + attackTime + index * 0.08);
          oscGain.gain.setValueAtTime(0.04 / currentChord.length, now + attackTime + sustainTime);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + sustainTime + releaseTime);

          oscNode.start(now);
          oscNode.stop(now + attackTime + sustainTime + releaseTime);
        });

        chordIndex = (chordIndex + 1) % chords.length;
        // Repeat arpeggiations
        nextChordsTimeout = setTimeout(triggerSwell, 5800);
      };

      triggerSwell();

      synthRef.current = {
        ctx,
        stop: () => {
          isPlaying = false;
          clearTimeout(nextChordsTimeout);
          ctx.close().catch(() => {});
        },
      };
    } catch (error) {
      console.warn("Web Audio API not supported or initialized failed.", error);
    }
  };

  const stopCozySynth = () => {
    if (synthRef.current) {
      synthRef.current.stop();
      synthRef.current = null;
    }
  };

  // 3. Konami Code Easter Egg listener (↑ ↑ ↓ ↓ ← →)
  useEffect(() => {
    const konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];

    const handleKeyDown = (e) => {
      keysPressedRef.current.push(e.key);
      
      // Slice tracking array to maintain code sequence comparison length
      if (keysPressedRef.current.length > konamiCode.length) {
        keysPressedRef.current.shift();
      }

      // If matched, trigger a gorgeous full-screen rabbit rain shower
      if (JSON.stringify(keysPressedRef.current) === JSON.stringify(konamiCode)) {
        triggerRabbitConfettiRain();
        keysPressedRef.current = []; // reset key logs
      }
    };

    const triggerRabbitConfettiRain = () => {
      const end = Date.now() + 4 * 1000; // 4 seconds duration
      const colors = ["#00f5ff", "#e6e6fa", "#ffffff", "#0080ff"];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.85 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.85 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-dreamBlue-deep text-white selection:bg-cyanGlow/30 selection:text-cyanGlow overflow-x-hidden">
      
      {/* Premium custom mouse trailing cursor */}
      <CustomCursor />

      {/* Global high-performance canvas star twinkles & dream clouds */}
      <BackgroundStars />

      {/* Floating glass navbar */}
      <Navbar audioPlaying={audioPlaying} setAudioPlaying={setAudioPlaying} />

      {/* Experiential Scroll sections */}
      <main className="relative w-full z-10 overflow-hidden">
        
        {/* Section 1: Hero Portal */}
        <HeroPortal />

        {/* Section 2: Biographical Identity */}
        <IdentityScene />

        {/* Section 3: Cozy Cyber HUD Gaming */}
        <GamingRealm />

        {/* Section 4: Starry Rabbit Constellation Galaxy */}
        <RabbitGalaxy />

        {/* Section 5: Floaty Memory Clouds */}
        <MemoryClouds />

        {/* Section 6: Peaceful Ending rest */}
        <EndingScene />

      </main>
    </div>
  );
}

