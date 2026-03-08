"use client";
import { useRef, useEffect } from "react";

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

export function WaveformCanvas({
  peaks: peakData,
  color,
  dimmed,
  width,
  height,
}: {
  peaks: Float32Array;
  color: string;
  dimmed: boolean;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const maxCanvasPx = 8192;
    const w = Math.min(Math.max(20, Math.floor(width)), maxCanvasPx);
    const h = Math.floor(height);

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const numBars = Math.min(peakData.length, Math.max(4, Math.floor(w / 3)));
    const step = w / numBars;
    const barW = Math.max(1.2, step * 0.6);
    const mid = h / 2;

    const rgb = hexToRgb(color);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgba(${rgb},0.3)`);
    grad.addColorStop(0.4, `rgba(${rgb},0.8)`);
    grad.addColorStop(0.5, `rgba(${rgb},1)`);
    grad.addColorStop(0.6, `rgba(${rgb},0.8)`);
    grad.addColorStop(1, `rgba(${rgb},0.3)`);

    ctx.globalAlpha = dimmed ? 0.15 : 0.6;
    ctx.fillStyle = grad;

    for (let i = 0; i < numBars; i++) {
      const peakIdx = Math.floor((i / numBars) * peakData.length);
      const peak = peakData[peakIdx];
      const barH = Math.max(2, peak * h * 0.82);
      const x = i * step;
      const y = mid - barH / 2;
      const r = Math.min(barW / 2, barH / 2);

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barW, barH, r);
      } else {
        ctx.rect(x, y, barW, barH);
      }
      ctx.fill();
    }
  }, [peakData, color, dimmed, width, height]);

  return <canvas ref={canvasRef} className="absolute inset-0" style={{ width, height }} />;
}
