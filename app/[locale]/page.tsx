"use client";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Navbar } from "@/components/Navbar";
import { PromptForm } from "@/components/PromptForm";
import { PipelineReveal } from "@/components/PipelineReveal";
import { FlipWords } from "@/components/ui/flip-words";

import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { GalaxyButton } from "@/components/GalaxyButton";
import { Footer } from "@/components/Footer";
import { DemoCircle, DEMO_DATA, NEUTRAL_TEXTURE, stopAllDemos, type Demo } from "@/components/DemoCircle";

/* ── Use-case icons ───────────────────────────────────────────── */

const UC_ICON = "w-10 h-10";
const USE_CASE_ICONS: Record<string, React.ReactNode> = {
  video: <svg viewBox="0 0 24 24" className={UC_ICON} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
  mic: <svg viewBox="0 0 24 24" className={UC_ICON} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>,
  film: <svg viewBox="0 0 24 24" className={UC_ICON} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 19 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125" /></svg>,
  megaphone: <svg viewBox="0 0 24 24" className={UC_ICON} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75a2.25 2.25 0 0 1 2.25-2.25h1.5c.704 0 1.402-.03 2.09-.09m0 12.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a1.03 1.03 0 0 1-1.378-.392 19.19 19.19 0 0 1-1.108-2.545m2.621-13.927c5.024.497 9.41 3.391 11.41 7.327-2 3.936-6.386 6.83-11.41 7.327" /></svg>,
  book: <svg viewBox="0 0 24 24" className={UC_ICON} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,
  zap: <svg viewBox="0 0 24 24" className={UC_ICON} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
};

const UC_COLORS = [
  { bg: "#e8f4fd", orb1: "#3b82f6", orb2: "#93c5fd", orb3: "#c084fc" },
  { bg: "#f3e8ff", orb1: "#a855f7", orb2: "#f472b6", orb3: "#818cf8" },
  { bg: "#fde8e8", orb1: "#ef4444", orb2: "#f97316", orb3: "#fbbf24" },
  { bg: "#e8faf0", orb1: "#10b981", orb2: "#2dd4bf", orb3: "#3b82f6" },
  { bg: "#fef3e2", orb1: "#f59e0b", orb2: "#ef4444", orb3: "#f97316" },
  { bg: "#eef2f7", orb1: "#6366f1", orb2: "#8b5cf6", orb3: "#06b6d4" },
];

/* ── Landing-specific demo subset (7 for hero layout) ──────────── */


/* ── Audio Waveform Decoration ─────────────────────────────────── */

function AudioWaveDecoration() {
  const BAR_COUNT = 48;

  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => {
        const x = (i / (BAR_COUNT - 1)) * 2 - 1; // -1 to 1
        // Gaussian envelope — flat at edges, peak in center
        const envelope = Math.exp(-(x * x) / 0.28);
        // Deterministic pseudo-random variation for natural look
        const rand = ((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;
        return Math.max(0.06, envelope * (0.35 + rand * 0.65));
      }),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.0, duration: 0.6 }}
      className="flex items-center justify-center gap-[3px] h-14 mb-5 w-full max-w-xl"
      aria-hidden
    >
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="inline-block w-[2px] rounded-full bg-accent/40"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            delay: 0.1 + Math.abs(i - BAR_COUNT / 2) * 0.012,
            duration: 0.5,
            type: "spring",
            bounce: 0.25,
          }}
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </motion.div>
  );
}

/* ── Capabilities ──────────────────────────────────────────────── */

/* Capabilities are loaded from translations in the component */

