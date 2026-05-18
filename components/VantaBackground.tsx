"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
// @ts-ignore
import NET from "vanta/dist/vanta.net.min";

export function VantaBackground({ className }: { className?: string }) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      try {
        vantaEffect.current = NET({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: true,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 0.5,
          color: 0x4a4a4a,
          backgroundColor: 0x0a0a0a, 
          points: 10.00,
          maxDistance: 20.00,
          spacing: 16.00,
          showDots: true,
          THREE: THREE,
        });
      } catch (error) {
        console.error("Failed to initialize Vanta:", error);
      }
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
