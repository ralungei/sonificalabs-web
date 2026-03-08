"use client";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Navbar } from "@/components/Navbar";
import { PromptForm } from "@/components/PromptForm";
import { PipelineReveal } from "@/components/PipelineReveal";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { apiFetch } from "@/lib/api";

/* ── Demos ─────────────────────────────────────────────────────── */

interface Demo {
  id: string;
  title: string;
  icon: string;
  file: string;
  texture: React.CSSProperties;
}

const NEUTRAL_TEXTURE: React.CSSProperties = {
  background: "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(circle at 50% 50%, #161618 0%, #0e0e10 100%)",
};

const DEMO_DATA = [
  { id: "truecrime", key: "truecrime", icon: "🎙", filename: "demo-podcast-truecrime.mp3" },
  { id: "pizzeria", key: "pizzeria", icon: "📢", filename: "demo-spot-pizzeria.mp3" },
  { id: "epica", key: "epica", icon: "🎬", filename: "demo-intro-epica.mp3" },
  { id: "humor", key: "humor", icon: "😂", filename: "demo-sketch-humor.mp3" },
  { id: "meditacion", key: "meditacion", icon: "🧘", filename: "demo-meditacion-asmr.mp3" },
  { id: "informativo", key: "informativo", icon: "📰", filename: "demo-noticiero.mp3" },
  { id: "thriller", key: "thriller", icon: "🔪", filename: "demo-thriller.mp3" },
  { id: "documental", key: "documental", icon: "🌍", filename: "demo-documental.mp3" },
  { id: "audiocuento", key: "audiocuento", icon: "📖", filename: "demo-audiocuento.mp3" },
  { id: "trailer", key: "trailer", icon: "🎥", filename: "demo-trailer.mp3" },
];


/* ── Global stop registry for demo players ─────────────────────── */

const stopFns = new Set<() => void>();

function stopAllDemos() {
  stopFns.forEach((fn) => fn());
}

/* ── Random highlight rotation ─────────────────────────────────── */

/** Subscribers receive their index when it's their turn to glow. */
type HighlightCb = (active: boolean) => void;
const highlightSubs: HighlightCb[] = [];
let highlightTimer: ReturnType<typeof setInterval> | null = null;
let highlightIdx = -1;
let highlightStarted = false;

function tick() {
  if (highlightSubs.length <= 1) return;
  let next: number;
  do { next = Math.floor(Math.random() * highlightSubs.length); } while (next === highlightIdx);
  if (highlightIdx >= 0 && highlightIdx < highlightSubs.length) highlightSubs[highlightIdx](false);
  highlightIdx = next;
  highlightSubs[highlightIdx](true);
}

function startHighlightLoop() {
  if (highlightTimer || highlightStarted) return;
  highlightStarted = true;
  // Wait 2.5s after page loads before first highlight
  setTimeout(() => {
    tick();
    highlightTimer = setInterval(tick, 2500);
  }, 2500);
}

function stopHighlightLoop() {
  if (highlightTimer) { clearInterval(highlightTimer); highlightTimer = null; }
  if (highlightIdx >= 0 && highlightIdx < highlightSubs.length) highlightSubs[highlightIdx](false);
  highlightIdx = -1;
  highlightStarted = false;
}

function registerHighlight(cb: HighlightCb) {
  highlightSubs.push(cb);
  // Start loop once we have 3+ circles ready (don't wait for all 10)
  if (highlightSubs.length >= 3 && !highlightStarted) startHighlightLoop();
  return () => {
    const i = highlightSubs.indexOf(cb);
    if (i >= 0) highlightSubs.splice(i, 1);
    if (highlightSubs.length === 0) stopHighlightLoop();
  };
}

/* ── Circle demo player ───────────────────────────────────────── */

const CIRCLE_R = 25;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R;

/** Convert mouse position relative to circle center into a 0-1 ratio (12 o'clock = 0, clockwise). */
function angleToRatio(cx: number, cy: number, mx: number, my: number): number {
  const angle = Math.atan2(mx - cx, -(my - cy)); // 0 = top, clockwise positive
  const normalized = angle < 0 ? angle + 2 * Math.PI : angle;
  return normalized / (2 * Math.PI);
}

