"use client";
import { useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type TimelineTrack } from "./types";

/** Typewriter driven by audio time — pauses when audio pauses */
function TypewriterText({
  text,
  progress,
}: {
  text: string;
  /** 0..1 how far through this track we are */
  progress: number;
}) {
  // Show chars proportional to progress (use 80% of duration for typing)
  const typingProgress = Math.min(1, progress / 0.8);
  const chars = Math.ceil(typingProgress * text.length);
  return <span>{text.slice(0, chars)}</span>;
}

export function LiveSubtitles({
  tracks,
  currentTimeMs,
}: {
  tracks: TimelineTrack[];
  currentTimeMs: number;
}) {
  const voiceTracks = useMemo(
    () =>
      tracks
        .filter((t) => t.type === "voice" && t.text)
        .sort((a, b) => a.start_ms - b.start_ms),
    [tracks],
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const currentIdx = useMemo(() => {
    for (let i = voiceTracks.length - 1; i >= 0; i--) {
      if (currentTimeMs >= voiceTracks[i].start_ms) return i;
    }
    return -1;
  }, [voiceTracks, currentTimeMs]);

  useEffect(() => {
    if (currentIdx < 0 || !scrollRef.current) return;
    const el = scrollRef.current.children[currentIdx] as HTMLElement;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIdx]);

  if (voiceTracks.length === 0 || currentTimeMs === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-3"
    >
      <AnimatePresence>
        {voiceTracks.map((t) => {
          if (currentTimeMs < t.start_ms) return null;

          const elapsed = currentTimeMs - t.start_ms;
          const progress = Math.min(1, elapsed / t.duration_ms);
          const isCurrent = elapsed >= 0 && elapsed < t.duration_ms;
          const isPast = elapsed >= t.duration_ms;

          return (
            <motion.div
              key={`voice-${t.index}`}
              initial={{ x: -30, opacity: 0, scale: 0.9 }}
              animate={{
                x: 0,
                opacity: isCurrent ? 1 : isPast ? 0.35 : 0,
                scale: 1,
              }}
              transition={{
                type: "spring",
                duration: 0.4,
                bounce: 0.15,
              }}
              className="flex flex-col gap-0.5"
            >
              <span className="text-caption-sm font-body uppercase tracking-wider text-accent/70">
                {t.label}
              </span>
              <p
                className={`text-body-sm font-body leading-relaxed transition-colors duration-300 ${
                  isCurrent ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {isCurrent ? (
                  <TypewriterText text={t.text!} progress={progress} />
                ) : (
                  t.text
                )}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
