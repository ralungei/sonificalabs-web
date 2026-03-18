"use client";
import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { cn } from "@/lib/cn";
import { ACCENT } from "@/lib/theme";

const DEFAULT_COLORS = [
  ACCENT.base,
  ACCENT.dim,
  "#1A8A78",
  ACCENT.bright,
  "#2D5A3D",
];

export function BackgroundBeams({
  className,
  colors,
  waveWidth = 2,
  blur = 0,
  speed = "slow",
  waveOpacity = 0.3,
}: {
  className?: string;
  colors?: string[];
  waveWidth?: number;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef({ colors: colors ?? DEFAULT_COLORS, waveWidth, blur, speed, waveOpacity });
  configRef.current = { colors: colors ?? DEFAULT_COLORS, waveWidth, blur, speed, waveOpacity };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise = createNoise3D();
    let nt = 0;
    let raf = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      ctx!.filter = `blur(${configRef.current.blur}px)`;
    }

    function render() {
      const { colors: cols, waveWidth: lw, waveOpacity: op, speed: sp } = configRef.current;
      const w = canvas!.width;
      const h = canvas!.height;

      nt += sp === "fast" ? 0.002 : 0.001;

      ctx!.clearRect(0, 0, w, h);
      ctx!.globalAlpha = op;

      for (let i = 0; i < 5; i++) {
        ctx!.beginPath();
        ctx!.lineWidth = lw;
        ctx!.strokeStyle = cols[i % cols.length];
        for (let x = 0; x < w; x += 5) {
          const y = noise(x / 800, 0.3 * i, nt) * 100;
          ctx!.lineTo(x, y + h * 0.82);
        }
        ctx!.stroke();
        ctx!.closePath();
      }

      raf = requestAnimationFrame(render);
    }

    resize();
    render();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 z-0", className)}
    />
  );
}