function DemoCircle({
  demo,
  delay,
  size = 64,
}: {
  demo: Demo;
  delay: number;
  size?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [listened, setListenedRaw] = useState(false);
  const setListened = useCallback((v: boolean) => {
    setListenedRaw(v);
    if (v) {
      try { const key = "sonificalabs_listened";
        const set = JSON.parse(localStorage.getItem(key) || "[]");
        if (!set.includes(demo.id)) { set.push(demo.id); localStorage.setItem(key, JSON.stringify(set)); }
      } catch {}
    }
  }, [demo.id]);
  const [initDone, setInitDone] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const glowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaying(false);
  }, []);

  // Restore listened state from localStorage on mount
  useEffect(() => {
    try {
      const set = JSON.parse(localStorage.getItem("sonificalabs_listened") || "[]");
      if (set.includes(demo.id)) setListenedRaw(true);
    } catch {}
    setInitDone(true);
  }, [demo.id]);

  useEffect(() => {
    stopFns.add(stop);
    const unregister = registerHighlight(setHighlighted);
    return () => {
      stopFns.delete(stop);
      unregister();
      if (glowTimeout.current) clearTimeout(glowTimeout.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [stop]);

  // Glow follows highlighted instantly ON, but fades OFF with delay
  useEffect(() => {
    if (highlighted) {
      if (glowTimeout.current) { clearTimeout(glowTimeout.current); glowTimeout.current = null; }
      setGlowing(true);
    } else {
      glowTimeout.current = setTimeout(() => setGlowing(false), 600);
    }
  }, [highlighted]);

  const ensureAudio = () => {
    if (!audioRef.current) {
      const el = new Audio(demo.file);
      el.onended = () => { setPlaying(false); setProgress(0); setListened(true); };
      el.ontimeupdate = () => {
        if (!el.duration) return;
        setProgress(el.currentTime / el.duration);
      };
      el.onerror = () => {
        console.error(`[Demo] Failed to load audio: ${demo.file}`, el.error);
        setPlaying(false);
      };
      audioRef.current = el;
    }
    return audioRef.current;
  };

  const toggle = () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      setListened(true);
      return;
    }
    stopAllDemos();
    const el = ensureAudio();
    el.play();
    setPlaying(true);
  };

  const handleRingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = ensureAudio();
    const rect = ringRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const ratio = angleToRatio(cx, cy, e.clientX, e.clientY);

    // If audio hasn't loaded duration yet, stop others and start playing first
    if (!el.duration) {
      stopAllDemos();
      el.play();
      setPlaying(true);
      // Seek once metadata loads
      el.onloadedmetadata = () => {
        el.currentTime = ratio * el.duration;
      };
      return;
    }
    el.currentTime = ratio * el.duration;
    if (!playing) {
      stopAllDemos();
      el.play();
      setPlaying(true);
    }
  };

  const handleRingMove = (e: React.MouseEvent) => {
    const rect = ringRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setHoverRatio(angleToRatio(cx, cy, e.clientX, e.clientY));
  };

  // Whether audio has been interacted with (show ring even when paused)
  const hasAudio = audioRef.current !== null;
  const showProgress = playing || (hasAudio && progress > 0);
  // Highlight glow only on unlistened, non-playing circles
  const showHighlight = glowing && !listened && !playing;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, filter: "saturate(1)" }}
      animate={{
        opacity: listened ? 0.45 : 1,
        scale: 1,
        filter: listened ? "saturate(0.4)" : "saturate(1)",
      }}
      transition={{
        scale: { duration: 0.5, delay, type: "spring", bounce: 0.3 },
        opacity: { duration: initDone && listened ? 1.5 : 0.5, delay, ease: "easeOut" },
        filter: { duration: 1.5, delay, ease: "easeOut" },
      }}
      className="flex flex-col items-center gap-2.5"
    >
      <div
        ref={ringRef}
        style={{ height: size, width: size }}
        className="relative rounded-full cursor-pointer"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setHoverRatio(null); }}
        onMouseMove={handleRingMove}
        onClick={handleRingClick}
      >
        {/* Clickable ring area — invisible expanded hit zone */}
        <svg className="absolute inset-0 -rotate-90 overflow-visible" viewBox="0 0 64 64">
          {/* Background ring */}
          <circle
            cx="32" cy="32" r={CIRCLE_R}
            fill="none" stroke="currentColor"
            strokeWidth={hovering ? "14" : "12"}
            className="text-white/[0.08] transition-all duration-200"
          />
          {/* Progress ring */}
          {showProgress && (
            <circle
              cx="32" cy="32" r={CIRCLE_R}
              fill="none" stroke="currentColor"
              strokeWidth={hovering ? "14" : "12"}
              className="text-accent transition-[stroke-dashoffset] duration-100"
              strokeDasharray={CIRCLE_C}
              strokeDashoffset={CIRCLE_C * (1 - progress)}
              strokeLinecap="butt"
            />
          )}
          {/* Hover preview — faint ring up to hover position */}
          {hovering && hoverRatio !== null && (
            <circle
              cx="32" cy="32" r={CIRCLE_R}
              fill="none" stroke="currentColor" strokeWidth="14"
              className="text-white/[0.15]"
              strokeDasharray={CIRCLE_C}
              strokeDashoffset={CIRCLE_C * (1 - hoverRatio)}
              strokeLinecap="butt"
            />
          )}
        </svg>

        {/* Center button — mesh gradient per demo */}
        {/* Accent tint overlay — fades in/out smoothly */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showHighlight ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-[10px] rounded-full pointer-events-none border-2 border-accent/40"
          style={{ background: "radial-gradient(circle, rgba(232,168,56,0.2) 0%, rgba(232,168,56,0.06) 100%)", zIndex: 5 }}
        />
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          animate={showHighlight
            ? { scale: [1, 1.12, 1] }
            : { scale: 1 }
          }
          transition={showHighlight
            ? { duration: 1.6, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.6, ease: "easeOut" }
          }
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={demo.texture}
          className="absolute inset-[10px] rounded-full cursor-pointer flex items-center justify-center border border-white/[0.12] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-300 group"
        >
          {playing ? (
            <svg className="h-4 w-4 text-accent transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <>
              {/* Play icon — always visible */}
              <motion.svg
                animate={showHighlight
                  ? { scale: [1, 1.25, 1] }
                  : { scale: 1 }
                }
                transition={showHighlight
                  ? { duration: 1.6, ease: "easeInOut", repeat: Infinity }
                  : { duration: 0.6, ease: "easeOut" }
                }
                className="h-4 w-4 text-white/70 group-hover:text-accent group-hover:scale-110"
                fill="currentColor" viewBox="0 0 24 24"
              >
                <path d="M19.266 13.516a1.917 1.917 0 0 0 0-3.032A35.8 35.8 0 0 0 9.35 5.068l-.653-.232c-1.248-.443-2.567.401-2.736 1.69a42.5 42.5 0 0 0 0 10.948c.17 1.289 1.488 2.133 2.736 1.69l.653-.232a35.8 35.8 0 0 0 9.916-5.416"/>
              </motion.svg>
              {/* Glowing accent play icon — fades in/out on top */}
              <motion.svg
                initial={{ opacity: 0 }}
                animate={showHighlight
                  ? { opacity: 1, scale: [1, 1.25, 1] }
                  : { opacity: 0, scale: 1 }
                }
                transition={showHighlight
                  ? { opacity: { duration: 0.8, ease: "easeIn" }, scale: { duration: 1.6, ease: "easeInOut", repeat: Infinity } }
                  : { opacity: { duration: 0.8, ease: "easeOut" }, scale: { duration: 0.6, ease: "easeOut" } }
                }
                className="h-4 w-4 text-white play-glow absolute"
                fill="currentColor" viewBox="0 0 24 24"
              >
                <path d="M19.266 13.516a1.917 1.917 0 0 0 0-3.032A35.8 35.8 0 0 0 9.35 5.068l-.653-.232c-1.248-.443-2.567.401-2.736 1.69a42.5 42.5 0 0 0 0 10.948c.17 1.289 1.488 2.133 2.736 1.69l.653-.232a35.8 35.8 0 0 0 9.916-5.416"/>
              </motion.svg>
            </>
          )}
        </motion.button>
      </div>

      {/* Label just below the circle */}
      <span className="text-[10px] text-white/60 font-medium tracking-widest uppercase">
        {demo.title}
      </span>
    </motion.div>
  );
}


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
            className="inline-flex items-center whitespace-nowrap rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 text-[13px] text-white/50 cursor-default transition-all duration-300 hover:bg-white/[0.08] hover:text-white/80"
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
  const locale = useLocale();
  const router = useRouter();

  const DEMOS: Demo[] = DEMO_DATA.map(d => ({
    ...d,
    file: `/demos/${locale}/${d.filename}`,
    title: t(`demos.${d.key}` as Parameters<typeof t>[0]),
    texture: NEUTRAL_TEXTURE,
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

      const res = await apiFetch("/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ...adminOverrides }),
      });

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
    [router],
  );

  return (
    <main className="relative flex flex-col items-center overflow-hidden">
      <BackgroundBeams />
      <Navbar />

      {/* ── Hero with circle demos on sides ─────────────────── */}
      <section className="relative z-10 w-full min-h-screen flex items-start justify-center px-4 pt-[18vh]">
        <div className="w-full max-w-7xl flex items-center justify-center gap-14 xl:gap-20">

          {/* Left column — alternating offsets */}
          <div className="hidden lg:flex flex-col items-center gap-6 flex-shrink-0">
            <div className="translate-x-10">
              <DemoCircle demo={DEMOS[0]} delay={1.5} size={72} />
            </div>
            <div className="-translate-x-6">
              <DemoCircle demo={DEMOS[1]} delay={1.62} size={72} />
            </div>
            <div className="translate-x-4">
              <DemoCircle demo={DEMOS[2]} delay={1.74} size={72} />
            </div>
            <div className="-translate-x-10">
              <DemoCircle demo={DEMOS[3]} delay={1.86} size={72} />
            </div>
            <div className="translate-x-7">
              <DemoCircle demo={DEMOS[4]} delay={1.98} size={72} />
            </div>
          </div>

          {/* Center hero content */}
          <div className="flex flex-col items-center w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center mb-12 select-none text-center font-logo tracking-[0.04em]"
          >
            <span className="text-3xl sm:text-4xl md:text-5xl bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-transparent leading-tight">
              {t("heroLine")}
            </span>
            <span className="text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] leading-none -mt-1 ">
              <LayoutTextFlip
                words={(t("flipWords") as string).split(",")}
                duration={2500}
              />
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="w-full"
          >
            <PromptForm onSubmit={handleSubmit} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-5 text-[11px] text-white/90 text-center font-body uppercase tracking-[0.2em]"
          >
            {t("tagline")}
          </motion.p>

          {/* Mobile circles — horizontal scrollable */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:hidden mt-10 w-full"
          >
            <p className="text-[10px] font-mono text-white/60 uppercase tracking-[0.2em] text-center mb-4">
              {t("listenExamples")}
            </p>
            <div className="flex items-center justify-center gap-5 flex-wrap">
              {DEMOS.slice(0, 7).map((demo, i) => (
                <DemoCircle key={demo.id} demo={demo} delay={1.5 + i * 0.1} />
              ))}
            </div>
          </motion.div>
          </div>

          {/* Right column — alternating offsets (mirrored) */}
          <div className="hidden lg:flex flex-col items-center gap-6 flex-shrink-0">
            <div className="-translate-x-7">
              <DemoCircle demo={DEMOS[5]} delay={1.55} size={72} />
            </div>
            <div className="translate-x-9">
              <DemoCircle demo={DEMOS[6]} delay={1.67} size={72} />
            </div>
            <div className="-translate-x-4">
              <DemoCircle demo={DEMOS[7]} delay={1.79} size={72} />
            </div>
            <div className="translate-x-10">
              <DemoCircle demo={DEMOS[8]} delay={1.91} size={72} />
            </div>
            <div className="-translate-x-8">
              <DemoCircle demo={DEMOS[9]} delay={2.03} size={72} />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          type="button"
          onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer p-2 hover:text-accent transition-colors"
        >
          <motion.svg
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-6 text-white/30 hover:text-accent transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </motion.svg>
        </motion.button>
      </section>

      {/* ── How it works — Pipeline Reveal ─────────────────── */}
      <PipelineReveal />

      {/* ── CTA (above the scrolling tags) ──────────────────── */}
      <section className="relative z-10 w-full max-w-2xl px-4 pt-16 pb-8 text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-logo tracking-wide text-white mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-sm text-white/60 mb-8 max-w-md mx-auto">
            {t("ctaSubtitle")}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-surface-0 font-semibold text-sm transition-all duration-300 hover:bg-accent-bright hover:shadow-[0_0_40px_rgba(232,168,56,0.3)] active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            {t("ctaButton")}
          </button>
        </FadeIn>
      </section>

      {/* ── Capabilities scroll ─────────────────────────────── */}
      <section className="relative z-10 w-screen py-8 pb-16">
        <FadeIn className="space-y-2">
          <ScrollingTags items={CAPABILITIES.slice(0, 6)} direction={1} speed={22} />
          <ScrollingTags items={CAPABILITIES.slice(6)} direction={-1} speed={18} />
        </FadeIn>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
              <path d="m20.713 7.128-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M7 6a5 5 0 0 1 7.697-4.21l-1.08 1.682A3 3 0 0 0 9 6v6a3 3 0 1 0 6 0V7h2v5a5 5 0 0 1-10 0zm-4.808 7.962 1.962-.393a8.003 8.003 0 0 0 15.692 0l1.962.393C20.896 18.545 16.852 22 12 22s-8.896-3.455-9.808-8.038" />
            </svg>
            <span className="text-base font-brand tracking-[0.04em]">
              <span className="text-white">sonifica</span><span className="text-accent">labs</span>
            </span>
          </div>
          <p className="text-[11px] text-white/40">
            {t("footer")}
          </p>
        </div>
      </footer>
    </main>
  );
}
