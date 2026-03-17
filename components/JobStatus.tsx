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
    { key: "producing", label: t("production") },
    { key: "done", label: t("ready") },
  ];

  const isQueued = status === "queued";
  const isLoading = status === "loading";
  const currentPhase = (isQueued || isLoading)
    ? -1
    : Math.max(0, PHASES.findIndex((p) => p.key === status));

  const displayText = isQueued
    ? queuePosition
      ? t("queuePosition", { position: queuePosition })
      : t("waitingTurn")
    : status === "generating"
      ? t("generatingScript")
      : status === "producing" && progress
        ? progress
        : status === "producing"
          ? t("producing")
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

    </div>
  );
}
