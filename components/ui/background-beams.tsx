"use client";
import { useEffect, useRef, useCallback } from "react";
import { createNoise3D } from "simplex-noise";
import { cn } from "@/lib/cn";

export function BackgroundBeams({
  className,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "slow",
  waveOpacity = 0.5,
}: {
  className?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number>(0);
  const noiseRef = useRef(createNoise3D());
  const ntRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const getSpeed = useCallback(
    () => (speed === "fast" ? 0.002 : 0.001),
    [speed],
  );

  const waveColors = colors ?? [
    "#e8a838",
    "#d47a2a",
    "#c06020",
    "#e8c868",
    "#a86828",
  ];

  const fill = backgroundFill ?? "#060608";
  const lineWidth = waveWidth ?? 50;

  const drawWave = useCallback(
    (n: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      const noise = noiseRef.current;

      ntRef.current += getSpeed();
      const nt = ntRef.current;

      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = waveColors[i % waveColors.length];
        for (let x = 0; x < w; x += 5) {
          const y = noise(x / 800, 0.3 * i, nt) * 100;
          ctx.lineTo(x, y + h * 0.82);
        }
        ctx.stroke();
        ctx.closePath();
      }
    },
    [getSpeed, waveColors, lineWidth],
  );

  const render = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { w, h } = sizeRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = waveOpacity;
    drawWave(5);
    animationRef.current = requestAnimationFrame(render);
  }, [fill, waveOpacity, drawWave]);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    sizeRef.current.w = ctx.canvas.width = window.innerWidth;
    sizeRef.current.h = ctx.canvas.height = window.innerHeight;
    ctx.filter = `blur(${blur}px)`;
    ntRef.current = 0;

    render();
  }, [blur, render]);

  useEffect(() => {
    init();

    const handleResize = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      sizeRef.current.w = ctx.canvas.width = window.innerWidth;
      sizeRef.current.h = ctx.canvas.height = window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [init, blur]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 z-0", className)}
    />
  );
}
