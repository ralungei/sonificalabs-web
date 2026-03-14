"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

/** Relative peak height per bar — arch shape, tallest in center */
const BARS = [0.45, 0.7, 1.0, 0.7, 0.45];

export function JobStatus({
  status,
  progress,
  queuePosition,
}: {
  status: string;
  progress: string;
  queuePosition?: number;
}) {
  const t = useTranslations("jobStatus");

  const PHASES = [
    { key: "generating", label: t("script") },
    { key: "confirming", label: t("voices") },
    { key: "timing", label: t("timing") },
    { key: "producing", label: t("production") },
    { key: "done", label: t("ready") },
  ];

  const isQueued = status === "queued";
  const isLoading = status === "loading";
  // "searching" is a sub-state of "generating"
  const phaseKey = status === "searching" ? "generating" : status;
  const currentPhase = (isQueued || isLoading)
    ? -1
    : Math.max(0, PHASES.findIndex((p) => p.key === phaseKey));

  const displayText = isQueued
    ? queuePosition
      ? t("queuePosition", { position: queuePosition })
      : t("waitingTurn")
    : status === "searching"
      ? t("searchingWeb")
      : status === "generating"
        ? t("generatingScript")
        : status === "timing"
          ? t("calculatingTiming")
          : status === "producing" && progress
            ? progress
            : status === "producing"
              ? t("synthesizing")
              : "";

  const phaseLabel = (isQueued || isLoading) ? "" : PHASES[currentPhase]?.label ?? "";

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-8 px-10 py-10">
      {/* Waveform — 5 bars, smooth travelling wave */}
      <div className="flex items-center justify-center gap-[6px] h-14">
        {BARS.map((peak, i) => (
          <motion.div
            key={i}
            className="w-[3px] rounded-full origin-center"
            style={{
              background:
                "linear-gradient(to top, var(--color-accent-dim), var(--color-accent))",
            }}
            animate={{ scaleY: [0.2, peak, 0.2] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.13,
            }}
            initial={{ height: 56 }}
          />
        ))}
      </div>

      {/* Phase label + detail text */}
      <div className="flex flex-col items-center justify-center gap-2 h-14 relative">
        <AnimatePresence mode="wait">
          <motion.h2
            key={phaseLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-heading-sm font-body font-semibold uppercase tracking-[0.25em] text-contrast"
          >
            {phaseLabel}
          </motion.h2>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={displayText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-body-md text-contrast/80 text-center"
          >
            {displayText}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Phase dots */}
      <div className="flex items-center gap-3">
        {PHASES.map((phase, i) => (
          <div key={phase.key} className="relative">
            <motion.div
              animate={{
                width: i === currentPhase ? 7 : 5,
                height: i === currentPhase ? 7 : 5,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn(
                "rounded-full",
                i < currentPhase && "bg-accent/40",
                i === currentPhase && "bg-accent",
                i > currentPhase && "bg-contrast/10",
                isQueued && "bg-contrast/10",
              )}
            />
            {/* Pulse on active dot */}
            <AnimatePresence>
              {i === currentPhase && !isQueued && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-accent/30"
                  animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
