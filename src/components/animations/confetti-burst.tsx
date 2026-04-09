"use client";
import { useEffect, useRef } from "react";

interface ConfettiBurstProps {
  colors: string[];
  /** Called when animation finishes */
  onDone?: () => void;
}

const PARTICLE_COUNT = 55;
const DURATION_MS = 1400;

type Shape = "rect" | "circle" | "dot";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  w: number;
  h: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  shape: Shape;
}

/**
 * Full-viewport canvas confetti — fires once and unmounts.
 * Rendered in a fixed z-index portal so it survives parent re-renders.
 */
export function ConfettiBurst({ colors, onDone }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onDone?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn from top-center with fan spread
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.22;

    const shapes: Shape[] = ["rect", "circle", "dot"];

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      // Fan angle: -60° to +60° from straight up
      const spreadAngle = ((Math.random() - 0.5) * Math.PI) / 1.5;
      const upwardBias = -Math.PI / 2; // straight up
      const angle = upwardBias + spreadAngle;
      const speed = 5 + Math.random() * 9;
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = 4 + Math.random() * 6;

      return {
        x: originX + (Math.random() - 0.5) * 60,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        w: shape === "rect" ? size * 1.6 : size,
        h: shape === "rect" ? size * 0.6 : size,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.18,
        alpha: 1,
        shape,
      };
    });

    let startTime: number | null = null;

    function draw(ts: number) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / DURATION_MS, 1);

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const fadeStart = 0.55;
      const fadeRange = 1 - fadeStart;

      particles.forEach((p) => {
        p.vy += 0.38; // gravity
        p.vx *= 0.992; // air drag
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        const baseAlpha = t > fadeStart ? 1 - (t - fadeStart) / fadeRange : 1;
        p.alpha = baseAlpha;

        if (p.alpha <= 0) return;

        ctx!.save();
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = p.color;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);

        switch (p.shape) {
          case "rect":
            ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            break;
          case "circle":
            ctx!.beginPath();
            ctx!.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
            ctx!.fill();
            break;
          case "dot":
            ctx!.beginPath();
            ctx!.arc(0, 0, p.w / 3, 0, Math.PI * 2);
            ctx!.fill();
            break;
        }

        ctx!.restore();
      });

      if (t < 1) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        onDone?.();
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [colors, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
