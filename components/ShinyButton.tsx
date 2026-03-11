"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function ShinyButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mx, setMx] = useState(0.5);
  const [my, setMy] = useState(0.5);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMx((e.clientX - rect.left) / rect.width);
    setMy((e.clientY - rect.top) / rect.height);
  };

  const vars = {
    "--mx": `${mx * 100}%`,
    "--my": `${my * 100}%`,
  } as React.CSSProperties;

  return (
    <button
      ref={buttonRef}
      onPointerMove={handlePointerMove}
      className={cn(
        "group relative py-3.5 px-8 rounded-2xl bg-[#0F5549] overflow-hidden cursor-pointer",
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={vars}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(100% 50% at calc(50% - var(--mx)) 0%, rgba(255,255,255,0.25) 0%, transparent 80%), radial-gradient(100% 50% at calc(var(--mx) + 50%) 100%, rgba(255,255,255,0.25) 0%, transparent 80%)`,
          }}
        />
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            backgroundImage: `repeating-linear-gradient(125deg, transparent 0%, transparent 15%, rgba(255,255,255,0.25) 25%, transparent 35%, transparent 50%)`,
            backgroundSize: "200%",
            backgroundPosition: `calc(var(--mx) + 20%) var(--my)`,
          }}
        />
      </div>
      <div className="absolute inset-0.5 rounded-[14px] bg-[#0F5549]/75" />
      <div className="relative text-white/90 group-hover:text-white transition-colors duration-100 font-semibold text-sm flex items-center gap-2">
        {children}
      </div>
    </button>
  );
}
