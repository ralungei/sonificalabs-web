"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Bars, Check } from "@/components/site/ui";

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
      : status === "producing"
        ? t("producing")
        : "";

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-8 px-4 text-center">
      <div className="h-16 w-[min(240px,70vw)]">
        <Bars n={30} live />
      </div>

      <div className="flex min-h-[2.2em] items-center text-[clamp(30px,4.4vw,52px)] font-normal leading-[1.04] tracking-[-0.06em]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.h1
            key={displayText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="m-0 text-balance text-[1em] font-normal"
          >
            {displayText || " "}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Phase steps */}
      <ol className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
        {PHASES.map((p, i) => {
          const done = i < currentPhase;
          const current = i === currentPhase;
          return (
            <li
              key={p.key}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors duration-300",
                done && "bg-mint text-accent-dim",
                current && "bg-ink text-white",
                !done && !current && "border border-contrast/[0.1] text-text-muted",
              )}
            >
              {done ? (
                <Check size={12} />
              ) : current ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#2dd4bf]" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-contrast/15" />
              )}
              {p.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
