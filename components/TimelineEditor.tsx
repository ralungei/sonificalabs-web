"use client";
import { useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";

// ─── Types ──────────────────────────────────────────────────────────
export interface TimelineTrack {
  index: number;
  type: "voice" | "music" | "sfx" | "ambience" | "stinger";
  label: string;
  start_ms: number;
  duration_ms: number;
  volume: number;
  effects: Record<string, unknown>;
  audioFile: string;
  audioUrl: string;
}

interface Props {
  tracks: TimelineTrack[];
  jobId: string;
  onRemixDone: (newAudioUrl: string) => void;
}

// ─── Color scheme by type ───────────────────────────────────────────
const TRACK_COLORS: Record<string, { bg: string; border: string; text: string; wave: string }> = {
  voice:    { bg: "bg-amber-500/15",  border: "border-amber-500/30",  text: "text-amber-400",  wave: "#f59e0b" },
  music:    { bg: "bg-blue-500/15",   border: "border-blue-500/30",   text: "text-blue-400",   wave: "#3b82f6" },
  sfx:      { bg: "bg-rose-500/15",   border: "border-rose-500/30",   text: "text-rose-400",   wave: "#f43f5e" },
  ambience: { bg: "bg-emerald-500/15",border: "border-emerald-500/30",text: "text-emerald-400", wave: "#10b981" },
  stinger:  { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400",  wave: "#a855f7" },
};

const TYPE_ICONS: Record<string, string> = {
  voice: "V",
  music: "M",
  sfx: "F",
  ambience: "A",
  stinger: "S",
};

const TYPE_LABELS: Record<string, string> = {
  voice: "VOZ",
  music: "MUSICA",
  sfx: "SFX",
  ambience: "AMBIENTE",
  stinger: "STINGER",
};

// ─── Main Component ─────────────────────────────────────────────────
export function TimelineEditor({ tracks: initialTracks, jobId, onRemixDone }: Props) {
  const apiToken = useApiToken();
  const [tracks, setTracks] = useState<TimelineTrack[]>(initialTracks);
  const [pxPerMs, setPxPerMs] = useState(0.1); // 100px per second
  const [isRemixing, setIsRemixing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ index: number; startMs: number; clientX: number; element: HTMLElement | null } | null>(null);

  // Compute total duration
  const totalDurationMs = useMemo(() => {
    let max = 0;
    for (const t of tracks) {
      max = Math.max(max, t.start_ms + t.duration_ms);
    }
    return max + 2000; // 2s padding
  }, [tracks]);

  const timelineWidth = totalDurationMs * pxPerMs;

  // ─── Zoom ───────────────────────────────────────────────────────
  const zoomIn = useCallback(() => setPxPerMs(p => Math.min(p * 1.3, 0.5)), []);
  const zoomOut = useCallback(() => setPxPerMs(p => Math.max(p / 1.3, 0.02)), []);

  // ─── Track updates ─────────────────────────────────────────────
  const updateTrack = useCallback((index: number, update: Partial<TimelineTrack>) => {
    setTracks(prev => prev.map(t => t.index === index ? { ...t, ...update } : t));
    setIsDirty(true);
  }, []);

  // ─── Drag handling — DOM transform during drag, commit on pointerup ──
  const handlePointerDown = useCallback((e: React.PointerEvent, trackIndex: number, startMs: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const trackBlock = (e.currentTarget as HTMLElement).querySelector(`[data-track="${trackIndex}"]`) as HTMLElement | null;
    dragStartRef.current = { index: trackIndex, startMs, clientX: e.clientX, element: trackBlock };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragStartRef.current;
    if (!d) return;
    const deltaPx = e.clientX - d.clientX;
    // Apply visual transform without React re-render
    if (d.element) {
      d.element.style.transform = `translateX(${deltaPx}px)`;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragStartRef.current;
    if (!d) return;
    const deltaPx = e.clientX - d.clientX;
    const deltaMs = deltaPx / pxPerMs;
    const newStartMs = Math.max(0, Math.round(d.startMs + deltaMs));
    // Reset transform and commit to state
    if (d.element) {
      d.element.style.transform = "";
    }
    updateTrack(d.index, { start_ms: newStartMs });
    dragStartRef.current = null;
  }, [pxPerMs, updateTrack]);

  // ─── Remix ─────────────────────────────────────────────────────
  const handleRemix = useCallback(async () => {
    setIsRemixing(true);
    try {
      const res = await apiFetch(`/remix/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks: tracks.map(t => ({
            index: t.index,
            start_ms: t.start_ms,
            volume: t.volume,
          })),
        }),
      }, apiToken);
      if (!res.ok) throw new Error("Remix failed");
      const data = await res.json();
      onRemixDone(data.audioUrl);
      setIsDirty(false);
    } catch (err) {
      console.error("Remix error:", err);
    } finally {
      setIsRemixing(false);
    }
  }, [jobId, tracks, onRemixDone]);

  // ─── Time ruler marks ─────────────────────────────────────────
  const rulerMarks = useMemo(() => {
    const marks: { ms: number; label: string }[] = [];
    // Choose interval based on zoom
    let interval = 1000;
    if (pxPerMs < 0.05) interval = 5000;
    else if (pxPerMs < 0.08) interval = 2000;
    else if (pxPerMs > 0.2) interval = 500;

    for (let ms = 0; ms <= totalDurationMs; ms += interval) {
      const s = ms / 1000;
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      marks.push({ ms, label: m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s` });
    }
    return marks;
  }, [totalDurationMs, pxPerMs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto mt-8"
    >
      <div className="rounded-2xl border border-border-subtle bg-surface-1/60 backdrop-blur-md overflow-hidden">
        {/* ── Transport Bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-surface-0/40">
          <div className="flex items-center gap-3">
            {/* Play/Remix button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRemix}
              disabled={isRemixing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-300",
                isRemixing
                  ? "bg-accent/20 text-accent/60 cursor-wait"
                  : "bg-accent text-surface-0 hover:shadow-[0_0_20px_rgba(232,168,56,0.2)]",
              )}
            >
              {isRemixing ? (
                <>
                  <Spinner />
                  Mezclando...
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Mezclar
                </>
              )}
            </motion.button>

            {isDirty && !isRemixing && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] font-mono uppercase tracking-wider text-accent/60"
              >
                cambios sin mezclar
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted mr-1">Zoom</span>
            <button
              onClick={zoomOut}
              className="h-7 w-7 rounded-md border border-border-subtle bg-surface-2 text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors text-sm flex items-center justify-center"
            >
              -
            </button>
            <button
              onClick={zoomIn}
              className="h-7 w-7 rounded-md border border-border-subtle bg-surface-2 text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors text-sm flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* ── Timeline Area ─────────────────────────────────── */}
        <div className="overflow-x-auto" ref={timelineRef}>
          <div style={{ width: Math.max(timelineWidth, 600), minWidth: "100%" }}>
            {/* Time Ruler */}
            <div className="relative h-7 border-b border-border-subtle bg-surface-0/30">
              {rulerMarks.map(m => (
                <div
                  key={m.ms}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: m.ms * pxPerMs }}
                >
                  <div className="w-px h-2.5 bg-text-muted/30" />
                  <span className="text-[9px] font-mono text-text-muted/50 mt-0.5 select-none">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Track Lanes */}
            <div className="divide-y divide-border-subtle">
              {tracks.map(track => {
                const colors = TRACK_COLORS[track.type] || TRACK_COLORS.voice;
                return (
                  <div key={track.index} className="relative">
                    {/* Lane */}
                    <div className="flex items-stretch" style={{ minHeight: 72 }}>
                      {/* Track info sidebar */}
                      <div className="sticky left-0 z-20 w-36 shrink-0 flex flex-col justify-center gap-1.5 px-3 py-2 bg-surface-1/90 backdrop-blur-sm border-r border-border-subtle">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-mono font-bold",
                            colors.bg, colors.text,
                          )}>
                            {TYPE_ICONS[track.type]}
                          </span>
                          <span className={cn("text-[10px] font-mono uppercase tracking-wider", colors.text)}>
                            {TYPE_LABELS[track.type]}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-secondary truncate" title={track.label}>
                          {track.label}
                        </span>
                        {/* Volume slider */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <svg className="h-3 w-3 text-text-muted shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                          </svg>
                          <input
                            type="range"
                            min={0}
                            max={1.5}
                            step={0.01}
                            value={track.volume}
                            onChange={e => updateTrack(track.index, { volume: parseFloat(e.target.value) })}
                            className="w-full h-1 accent-current appearance-none rounded-full bg-surface-3 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current"
                            style={{ color: colors.wave }}
                          />
                          <span className="text-[9px] font-mono text-text-muted w-7 text-right tabular-nums">
                            {Math.round(track.volume * 100)}
                          </span>
                        </div>
                      </div>

                      {/* Waveform area */}
                      <div
                        className="relative flex-1 py-2 cursor-grab active:cursor-grabbing"
                        onPointerDown={e => handlePointerDown(e, track.index, track.start_ms)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                      >
                        {/* Track block */}
                        <motion.div
                          data-track={track.index}
                          className={cn(
                            "absolute top-2 bottom-2 rounded-lg border overflow-hidden transition-shadow",
                            colors.bg, colors.border,
                            "hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]",
                          )}
                          style={{
                            left: track.start_ms * pxPerMs,
                            width: Math.max(track.duration_ms * pxPerMs, 20),
                          }}
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        >
                          {/* Fake waveform visualization */}
                          <WaveformBars color={colors.wave} width={track.duration_ms * pxPerMs} />

                          {/* Label overlay */}
                          <div className="absolute inset-0 flex items-end px-2 pb-1.5 pointer-events-none">
                            <span className={cn("text-[9px] font-mono uppercase tracking-wider opacity-60", colors.text)}>
                              {formatMs(track.start_ms)}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const MAX_BARS = 200;
const FIXED_BAR_HEIGHTS = Array.from({ length: MAX_BARS }, (_, i) => {
  const v = 0.2 + 0.8 * Math.abs(Math.sin(i * 0.3) * Math.cos(i * 0.17) + Math.sin(i * 0.07) * 0.5);
  return Math.min(1, v);
});

function WaveformBars({ color, width }: { color: string; width: number }) {
  const barCount = Math.max(4, Math.min(Math.floor(width / 4), MAX_BARS));

  return (
    <div className="absolute inset-0 flex items-center gap-px px-1 opacity-60">
      {FIXED_BAR_HEIGHTS.slice(0, barCount).map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h * 70}%`,
            backgroundColor: color,
            minWidth: 1,
            maxWidth: 3,
          }}
        />
      ))}
    </div>
  );
}

function formatMs(ms: number): string {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return m > 0 ? `${m}:${parseFloat(sec).toFixed(1).padStart(4, "0")}` : `${sec}s`;
}
