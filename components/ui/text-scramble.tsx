"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function Stars({ count = 6 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stars = useMemo(
    () =>
      mounted
        ? Array.from({ length: count }, () => ({
            left: `${random(5, 95)}%`,
            top: `${random(15, 85)}%`,
            size: random(1.5, 3),
            delay: random(0, 5),
            duration: random(2, 4),
          }))
        : [],
    [count, mounted],
  );

  if (!mounted) return null;

  return (
    <>
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: "rgba(126, 220, 208, 0.9)",
            boxShadow: "0 0 4px rgba(126, 220, 208, 0.6)",
          }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

export function TextScramble({
  words,
  duration = 3000,
  className = "",
}: {
  words: string[];
  duration?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => clearInterval(timer);
  }, [words.length, duration]);

  return (
    <span className="relative inline-flex justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`inline-block relative ${className}`}
        >
          {words[index]}
          <Stars />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
