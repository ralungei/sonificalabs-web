"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { ShowActions } from "./ShowActions";
import type { ShowViewProps } from "./types";
import type { TimelineTrack, WordTiming } from "@/components/studio/types";

interface AudioLevels {
  bass: number;
  mid: number;
  treble: number;
  overall: number;
}

function readLevels(analyser: AnalyserNode | null, buf: Uint8Array): AudioLevels {
  if (!analyser) return { bass: 0, mid: 0, treble: 0, overall: 0 };
  analyser.getByteFrequencyData(buf as any);
  const len = buf.length;
  const third = Math.floor(len / 3);
  let b = 0, m = 0, t = 0;
  for (let i = 0; i < third; i++) b += buf[i];
  for (let i = third; i < third * 2; i++) m += buf[i];
  for (let i = third * 2; i < len; i++) t += buf[i];
  return {
    bass: b / third / 255,
    mid: m / third / 255,
    treble: t / (len - third * 2) / 255,
    overall: (b / third + m / third + t / (len - third * 2)) / 3 / 255,
  };
}

/** Strip TTS direction markers like [whispers] / (laughs). */
function cleanText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/\[.*?\]/g, "")
    .replace(/\(\s*(whispers?|sighs?|laughs?|sings?|chuckles?|gasps?|breathes?|coughs?|exhales?|inhales?)\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Build word-timings from track.text when backend didn't return any (linear estimate). */
function fallbackTimings(text: string, durationMs: number): WordTiming[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const per = durationMs / words.length;
  return words.map((w, i) => ({
    word: w,
    start_ms: Math.round(i * per),
    end_ms: Math.round((i + 1) * per),
  }));
}

export function RaveShow({
  jobId,
  audioUrl,
  tracks,
  prompt,
  title: backendTitle,
  durationMs,
  currentTimeMs,
  isPlaying,
  togglePlay,
  seek,
  analyser,
  userPlan,
}: ShowViewProps) {
  const ts = useTranslations("show");
  const TYPE_LABEL: Record<string, string> = {
    music: ts("trackMusic"),
    sfx: ts("trackSfx"),
    ambience: ts("trackAmbience"),
    stinger: ts("trackStinger"),
    voice: ts("trackVoice"),
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelsRef = useRef<AudioLevels>({ bass: 0, mid: 0, treble: 0, overall: 0 });
  const playingRef = useRef(isPlaying);
  const analyserLiveRef = useRef<AnalyserNode | null>(null);
  const [hasPlayedEver, setHasPlayedEver] = useState(false);

  useEffect(() => {
    playingRef.current = isPlaying;
    if (isPlaying && !hasPlayedEver) setHasPlayedEver(true);
  }, [isPlaying, hasPlayedEver]);

  useEffect(() => {
    analyserLiveRef.current = analyser ?? null;
  }, [analyser]);

  // Title: prefer AI-generated from backend, fallback to prompt slice
  const title = useMemo(() => {
    if (backendTitle && backendTitle.trim()) return backendTitle.trim();
    const clean = cleanText(prompt);
    if (!clean) return ts("untitled");
    const words = clean.split(/\s+/);
    if (words.length <= 6) return clean;
    return words.slice(0, 6).join(" ") + "…";
  }, [backendTitle, prompt]);

  // Auto-fit title: shrink + widen as text gets longer
  const titleStyle = useMemo(() => {
    const len = title.length;
    if (len <= 20) return { fontSize: "clamp(40px, 6.4vw, 76px)", maxWidth: "20ch" };
    if (len <= 36) return { fontSize: "clamp(32px, 5vw, 60px)", maxWidth: "28ch" };
    if (len <= 56) return { fontSize: "clamp(26px, 4vw, 46px)", maxWidth: "42ch" };
    return { fontSize: "clamp(22px, 3.2vw, 36px)", maxWidth: "58ch" };
  }, [title]);

  const voiceTracks = useMemo(
    () =>
      tracks
        .filter((t) => {
          if (t.type !== "voice") return false;
          // Judge by what would actually RENDER: a track whose text is only
          // direction markers ("[laughs]") cleans to "" and would occupy the
          // karaoke slot as a blank line.
          const hasText = cleanText(t.text).length > 0;
          const hasTimings = t.word_timings && t.word_timings.length > 0;
          return hasText || hasTimings;
        })
        .map((t) => {
          const hasTimings = t.word_timings && t.word_timings.length > 0;
          // Reconstruct text from word_timings if backend forgot to include it
          const cleaned = cleanText(t.text);
          const text =
            cleaned ||
            (hasTimings ? t.word_timings!.map((w) => w.word).join(" ") : "");
          return {
            ...t,
            cleanText: text,
            timings: hasTimings
              ? t.word_timings!
              : fallbackTimings(text, t.duration_ms),
          };
        })
        .sort((a, b) => a.start_ms - b.start_ms),
    [tracks],
  );

  // Active voice index (which "line")
  const activeVoiceIdx = useMemo(() => {
    if (voiceTracks.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < voiceTracks.length; i++) {
      const v = voiceTracks[i];
      const tailMs = 400;
      if (currentTimeMs >= v.start_ms && currentTimeMs < v.start_ms + v.duration_ms + tailMs) {
        return i;
      }
      if (currentTimeMs >= v.start_ms) idx = i;
    }
    return idx;
  }, [voiceTracks, currentTimeMs]);

  const activeNonVoice = useMemo(() => {
    if (!isPlaying) return [];
    return tracks
      .filter((t) => t.type !== "voice")
      .filter((t) => {
        // Cap at the master's real end — looped beds report durations far
        // beyond the piece and their chips would linger past the music
        // (same cap LiveTrackChips got in 112b65b).
        const endMs = durationMs > 0
          ? Math.min(t.start_ms + t.duration_ms, durationMs)
          : t.start_ms + t.duration_ms;
        return currentTimeMs >= t.start_ms && currentTimeMs < endMs;
      });
  }, [tracks, currentTimeMs, isPlaying, durationMs]);

  // ── Particle field (orbital, oklch palette) ────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0;
    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    }

    type P = {
      x: number; y: number;
      a: number;       // angle
      rad: number;     // orbit radius
      size: number;
      isTeal: boolean;
      shade: number;   // 0..1, bias light
      drift: number;
      phase: number;
    };
    let particles: P[] = [];
    function spawn() {
      // Spawn once — respawning on every ResizeObserver fire (mobile URL bar,
      // window drags) visibly teleported the whole field.
      if (particles.length > 0) return;
      const count = 55;
      particles = new Array(count).fill(0).map(() => {
        const isTeal = Math.random() < 0.35;
        const shade = Math.pow(Math.random(), 1.6); // bias light
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          a: Math.random() * Math.PI * 2,
          rad: 80 + Math.random() * Math.min(w, h) * 0.5,
          size:
            Math.random() < 0.02
              ? 2.4 + Math.random() * 1.6
              : 0.6 + Math.random() * 1.4,
          isTeal,
          shade,
          drift: 0.00008 + Math.random() * 0.00018,
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let buf = new Uint8Array(512);
    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      if (!canvas || !ctx) return;
      const dt = Math.min(50, now - last) / 1000;
      last = now;

      // Read the analyser through a ref: keying this effect on the analyser
      // prop tore down the canvas (trail wipe + particle teleport) exactly
      // when the user pressed play for the first time.
      const analyserNow = analyserLiveRef.current;
      if (analyserNow && buf.length !== analyserNow.frequencyBinCount) {
        buf = new Uint8Array(analyserNow.frequencyBinCount);
      }
      const lv = readLevels(analyserNow, buf);
      levelsRef.current = lv;
      const playing = playingRef.current;
      const energy = playing ? lv.overall : 0.05;
      const pulse = playing ? lv.bass : 0;

      const cx = w / 2;
      const cy = h * 0.5;

      // Soft trail (cleans without smearing)
      ctx.fillStyle = "rgba(250,250,250,0.22)";
      ctx.fillRect(0, 0, w, h);

      const tealHue = 195;

      for (const p of particles) {
        p.a += (p.drift + energy * 0.00008) * (dt * 1000);
        const radNow =
          p.rad +
          Math.sin(now * 0.00015 + p.phase) * 4 +
          pulse * 1.5 * (0.4 + p.shade);
        const tx = cx + Math.cos(p.a) * radNow;
        const ty = cy + Math.sin(p.a) * radNow * 0.82;
        p.x += (tx - p.x) * 0.008;
        p.y += (ty - p.y) * 0.008;

        const sz = p.size * (1 + pulse * 0.06);
        const alpha = playing
          ? 0.08 + p.shade * 0.32 + energy * 0.12
          : 0.05 + p.shade * 0.15;

        if (p.isTeal) {
          ctx.fillStyle = `oklch(${(0.72 + p.shade * 0.08).toFixed(3)} 0.08 ${tealHue} / ${alpha.toFixed(3)})`;
        } else {
          const L = 0.35 + p.shade * 0.4;
          ctx.fillStyle = `oklch(${L.toFixed(3)} 0 0 / ${alpha.toFixed(3)})`;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const prevVoice = activeVoiceIdx > 0 ? voiceTracks[activeVoiceIdx - 1] : null;
  const currVoice = activeVoiceIdx >= 0 ? voiceTracks[activeVoiceIdx] : null;
  const nextVoice =
    activeVoiceIdx >= 0 && activeVoiceIdx < voiceTracks.length - 1
      ? voiceTracks[activeVoiceIdx + 1]
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] pt-14">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />

      <AnimatePresence mode="wait">
        {hasPlayedEver ? (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            // NOT display:contents — a contents element generates no box, so
            // the animated opacity would be a visual no-op. A plain wrapper
            // doesn't disturb the absolute children (they anchor to <main>).
          >
            {/* Karaoke center */}
            <div
              className="absolute z-10 inset-x-0 flex items-center justify-center px-6 md:px-16"
              style={{ top: 56, bottom: 196 }}
            >
              <div className="kk-stack">
                <KaraokeLine track={prevVoice} kind="prev" currentTimeMs={currentTimeMs} />
                <KaraokeLine track={currVoice} kind="curr" currentTimeMs={currentTimeMs} />
                <KaraokeLine track={nextVoice} kind="next" currentTimeMs={currentTimeMs} />
              </div>
            </div>

            {/* Bottom player bar — slides up from below */}
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 inset-x-0 z-30 px-4 pb-5 pt-2"
            >
              <div className="mx-auto max-w-5xl player-bar">
                {/* Row 1: chips + freq bars + title */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 min-h-[44px]">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {activeNonVoice.map((t) => (
                      <span key={t.index} className="player-chip">
                        <span className="player-chip-dot" />
                        <span>{TYPE_LABEL[t.type] || t.type}</span>
                        <span className="text-[#a0a0a0] font-normal truncate max-w-[14ch]">
                          {t.label}
                        </span>
                      </span>
                    ))}
                  </div>

                  <FreqBars analyser={analyser} playing={isPlaying} />

                  <div className="text-right min-w-0">
                    <div className="text-[13px] font-player font-semibold tracking-tight text-[#0a0a0a] truncate">
                      {title}
                    </div>
                  </div>
                </div>

                {/* Row 2: progress */}
                <ProgressBar
                  value={currentTimeMs}
                  max={durationMs}
                  onSeek={(ratio) => seek(ratio)}
                />

                {/* Row 3: controls */}
                <div className="grid grid-cols-3 items-center gap-4 pt-0.5">
                  <div className="flex items-center gap-1">
                    <CopyPromptButton text={cleanText(prompt)} label={ts("copyPrompt")} />
                  </div>

                  <div className="flex items-center gap-2 justify-self-center">
                    <button
                      onClick={togglePlay}
                      className="player-play"
                      aria-label={isPlaying ? ts("pause") : ts("play")}
                    >
                      <Icon
                        icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"}
                        className="h-6 w-6"
                        style={{ marginLeft: isPlaying ? 0 : 2 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 justify-self-end">
                    <ShowActions
                      inline
                      jobId={jobId}
                      audioUrl={audioUrl}
                      prompt={prompt}
                      userPlan={userPlan}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="cover"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-10 inset-x-0 grid place-items-center px-6"
            style={{ top: 56, bottom: 0 }}
          >
            <div className="flex flex-col items-center gap-10 text-center">
              <h1
                className="font-player font-semibold tracking-[-0.025em] text-[#0a0a0a] leading-[1.08] text-balance"
                style={titleStyle}
              >
                {title}
              </h1>
              <button
                onClick={togglePlay}
                aria-label={ts("play")}
                className="player-play"
                style={{ width: 72, height: 72 }}
              >
                <Icon icon="solar:play-bold" className="h-8 w-8" style={{ marginLeft: 3 }} />
              </button>
              <CopyPromptButton text={cleanText(prompt)} label={ts("copyPrompt")} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ── Karaoke line (prev / curr / next) ─────────────────────────────────

function KaraokeLine({
  track,
  kind,
  currentTimeMs,
}: {
  track: (TimelineTrack & { cleanText: string; timings: WordTiming[] }) | null;
  kind: "prev" | "curr" | "next";
  currentTimeMs: number;
}) {
  if (!track) return <div className="kk-line kk-ghost" />;
  const sizeStyle =
    kind === "curr"
      ? { fontSize: "clamp(36px, 5.4vw, 64px)" }
      : { fontSize: "clamp(16px, 2.1vw, 26px)" };
  const localMs = currentTimeMs - track.start_ms;

  return (
    <div className={`kk-line kk-${kind}`} style={sizeStyle}>
      {track.timings.map((w, i) => {
        let state: "future" | "active" | "past" = "future";
        if (localMs >= w.end_ms - 20) state = "past";
        else if (localMs >= w.start_ms - 80) state = "active";

        return (
          <span key={i} className={`kk-word kk-${state}`}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
}

// ── Frequency bars (DOM-based with peak follow) ───────────────────────

function FreqBars({
  analyser,
  playing,
  count = 48,
}: {
  analyser?: AnalyserNode | null;
  playing: boolean;
  count?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const bars = Array.from(root.querySelectorAll<HTMLSpanElement>(".player-fb-bar"));
    const peaks = new Array(bars.length).fill(0);
    const buf = new Uint8Array(analyser?.frequencyBinCount || 512);
    let raf = 0;
    let idleFrames = 0;

    function tick() {
      const p = playingRef.current;
      if (!p || !analyser) {
        // Decay briefly, then STOP — an unconditional loop kept mutating 48
        // spans at 60fps forever (paused, and on mobile where they're hidden).
        let alive = false;
        for (let i = 0; i < bars.length; i++) {
          peaks[i] = peaks[i] * 0.9;
          if (peaks[i] > 0.01) alive = true;
          bars[i].style.height = `${Math.max(2, peaks[i] * 100)}%`;
          bars[i].style.opacity = "0.18";
        }
        idleFrames++;
        if (alive && idleFrames < 90) {
          raf = requestAnimationFrame(tick);
        }
        return;
      }
      idleFrames = 0;
      analyser.getByteFrequencyData(buf as any);
      // Map bar index → 8 bands skewed lowward
      const BANDS = 8;
      const bands = new Array(BANDS).fill(0);
      for (let b = 0; b < BANDS; b++) {
        const idx = Math.floor(Math.pow((b + 0.5) / BANDS, 1.5) * (buf.length - 1));
        bands[b] = buf[idx] / 255;
      }
      for (let i = 0; i < bars.length; i++) {
        const f = i / (bars.length - 1);
        const bIdx = f * (BANDS - 1);
        const b0 = bands[Math.floor(bIdx)] || 0;
        const b1 = bands[Math.ceil(bIdx)] || 0;
        const frac = bIdx - Math.floor(bIdx);
        let v = b0 * (1 - frac) + b1 * frac;
        // bell taper at edges
        const edge = Math.sin(f * Math.PI);
        v *= 0.5 + 0.5 * edge;
        peaks[i] = Math.max(peaks[i] * 0.86, v);
        const h = Math.max(2, peaks[i] * 100);
        bars[i].style.height = `${h}%`;
        bars[i].style.opacity = (0.35 + peaks[i] * 0.65).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `playing` in deps restarts the loop after the pause-decay stopped it
  }, [analyser, playing]);

  // Visibility lives in the .player-fb CSS media query — a Tailwind `hidden`
  // here loses the cascade to the unlayered .player-fb display rule.
  return (
    <div ref={ref} className="player-fb">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`player-fb-bar${i % 7 === 3 || i % 11 === 5 ? " is-accent" : ""}`}
        />
      ))}
    </div>
  );
}

// ── Progress bar (Apple-style, click + drag + hover tooltip) ──────────

function ProgressBar({
  value,
  max,
  onSeek,
}: {
  value: number;
  max: number;
  onSeek: (ratio: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hoverMs, setHoverMs] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const compute = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    onSeek(compute(e.clientX));
    const move = (ev: PointerEvent) => onSeek(compute(ev.clientX));
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverMs(ratio * max);
  };

  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;

  return (
    <div className="player-pg">
      <span className="player-pg-time">{formatTime(value)}</span>
      <div
        ref={trackRef}
        className={`player-pg-track${dragging ? " is-drag" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHoverMs(null)}
      >
        <div className="player-pg-fill" style={{ width: `${pct}%` }} />
        <div className="player-pg-thumb" style={{ left: `${pct}%` }} />
        {hoverMs !== null && !dragging && max > 0 && (
          <div
            className="player-pg-hover"
            style={{ left: `${(hoverMs / max) * 100}%` }}
          >
            <span>{formatTime(hoverMs)}</span>
          </div>
        )}
      </div>
      <span className="player-pg-time player-pg-time-right">
        −{formatTime(Math.max(0, max - value))}
      </span>
    </div>
  );
}

// ── Copy prompt button (heart-style icon) ─────────────────────────────

function CopyPromptButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }, [text]);
  return (
    <button
      onClick={copy}
      aria-label={label}
      title={label}
      className={`player-ic${copied ? " is-on" : ""}`}
    >
      <Icon
        icon={copied ? "solar:check-circle-bold" : "solar:copy-linear"}
        className="h-[18px] w-[18px]"
      />
    </button>
  );
}
