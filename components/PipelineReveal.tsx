"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { VOICES } from "@/lib/voices";

/* ── Phase 1: Typewriter ──────────────────────────────────────── */

function TypewriterViz({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    setCharCount(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= text.length) clearInterval(id);
    }, 38);
    return () => clearInterval(id);
  }, [inView, text]);

  return (
    <div ref={ref} className="w-full rounded-xl border border-contrast/[0.08] bg-surface-1/80 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-contrast/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-contrast/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-contrast/10" />
      </div>
      <p className="font-mono text-sm text-contrast/80 leading-relaxed min-h-[3em]">
        {text.slice(0, charCount)}
        <span className="inline-block w-[2px] h-[1.1em] bg-accent align-text-bottom ml-px animate-pulse" />
      </p>
    </div>
  );
}

/* ── Phase 2: Escaleta JSON ───────────────────────────────────── */

interface EscaletaLine {
  type: string;
  color: string;
  text: string;
}

function EscaletaViz({ lines, label }: { lines: EscaletaLine[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="w-full rounded-xl border border-contrast/[0.08] bg-surface-1/80 p-4 font-mono text-xs overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-contrast/30 uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-1">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, filter: "blur(4px)", x: -10 }}
            animate={
              inView
                ? { opacity: 1, filter: "blur(0px)", x: 0 }
                : { opacity: 0, filter: "blur(4px)", x: -10 }
            }
            transition={{ duration: 0.4, delay: i * 0.18 }}
            className={line.color}
          >
            {line.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Phase 3: Voice Grid ──────────────────────────────────────── */

const FEATURED_NAMES = [
  "Daniel", "Sara", "Eva", "Enrique", "Hector", "Celeste",
  "Barbara", "Rafael", "Norah", "Fiona", "Arconte", "Dylan",
];
const ACTIVE_NAMES = new Set(["Daniel", "Sara", "Eva"]);

const DISPLAY_VOICES = FEATURED_NAMES.map(name => {
  const v = VOICES.find(d => d.name === name)!;
  return { initials: v.name.slice(0, 2), name: v.name, active: ACTIVE_NAMES.has(name) };
});

function VoiceGridViz() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="grid grid-cols-4 gap-3 w-full">
      {DISPLAY_VOICES.map((v, i) => (
        <motion.div
          key={v.name}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={
            inView
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.6 }
          }
          transition={{
            duration: 0.5,
            delay: i * 0.06,
            type: "spring",
            bounce: 0.35,
          }}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className={`relative h-11 w-11 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              v.active
                ? "bg-accent/20 text-accent border-2 border-accent/60 shadow-[0_0_12px_rgba(232,168,56,0.3)]"
                : "bg-contrast/[0.06] text-contrast/30 border border-contrast/[0.08]"
            }`}
          >
            {v.active && (
              <span className="absolute inset-0 rounded-full border-2 border-accent/40 animate-ping" />
            )}
            {v.initials}
          </div>
          <span
            className={`text-[10px] ${
              v.active ? "text-accent font-medium" : "text-contrast/30"
            }`}
          >
            {v.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Phase 4: Mini DAW Timeline ───────────────────────────────── */

interface DawTrack {
  label: string;
  color: string;
  bg: string;
  left: string;
  width: string;
}

function DawTimelineViz({ tracks, badges }: { tracks: DawTrack[]; badges: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="w-full space-y-3">
      <div className="space-y-2 rounded-xl border border-contrast/[0.08] bg-surface-1/80 p-4">
        {tracks.map((track, i) => (
          <div key={track.label} className="flex items-center gap-2">
            <span className="text-[10px] text-contrast/40 font-mono w-12 shrink-0 text-right">
              {track.label}
            </span>
            <div className="relative flex-1 h-6 rounded bg-contrast/[0.03]">
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={
                  inView
                    ? { scaleX: 1, opacity: 1 }
                    : { scaleX: 0, opacity: 0 }
                }
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.12,
                  type: "spring",
                  bounce: 0.2,
                }}
                style={{
                  left: track.left,
                  width: track.width,
                  originX: 0,
                }}
                className={`absolute top-0.5 bottom-0.5 rounded border ${track.color} ${track.bg}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {badges.map((badge, i) => (
          <motion.span
            key={badge}
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.3, delay: 0.8 + i * 0.08 }}
            className="inline-flex items-center rounded-full bg-contrast/[0.04] border border-contrast/[0.08] px-2.5 py-1 text-[10px] text-contrast/50 font-mono"
          >
            {badge}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ── Phase 5: Waveform ────────────────────────────────────────── */

const BAR_COUNT = 48;
const WAVEFORM_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const x = i / BAR_COUNT;
  const base = Math.sin(x * Math.PI) * 0.7;
  const detail = Math.sin(x * 47) * 0.2 + Math.cos(x * 23) * 0.1;
  return Math.round(Math.max(0.12, Math.min(1, base + detail)) * 100) / 100;
});

function WaveformViz({ durationLabel }: { durationLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="w-full space-y-4">
      <div className="flex items-end justify-center gap-[3px] h-16">
        {WAVEFORM_HEIGHTS.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.025,
              type: "spring",
              bounce: 0.3,
            }}
            style={{ height: `${h * 100}%`, originY: 1 }}
            className="w-1.5 rounded-full bg-gradient-to-t from-accent/60 to-accent"
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.4, delay: BAR_COUNT * 0.025 + 0.2 }}
        className="flex items-center justify-center gap-3"
      >
        <div className="h-10 w-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center animate-pulse">
          <svg
            className="w-4 h-4 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
        </div>
        <span className="text-sm text-contrast/50 font-mono">{durationLabel}</span>
      </motion.div>
    </div>
  );
}

/* ── Phase data ───────────────────────────────────────────────── */

interface Phase {
  num: string;
  title: string;
  subtitle: string;
  viz: React.ReactNode;
}

/* ── PipelineStep (zigzag layout) ─────────────────────────────── */

function PipelineStep({
  phase,
  index,
  stepLabel,
}: {
  phase: Phase;
  index: number;
  stepLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = index % 2 === 0;

  const textContent = (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -20 : 20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? -20 : 20 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-2"
    >
      <span className="text-xs font-mono text-accent uppercase tracking-[0.25em] font-medium">
        {stepLabel} {phase.num}
      </span>
      <h3 className="text-xl md:text-2xl font-logo tracking-wide text-contrast">
        {phase.title}
      </h3>
      <p className="text-sm text-contrast/60 leading-relaxed max-w-xs">
        {phase.subtitle}
      </p>
    </motion.div>
  );

  const vizContent = (
    <motion.div
      initial={{ opacity: 0, x: isEven ? 20 : -20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? 20 : -20 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {phase.viz}
    </motion.div>
  );

  return (
    <div ref={ref} className="relative grid grid-cols-[1fr_48px_1fr] items-start">
      {/* Left column */}
      <div className="flex justify-end pr-10">
        {isEven ? textContent : vizContent}
      </div>

      {/* Dot (centered on the spine line) */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
          className="relative z-10 h-4 w-4 rounded-full border-2 border-accent bg-surface-0 shrink-0"
        >
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
        </motion.div>
      </div>

      {/* Right column */}
      <div className="flex justify-start pl-10">
        {isEven ? vizContent : textContent}
      </div>
    </div>
  );
}

/* ── Mobile PipelineStep ──────────────────────────────────────── */

function PipelineStepMobile({
  phase,
  stepLabel,
}: {
  phase: Phase;
  stepLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative grid grid-cols-[32px_1fr] items-start gap-4">
      {/* Dot (centered on the spine line) */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
          className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-accent bg-surface-0 shrink-0 mt-1"
        >
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-1.5"
        >
          <span className="text-[10px] font-mono text-accent uppercase tracking-[0.25em] font-medium">
            {stepLabel} {phase.num}
          </span>
          <h3 className="text-lg font-logo tracking-wide text-contrast">
            {phase.title}
          </h3>
          <p className="text-sm text-contrast/60 leading-relaxed">
            {phase.subtitle}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          {phase.viz}
        </motion.div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */

export function PipelineReveal() {
  const t = useTranslations("pipeline");
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });

  const escaletaLines: EscaletaLine[] = [
    { type: "music", color: "text-blue-400", text: t("escaletaLines.suspenseAmbience") },
    { type: "voice", color: "text-accent", text: t("escaletaLines.danielLine") },
    { type: "sfx", color: "text-purple-400", text: t("escaletaLines.transitionEffect") },
    { type: "voice", color: "text-accent", text: t("escaletaLines.saraLine") },
    { type: "ambience", color: "text-emerald-400", text: t("escaletaLines.rainOnGlass") },
    { type: "sfx", color: "text-purple-400", text: t("escaletaLines.dramaticHit") },
  ];

  const dawTracks: DawTrack[] = [
    { label: t("dawTracks.music"), color: "border-blue-400/60", bg: "bg-blue-400/15", left: "0%", width: "100%" },
    { label: t("dawTracks.voice1"), color: "border-accent/60", bg: "bg-accent/15", left: "10%", width: "35%" },
    { label: t("dawTracks.sfx"), color: "border-purple-400/60", bg: "bg-purple-400/15", left: "46%", width: "8%" },
    { label: t("dawTracks.voice2"), color: "border-accent/60", bg: "bg-accent/15", left: "55%", width: "30%" },
    { label: t("dawTracks.ambience"), color: "border-emerald-400/60", bg: "bg-emerald-400/15", left: "5%", width: "90%" },
  ];

  const dawBadges = (t("dawBadges") as string).split(",");

  const phasesRaw = t.raw("phases") as Array<{ title: string; subtitle: string }>;

  const PHASES: Phase[] = [
    { num: "01", title: phasesRaw[0].title, subtitle: phasesRaw[0].subtitle, viz: <TypewriterViz text={t("typewriterText")} /> },
    { num: "02", title: phasesRaw[1].title, subtitle: phasesRaw[1].subtitle, viz: <EscaletaViz lines={escaletaLines} label={t("scriptLabel")} /> },
    { num: "03", title: phasesRaw[2].title, subtitle: phasesRaw[2].subtitle, viz: <VoiceGridViz /> },
    { num: "04", title: phasesRaw[3].title, subtitle: phasesRaw[3].subtitle, viz: <DawTimelineViz tracks={dawTracks} badges={dawBadges} /> },
    { num: "05", title: phasesRaw[4].title, subtitle: phasesRaw[4].subtitle, viz: <WaveformViz durationLabel={t("waveformDuration")} /> },
  ];

  return (
    <section id="como-funciona" className="relative z-10 w-full max-w-5xl px-4 py-28">
      {/* Heading */}
      <motion.div
        ref={headingRef}
        initial={{ opacity: 0, y: 20 }}
        animate={headingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20"
      >
        <h2 className="text-3xl md:text-5xl font-logo tracking-wide text-contrast">
          {t("sectionTitle")}
        </h2>
      </motion.div>

      {/* Desktop timeline — continuous spine behind steps */}
      <div className="hidden md:block relative">
        {/* Continuous spine line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-accent/25" />
        <div className="flex flex-col gap-24">
          {PHASES.map((phase, i) => (
            <PipelineStep
              key={phase.num}
              phase={phase}
              index={i}
              stepLabel={t("step")}
            />
          ))}
        </div>
      </div>

      {/* Mobile timeline — continuous spine behind steps */}
      <div className="md:hidden relative">
        {/* Continuous spine line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-accent/25" />
        <div className="flex flex-col gap-16">
          {PHASES.map((phase) => (
            <PipelineStepMobile
              key={phase.num}
              phase={phase}
              stepLabel={t("step")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
