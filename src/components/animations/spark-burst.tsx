"use client";
import { useEffect, useRef } from "react";

interface SparkBurstProps {
  /** Accent color for sparks */
  color: string;
  /** Called when animation finishes */
  onDone?: () => void;
}

const PARTICLE_COUNT = 12;
const DURATION_MS = 650;

/**
 * Renders a radial spark burst centered on its parent container.
 * Uses canvas for GPU-composited rendering — no layout shifts.
 * Position the parent `relative` with defined width/height.
 */
export function SparkBurst({ color, onDone }: SparkBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Respect reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onDone?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const w = parent.offsetWidth || 200;
    const h = parent.offsetHeight || 80;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = w / 2;
    const cy = h / 2;

    // Parse color once for glow
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 28 + Math.random() * 22;
      const size = 2.5 + Math.random() * 2.5;
      return {
        angle,
        dist,
        size,
        // slight scatter per particle
        scatterAngle: angle + (Math.random() - 0.5) * 0.5,
      };
    });

    let startTime: number | null = null;

    function draw(ts: number) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / DURATION_MS, 1); // 0 → 1

      ctx!.clearRect(0, 0, w, h);

      // Center glow flash (fast decay)
      if (t < 0.25) {
        const glowAlpha = (1 - t / 0.25) * 0.35;
        const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 38);
        grad.addColorStop(0, colorWithAlpha(color, glowAlpha));
        grad.addColorStop(1, colorWithAlpha(color, 0));
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, w, h);
      }

      // Ease: fast out, slow fade
      const eased = easeOutCubic(t);

      particles.forEach((p) => {
        const dist = eased * p.dist;
        const px = cx + Math.cos(p.scatterAngle) * dist;
        const py = cy + Math.sin(p.scatterAngle) * dist;
        // Fade: full until 40%, then decay
        const alpha = t < 0.4 ? 1 : 1 - (t - 0.4) / 0.6;
        const size = p.size * (1 - t * 0.5);

        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = color;
        ctx!.shadowColor = color;
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        ctx!.arc(px, py, Math.max(0, size), 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      });

      if (t < 1) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx!.clearRect(0, 0, w, h);
        onDone?.();
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [color, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 20,
      }}
    />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Convert any CSS color + alpha to rgba. Falls back to the color string. */
function colorWithAlpha(color: string, alpha: number): string {
  // If it's a 6-digit hex, convert to rgba
  const hex6 = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex6) {
    const r = parseInt(hex6[1].slice(0, 2), 16);
    const g = parseInt(hex6[1].slice(2, 4), 16);
    const b = parseInt(hex6[1].slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // If it already has transparency support, just overlay
  return color;
}
