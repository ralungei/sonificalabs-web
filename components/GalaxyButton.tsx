"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function makeStarStyle(): React.CSSProperties {
  return {
    "--angle": random(0, 360),
    "--duration": random(6, 20),
    "--delay": random(1, 10),
    "--alpha": random(40, 90) / 100,
    "--size": random(2, 6),
    "--distance": random(40, 200),
  } as React.CSSProperties;
}

export function GalaxyButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [stars, setStars] = useState<{ static: React.CSSProperties[]; orbit: React.CSSProperties[] } | null>(null);

  useEffect(() => {
    setStars({
      static: Array.from({ length: 4 }, () => makeStarStyle()),
      orbit: Array.from({ length: 20 }, () => makeStarStyle()),
    });
  }, []);

  return (
    <button
      className={cn("galaxy-btn group", className)}
      {...props}
    >
      <span className="galaxy-spark" />
      <span className="galaxy-backdrop" />
      <span className="galaxy-container">
        {stars?.static.map((s, i) => (
          <span key={i} className="galaxy-star galaxy-star--static" style={s} />
        ))}
      </span>
      <span className="galaxy-orbit">
        <span className="galaxy-ring">
          {stars?.orbit.map((s, i) => (
            <span key={i} className="galaxy-star" style={s} />
          ))}
        </span>
      </span>
      <span className="galaxy-text">{children}</span>
    </button>
  );
}
