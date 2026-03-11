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

/* ── Demos ─────────────────────────────────────────────────────── */

interface Demo {
  id: string;
  title: string;
  icon: string;
  file: string;
  texture: React.CSSProperties;
  clip?: string;
}

const NEUTRAL_TEXTURE: React.CSSProperties = {
  background: "#f5f5f5",
  boxShadow: "8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9), inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 2px rgba(0,0,0,0.04)",
};

const DEMO_DATA = [
  { id: "pizzeria", key: "pizzeria", icon: "📢", filename: "demo-spot-pizzeria.mp3" },
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
  const hasClip = !!demo.clip;
  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
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
      if (videoRef.current && !playing && !hovering) videoRef.current.play();
    } else {
      if (videoRef.current && !playing && !hovering) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
      glowTimeout.current = setTimeout(() => setGlowing(false), 600);
    }
  }, [highlighted, playing, hovering]);

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
  const showHighlight = glowing && !playing;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, filter: "saturate(1)" }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: "saturate(1)",
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
        onMouseEnter={() => { setHovering(true); videoRef.current?.play(); }}
        onMouseLeave={() => { setHovering(false); setHoverRatio(null); if (videoRef.current && !playing) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
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
            className="text-contrast/[0.08] transition-all duration-200"
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
              className="text-contrast/[0.15]"
              strokeDasharray={CIRCLE_C}
              strokeDashoffset={CIRCLE_C * (1 - hoverRatio)}
              strokeLinecap="butt"
            />
          )}
        </svg>

        {/* Center button — mesh gradient per demo */}
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          whileHover={{ scale: 1.1, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.9 }}
          style={demo.texture}
          className="absolute inset-[10px] rounded-full cursor-pointer flex items-center justify-center border border-contrast/[0.12] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.4)] group overflow-hidden"
        >
          {hasClip && (
            <video
              ref={videoRef}
              src={demo.clip}
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none transition-all duration-500"
              style={{
                opacity: hovering || playing || showHighlight ? 1 : 0,
                filter: hovering || playing ? "brightness(0.95) saturate(1.2)" : showHighlight ? "brightness(0.85) saturate(0.9)" : "brightness(0.75) saturate(0.4)",
              }}
            />
          )}
          {playing ? (
            <svg className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${hovering || playing ? "text-white" : "text-contrast/70"}`} fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <>
              {/* Play icon */}
              <svg
                className={`h-4 w-4 group-hover:scale-110 transition-colors duration-300 ${hovering || showHighlight ? "text-white drop-shadow-md" : "text-contrast/70"}`}
                fill="currentColor" viewBox="0 0 24 24"
              >
                <path d="M19.266 13.516a1.917 1.917 0 0 0 0-3.032A35.8 35.8 0 0 0 9.35 5.068l-.653-.232c-1.248-.443-2.567.401-2.736 1.69a42.5 42.5 0 0 0 0 10.948c.17 1.289 1.488 2.133 2.736 1.69l.653-.232a35.8 35.8 0 0 0 9.916-5.416"/>
              </svg>
            </>
          )}
        </motion.button>
      </div>

      {/* Label just below the circle */}
      <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-contrast/10 text-contrast/90">
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
          onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
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
      <section className="w-full max-w-6xl px-6 pt-24 pb-16 mx-auto">
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
