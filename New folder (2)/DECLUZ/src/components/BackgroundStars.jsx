import React, { useEffect, useRef } from "react";

export default function BackgroundStars() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let stars = [];
    let clouds = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      initClouds();
    };

    const initStars = () => {
      stars = [];
      const density = Math.floor((canvas.width * canvas.height) / 4500); // Dynamic star count based on resolution
      const starCount = Math.min(280, Math.max(80, density));

      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.3,
          color: i % 10 === 0 ? "rgba(0, 245, 255, 0.8)" : i % 15 === 0 ? "rgba(230, 230, 250, 0.8)" : "rgba(255, 255, 255, 0.7)",
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          parallaxFactor: Math.random() * 0.04 + 0.01,
        });
      }
    };

    const initClouds = () => {
      clouds = [];
      const cloudCount = 6;
      for (let i = 0; i < cloudCount; i++) {
        clouds.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 150 + 80,
          opacity: Math.random() * 0.06 + 0.02,
          vx: Math.random() * 0.15 + 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          parallaxFactor: Math.random() * 0.06 + 0.02,
        });
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX - window.innerWidth / 2;
      mouseRef.current.targetY = e.clientY - window.innerHeight / 2;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);

    resizeCanvas();

    const draw = () => {
      // Smooth mouse interpolation (spring physics)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Draw background dream sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#030b1e"); // Deep space navy
      grad.addColorStop(0.5, "#071735"); // Midnight blue
      grad.addColorStop(1, "#0d1b2a"); // Sky-blue space horizon
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw ambient glows
      const glow1X = canvas.width * 0.3 - mouse.x * 0.02;
      const glow1Y = canvas.height * 0.4 - mouse.y * 0.02;
      const radGlow1 = ctx.createRadialGradient(glow1X, glow1Y, 10, glow1X, glow1Y, 350);
      radGlow1.addColorStop(0, "rgba(0, 245, 255, 0.04)"); // Cyan ambient
      radGlow1.addColorStop(1, "rgba(3, 11, 30, 0)");
      ctx.fillStyle = radGlow1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const glow2X = canvas.width * 0.85 - mouse.x * 0.03;
      const glow2Y = canvas.height * 0.7 - mouse.y * 0.03;
      const radGlow2 = ctx.createRadialGradient(glow2X, glow2Y, 10, glow2X, glow2Y, 400);
      radGlow2.addColorStop(0, "rgba(0, 128, 255, 0.04)"); // Neon blue ambient
      radGlow2.addColorStop(1, "rgba(3, 11, 30, 0)");
      ctx.fillStyle = radGlow2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars with twinkling phase and mouse parallax
      stars.forEach((star) => {
        star.twinklePhase += star.twinkleSpeed;
        const opacityMultiplier = Math.abs(Math.sin(star.twinklePhase)) * 0.5 + 0.5;

        // Apply dynamic parallax offsets relative to center
        const drawX = star.x - mouse.x * star.parallaxFactor;
        const drawY = star.y - mouse.y * star.parallaxFactor;

        // Handle wrap-around for stars shifting off-screen
        let finalX = drawX;
        let finalY = drawY;
        if (finalX < 0) finalX += canvas.width;
        if (finalX > canvas.width) finalX -= canvas.width;
        if (finalY < 0) finalY += canvas.height;
        if (finalY > canvas.height) finalY -= canvas.height;

        ctx.beginPath();
        ctx.arc(finalX, finalY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = opacityMultiplier;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Draw and drift dream clouds
      clouds.forEach((cloud) => {
        cloud.x += cloud.vx;
        cloud.y += cloud.vy;

        // Reset clouds once they drift entirely off canvas
        if (cloud.x - cloud.radius > canvas.width) {
          cloud.x = -cloud.radius;
          cloud.y = Math.random() * canvas.height;
        }

        const drawX = cloud.x - mouse.x * cloud.parallaxFactor;
        const drawY = cloud.y - mouse.y * cloud.parallaxFactor;

        const cloudGlow = ctx.createRadialGradient(drawX, drawY, 10, drawX, drawY, cloud.radius);
        cloudGlow.addColorStop(0, `rgba(230, 230, 250, ${cloud.opacity})`); // Lavender-hued white soft cloud
        cloudGlow.addColorStop(0.6, `rgba(0, 245, 255, ${cloud.opacity * 0.3})`); // Cyan hint border
        cloudGlow.addColorStop(1, "rgba(3, 11, 30, 0)");

        ctx.beginPath();
        ctx.arc(drawX, drawY, cloud.radius, 0, Math.PI * 2);
        ctx.fillStyle = cloudGlow;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 gpu-accelerated block"
    />
  );
}
