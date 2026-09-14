import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { LogoState } from "../types";

interface Logo3DProps {
  state: LogoState;
}

export function Logo3D({ state }: Logo3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (navigator.userAgent.toLowerCase().includes("jsdom")) {
      host.dataset.fallback = "true";
      host.textContent = "J";
      return () => {
        host.replaceChildren();
        delete host.dataset.fallback;
      };
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      host.dataset.fallback = "true";
      host.textContent = "J";
      return () => {
        host.replaceChildren();
        delete host.dataset.fallback;
      };
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 4;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(240, 240);
    host.appendChild(renderer.domElement);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 4),
      new THREE.MeshStandardMaterial({ color: "#00D4FF", emissive: "#0A1628", metalness: 0.7, roughness: 0.18, wireframe: true })
    );
    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          Array.from({ length: 180 }, (_, index) => {
            const angle = index * 0.28;
            const radius = 1.65 + Math.sin(index) * 0.1;
            return index % 3 === 0 ? Math.cos(angle) * radius : index % 3 === 1 ? Math.sin(angle) * radius : Math.sin(angle * 2) * 0.2;
          }),
          3
        )
      ),
      new THREE.PointsMaterial({ color: "#7C4DFF", size: 0.025 })
    );
    scene.add(core, particles, new THREE.AmbientLight("#E8F4FF", 1.8));

    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += 0.01;
      const multiplier = state === "processing" ? 4 : state === "listening" ? 2 : 1;
      core.rotation.x += 0.008 * multiplier;
      core.rotation.y += 0.011 * multiplier;
      particles.rotation.z += 0.018 * multiplier;
      const scale = 1 + Math.sin(frame * 3) * (state === "idle" ? 0.04 : 0.08);
      core.scale.setScalar(scale);
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.cancelAnimationFrame(raf);
      renderer.dispose();
      host.replaceChildren();
    };
  }, [state]);

  return <div ref={hostRef} className={`logo3d logo3d-${state}`} aria-label={`JARVIS logo ${state}`} />;
}
