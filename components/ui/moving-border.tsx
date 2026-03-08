"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function MovingBorderButton({
  children,
  borderRadius = "1.75rem",
  className,
  containerClassName,
  as: Component = "button",
  ...otherProps
}: {
  children: React.ReactNode;
  borderRadius?: string;
  className?: string;
  containerClassName?: string;
  as?: React.ElementType;
  [key: string]: unknown;
}) {
  return (
    <Component
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-zinc-900",
        containerClassName,
      )}
      style={{ borderRadius }}
      {...otherProps}
    >
      <span
        className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#eab308_0%,#facc15_50%,#eab308_100%)]"
      />
      <span
        className={cn(
          "inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-zinc-900 px-6 py-1 text-sm font-medium text-yellow-50 backdrop-blur-3xl",
          className,
        )}
        style={{ borderRadius: `calc(${borderRadius} - 2px)` }}
      >
        {children}
      </span>
    </Component>
  );
}