function ScrollingTags({
  items,
  direction = 1,
  speed = 20,
}: {
  items: string[];
  direction?: number;
  speed?: number;
}) {
  const tripled = [...items, ...items, ...items];
  return (
    <div className="relative overflow-x-clip w-full py-1.5">
      <div
        className="flex w-max items-center gap-3"
        style={{
          animation: `scroll-${direction > 0 ? "left" : "right"} ${speed}s linear infinite`,
          willChange: "transform",
        }}
      >
        {tripled.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex items-center whitespace-nowrap rounded-full bg-contrast/[0.04] border border-contrast/[0.08] px-4 py-1.5 text-[13px] text-contrast/50 cursor-default transition-all duration-300 hover:bg-contrast/[0.08] hover:text-contrast/80"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── FadeIn ────────────────────────────────────────────────────── */

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function Home() {
  const t = useTranslations("home");
  const tAbout = useTranslations("about");
  const locale = useLocale();
  const router = useRouter();
  const apiToken = useApiToken();
  const useCaseItems = tAbout.raw("forWhoItems") as { icon: string; label: string; desc: string }[];

  const DEMO_CLIPS: Record<string, string> = {
    pizzeria: "/textures/pizzeria.mp4",
    meditacion: "/textures/meditacion.mp4",
    informativo: "/textures/informativo.mp4",
    thriller: "/textures/thriller.mp4",
    documental: "/textures/documental.mp4",
    audiocuento: "/textures/audiocuento.mp4",
    trailer: "/textures/trailer.mp4",
  };

  const DEMOS: Demo[] = DEMO_DATA.map(d => ({
    ...d,
    file: `/demos/${locale}/${d.filename}`,
    title: t(`demos.${d.key}` as Parameters<typeof t>[0]),
    texture: NEUTRAL_TEXTURE,
    clip: DEMO_CLIPS[d.id],
  }));

  const CAPABILITIES = (t("capabilities") as string).split(",");

  const handleSubmit = useCallback(
    async (prompt: string) => {
      // Admin overrides from localStorage (if set)
      const adminOverrides: Record<string, string> = {};
      const savedModel = localStorage.getItem("sonificalabs_admin_model");
      const savedTts = localStorage.getItem("sonificalabs_admin_tts_model");
      if (savedModel) adminOverrides.model = savedModel;
      if (savedTts) adminOverrides.ttsModel = savedTts;

      let res: Response;
      try {
        res = await apiFetch("/produce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, ...adminOverrides }),
        }, apiToken);
      } catch {
        throw new Error(t("serviceUnavailable"));
      }

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.setItem("sonificalabs_draft", prompt);
          window.location.href = "/signin?callbackUrl=/";
          return;
        }
        if (res.status === 403) {
          const data = await res.json();
          const err = new Error(data.error || "Quota exceeded");
          err.name = "QuotaError";
          throw err;
        }
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("Retry-After") || "30", 10);
          const err = new Error(`rate_limit:${retryAfter}`);
          err.name = "RateLimitError";
          throw err;
        }
        const data = await res.json();
        throw new Error(data.error || "Failed to start production");
      }

      const { jobId } = await res.json();
      router.push(`/p/${jobId}`);
    },
    [router, apiToken, t],
  );

  return (
    <main className="relative flex flex-col items-center overflow-hidden">
      <div className="absolute top-0 sm:top-[32vh] left-0 z-0 w-full pointer-events-none overflow-hidden">
        <motion.img
          alt=""
          className="w-full h-auto min-h-[70vh] object-cover object-top sm:min-h-0 sm:object-fill"
          src="/waves-bg.jpg"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
      </div>
      <Navbar />

      {/* ── Hero with circle demos on sides ─────────────────── */}
      <section className="relative z-10 w-full min-h-screen flex items-start justify-center px-4 pt-28 sm:pt-[18vh]">
        <div className="w-full max-w-7xl flex items-center justify-center gap-14 xl:gap-20">

          {/* Left column — alternating offsets */}
          <div className="hidden lg:flex flex-col items-center gap-6 flex-shrink-0">
            <div className="translate-x-10">
              <DemoCircle demo={DEMOS[0]} delay={1.5} size={96} />
            </div>
            <div className="-translate-x-6">
              <DemoCircle demo={DEMOS[1]} delay={1.62} size={96} />
            </div>
            <div className="translate-x-4">
              <DemoCircle demo={DEMOS[2]} delay={1.74} size={96} />
            </div>
            <div className="-translate-x-10">
              <DemoCircle demo={DEMOS[3]} delay={1.86} size={96} />
            </div>
          </div>

          {/* Center hero content */}
          <div className="flex flex-col items-center w-full max-w-2xl">
          {/* Hero text block */}
          <div className="flex flex-col items-center mb-14 select-none text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-display-sm md:text-display-md lg:text-display-lg font-medium text-contrast font-body"
              style={{ letterSpacing: "-0.05em" }}
            >
              {t("heroLine")}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-[3.2rem] sm:text-[4.2rem] md:text-[5.5rem] font-black leading-[0.95] -mt-2 font-body"
              style={{ letterSpacing: "-0.04em" }}
            >
              <FlipWords
                words={(t("flipWords") as string).split(",")}
                duration={2000}
                className="galaxy-text-gradient"
              />
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="block -mt-2 text-sm sm:text-base text-contrast/35 font-body tracking-normal max-w-md"
            >
              {t("heroSub")}
            </motion.span>
          </div>

          {/* Prompt form */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full"
          >
            <PromptForm onSubmit={handleSubmit} />
          </motion.div>

          {/* Mobile circles — horizontal scrollable */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:hidden mt-10 w-full"
          >
            <div className="flex justify-center mb-4">
            <span className="text-[10px] font-mono text-contrast/90 uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-contrast/10">
              {t("listenExamples")}
            </span>
            </div>
            <div className="flex items-center justify-center gap-5 flex-wrap">
              {DEMOS.map((demo, i) => (
                <DemoCircle key={demo.id} demo={demo} delay={1.5 + i * 0.1} size={96} />
              ))}
            </div>
          </motion.div>
          </div>

          {/* Right column — alternating offsets (mirrored) */}
          <div className="hidden lg:flex flex-col items-center gap-6 flex-shrink-0">
            <div className="-translate-x-7">
              <DemoCircle demo={DEMOS[4]} delay={1.55} size={96} />
            </div>
            <div className="translate-x-9">
              <DemoCircle demo={DEMOS[5]} delay={1.67} size={96} />
            </div>
            <div className="-translate-x-4">
              <DemoCircle demo={DEMOS[6]} delay={1.79} size={96} />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          type="button"
          onClick={() => document.getElementById("hecho-para-crear")?.scrollIntoView({ behavior: "smooth" })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer p-2 hover:text-accent transition-colors hidden lg:block"
        >
          <motion.svg
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-6 text-contrast/30 hover:text-accent transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </motion.svg>
        </motion.button>
      </section>

      {/* ── Use cases ─────────────────────────────────────── */}
      <section id="hecho-para-crear" className="w-full max-w-6xl px-6 pt-24 pb-16 mx-auto">
        <FadeIn>
          <h2 className="text-display-sm md:text-display-md font-logo tracking-tight text-center text-contrast mb-3">
            {tAbout("forWhoTitle")}
          </h2>
          <p className="text-body-lg text-contrast/40 text-center mb-14 max-w-lg mx-auto leading-relaxed">
            {tAbout("forWhoSubtitle")}
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useCaseItems.map((item, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="group relative p-7 rounded-2xl cursor-default h-full overflow-hidden"
                style={{ background: (UC_COLORS[i] || UC_COLORS[5]).bg }}
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-50 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none" style={{ background: (UC_COLORS[i] || UC_COLORS[5]).orb1 }} />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-[50px] opacity-40 group-hover:opacity-65 transition-opacity duration-500 pointer-events-none" style={{ background: (UC_COLORS[i] || UC_COLORS[5]).orb2 }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-[45px] opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" style={{ background: (UC_COLORS[i] || UC_COLORS[5]).orb3 }} />
                <span className="relative block mb-4 text-text-primary/60 group-hover:text-text-primary transition-colors duration-300">
                  {USE_CASE_ICONS[item.icon]}
                </span>
                <p className="relative text-heading-md font-semibold text-text-primary mb-2">{item.label}</p>
                <p className="relative text-body-md text-text-primary/45 leading-relaxed group-hover:text-text-primary/65 transition-colors duration-300">{item.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── How it works — Pipeline Reveal ─────────────────── */}
      <PipelineReveal />

      {/* ── CTA (above the scrolling tags) ──────────────────── */}
      <section className="relative z-10 w-full max-w-2xl px-4 pt-16 pb-8 text-center">
        <FadeIn>
          <h2 className="text-display-sm md:text-display-md font-logo tracking-tight text-contrast mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-sm text-contrast/60 mb-8 max-w-md mx-auto">
            {t("ctaSubtitle")}
          </p>
          <GalaxyButton
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            {t("ctaButton")}
          </GalaxyButton>
        </FadeIn>
      </section>

      {/* ── Capabilities scroll ─────────────────────────────── */}
      <section className="relative z-10 w-screen py-8 pb-16">
        <FadeIn className="space-y-2">
          <ScrollingTags items={CAPABILITIES.slice(0, 6)} direction={1} speed={22} />
          <ScrollingTags items={CAPABILITIES.slice(6)} direction={-1} speed={18} />
        </FadeIn>
      </section>

      <Footer />
    </main>
  );
}
