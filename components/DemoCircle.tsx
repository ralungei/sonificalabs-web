"use client";
import { useCallback, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ── Types ─────────────────────────────────────────────────────── */

export interface Demo {
  id: string;
  title: string;
  icon: string;
  file: string;
  texture: React.CSSProperties;
  clip?: string;
}

export const NEUTRAL_TEXTURE: React.CSSProperties = {
  background: "#f5f5f5",
  boxShadow: "8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9), inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 2px rgba(0,0,0,0.04)",
};

export const DEMO_DATA = [
  { id: "pizzeria", key: "pizzeria", icon: "📢", filename: "demo-spot-pizzeria.mp3", category: "commercial" },
  { id: "meditacion", key: "meditacion", icon: "🧘", filename: "demo-meditacion-asmr.mp3", category: "wellness" },
  { id: "informativo", key: "informativo", icon: "📰", filename: "demo-noticiero.mp3", category: "tv" },
  { id: "thriller", key: "thriller", icon: "🔪", filename: "demo-thriller.mp3", category: "fiction" },
  { id: "documental", key: "documental", icon: "🌍", filename: "demo-documental.mp3", category: "tv" },
  { id: "audiocuento", key: "audiocuento", icon: "📖", filename: "demo-audiocuento.mp3", category: "wellness" },
  { id: "trailer", key: "trailer", icon: "🎥", filename: "demo-trailer.mp3", category: "fiction" },
];

/* ── Global stop registry ──────────────────────────────────────── */

const stopFns = new Set<() => void>();

export function stopAllDemos() {
  stopFns.forEach((fn) => fn());
}

/* ── Random highlight rotation ─────────────────────────────────── */

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

function angleToRatio(cx: number, cy: number, mx: number, my: number): number {
  const angle = Math.atan2(mx - cx, -(my - cy));
  const normalized = angle < 0 ? angle + 2 * Math.PI : angle;
  return normalized / (2 * Math.PI);
}

export function DemoCircle({
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

    if (!el.duration) {
      stopAllDemos();
      el.play();
      setPlaying(true);
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

  const hasAudio = audioRef.current !== null;
  const showProgress = playing || (hasAudio && progress > 0);
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
        <svg className="absolute inset-0 -rotate-90 overflow-visible" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r={CIRCLE_R}
            fill="none" stroke="currentColor"
            strokeWidth={hovering ? "14" : "12"}
            className="text-contrast/[0.08] transition-all duration-200"
          />
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
            <svg
              className={`h-4 w-4 group-hover:scale-110 transition-colors duration-300 ${hovering || showHighlight ? "text-white drop-shadow-md" : "text-contrast/70"}`}
              fill="currentColor" viewBox="0 0 24 24"
            >
              <path d="M19.266 13.516a1.917 1.917 0 0 0 0-3.032A35.8 35.8 0 0 0 9.35 5.068l-.653-.232c-1.248-.443-2.567.401-2.736 1.69a42.5 42.5 0 0 0 0 10.948c.17 1.289 1.488 2.133 2.736 1.69l.653-.232a35.8 35.8 0 0 0 9.916-5.416"/>
            </svg>
          )}
        </motion.button>
      </div>

      <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-contrast/10 text-contrast/90">
        {demo.title}
      </span>
    </motion.div>
  );
}
