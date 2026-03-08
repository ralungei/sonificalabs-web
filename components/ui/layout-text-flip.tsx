"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LayoutTextFlip({
  words,
  duration = 2500,
}: {
  words: string[];
  duration?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span className="relative inline-flex justify-center overflow-hidden min-w-[260px] sm:min-w-[320px]">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={currentIndex}
          initial={{ y: -40, filter: "blur(10px)" }}
          animate={{ y: 0, filter: "blur(0px)" }}
          exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block whitespace-nowrap bg-gradient-to-b from-accent-bright to-accent bg-clip-text text-transparent"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
