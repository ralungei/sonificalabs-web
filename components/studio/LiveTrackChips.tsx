"use client";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { type TimelineTrack } from "./types";

function FxIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="currentColor" className={className} style={style}>
      <path d="M28.75 45.332c.797 0 1.242-.258 1.828-1.102l9.375-12.796h.14l9.306 12.82c.539.797 1.078 1.078 1.922 1.078c1.218 0 2.109-.867 2.109-2.062c0-.516-.188-1.055-.492-1.5L42.766 28.059l10.43-13.97c.35-.444.515-.937.515-1.429c0-1.101-.914-1.992-2.016-1.992c-.867 0-1.359.281-1.945 1.125l-9.352 12.96h-.14l-9.305-12.96c-.586-.867-1.055-1.125-1.969-1.125c-1.242 0-2.132.844-2.132 2.016c0 .515.164 1.03.515 1.5l10.055 13.734L27.18 41.887c-.352.468-.516.96-.516 1.453c0 1.125.914 1.992 2.086 1.992m-24.305-.094c1.313 0 2.18-.843 2.18-2.18v-12.82h13.758c1.148 0 1.969-.726 1.969-1.875c0-1.172-.82-1.898-1.97-1.898H6.626V15.027h15.117c1.149 0 1.992-.726 1.992-1.921s-.843-1.946-1.992-1.946H4.422c-1.313 0-2.133.844-2.133 2.156V43.06c0 1.336.82 2.18 2.156 2.18" />
    </svg>
  );
}

type ChipStyle = { color: string; icon: string | null };

const CHIP_STYLE: Record<string, ChipStyle> = {
  music:    { color: "#3b82f6", icon: "solar:music-note-2-bold" },
  sfx:      { color: "#0d9488", icon: null },
  ambience: { color: "#0d9488", icon: null },
  stinger:  { color: "#0d9488", icon: null },
};


function PulseRing({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{ border: `1px solid ${color}` }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.4, 0, 0.4],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function LiveTrackChips({
  tracks,
  currentTimeMs,
  totalDurationMs,
}: {
  tracks: TimelineTrack[];
  currentTimeMs: number;
  totalDurationMs: number;
}) {
  const nonVoice = useMemo(
    () => tracks.filter((t) => t.type !== "voice").sort((a, b) => a.start_ms - b.start_ms),
    [tracks],
  );

  const active = useMemo(
    () =>
      nonVoice.filter((t) => {
        const endMs = totalDurationMs > 0
          ? Math.min(t.start_ms + t.duration_ms, totalDurationMs)
          : t.start_ms + t.duration_ms;
        return currentTimeMs >= t.start_ms && currentTimeMs < endMs;
      }),
    [nonVoice, currentTimeMs],
  );

  if (nonVoice.length === 0 || currentTimeMs === 0) return null;

  return (
    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 min-h-[36px]">
      <AnimatePresence mode="popLayout">
        {active.map((t) => {
          const { color, icon } = CHIP_STYLE[t.type] || CHIP_STYLE.sfx;
          const effectiveDur = totalDurationMs > 0
            ? Math.min(t.duration_ms, totalDurationMs - t.start_ms)
            : t.duration_ms;
          const elapsed = currentTimeMs - t.start_ms;
          const progress = Math.min(1, elapsed / effectiveDur);

          return (
            <motion.div
              key={`${t.type}-${t.index}`}
              layout
              initial={{ x: 50, opacity: 0, scale: 0, filter: "blur(8px)" }}
              animate={{ x: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{
                x: 20,
                opacity: 0,
                scale: 0.6,
                filter: "blur(6px)",
                transition: { duration: 0.3, ease: "easeIn" },
              }}
              transition={{
                type: "spring",
                duration: 0.5,
                bounce: 0.3,
              }}
              className="relative flex items-center gap-2.5 max-w-[180px]"
            >
              {/* Glowing icon orb */}
              <div className="relative shrink-0">
                <PulseRing color={color} />
                <motion.div
                  className="relative h-8 w-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${color}30, ${color}10)`,
                    boxShadow: `0 0 20px ${color}30, inset 0 1px 1px ${color}20`,
                    border: `1px solid ${color}35`,
                  }}
                >
                  {icon ? (
                    <Icon icon={icon} className="h-3.5 w-3.5" style={{ color }} />
                  ) : (
                    <FxIcon className="h-3.5 w-3.5" style={{ color }} />
                  )}
                </motion.div>
              </div>

              {/* Label + micro progress */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="text-[0.7rem] font-body font-medium leading-none truncate"
                  style={{ color }}
                >
                  {t.label}
                </span>
                <div className="h-[2px] w-full rounded-full bg-contrast/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color, width: `${progress * 100}%` }}
                    transition={{ duration: 0.25, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
