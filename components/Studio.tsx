"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";


import { type TimelineTrack, PREVIEW_GAIN, PEAK_RES } from "./studio/types";
import { TransportBar } from "./studio/TransportBar";
import { TimelineRuler } from "./studio/TimelineRuler";
import { TrackLane } from "./studio/TrackLane";
import { MasterDialog } from "./studio/MasterDialog";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";

export type { TimelineTrack };

// ═══════════════════════════════════════════════════════════════════
//  Utilities
// ═══════════════════════════════════════════════════════════════════

function computePeaks(buffer: AudioBuffer): Float32Array {
  const peaks = new Float32Array(PEAK_RES);
  const data = buffer.getChannelData(0);
  const step = Math.floor(data.length / PEAK_RES);
  for (let i = 0; i < PEAK_RES; i++) {
    let max = 0;
    const start = i * step;
    const end = Math.min(start + step, data.length);
    for (let j = start; j < end; j++) {
      const v = data[j] < 0 ? -data[j] : data[j];
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  return peaks;
}

function fmt(ms: number): string {
  const sec = Math.max(0, ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`;
}

// ═══════════════════════════════════════════════════════════════════
//  Studio
// ═══════════════════════════════════════════════════════════════════

interface StudioProps {
  tracks: TimelineTrack[];
  jobId: string;
  audioUrl: string;
  onRemixDone: (newAudioUrl: string) => void;
  canDownload?: boolean;
}

export function Studio({ tracks: initialTracks, jobId, audioUrl, onRemixDone, canDownload = true }: StudioProps) {
  const apiToken = useApiToken();
  // ─── State ──────────────────────────────────────────────
  const [tracks, setTracks] = useState(initialTracks);
  const [pxPerMs, setPxPerMs] = useState(0.1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const [soloSet, setSoloSet] = useState<Set<number>>(new Set());
  const [muteSet, setMuteSet] = useState<Set<number>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<TimelineTrack[][]>([]);
  const [sidebarW, setSidebarW] = useState(160);
  const [showMaster, setShowMaster] = useState(false);
  const [masterUrl, setMasterUrl] = useState<string | null>(null);

  // ─── Refs ───────────────────────────────────────────────
  const ctxRef = useRef<AudioContext | null>(null);
  const buffers = useRef(new Map<number, AudioBuffer>());
  const peaks = useRef(new Map<number, Float32Array>());
  const gains = useRef(new Map<number, GainNode>());
  const sources = useRef(new Map<number, AudioBufferSourceNode>());
  const previewSrc = useRef<AudioBufferSourceNode | null>(null);
  const previewIdxRef = useRef<number | null>(null);
  const playheadEl = useRef<HTMLDivElement>(null);
  const timeEl = useRef<HTMLSpanElement>(null);
  const scrollEl = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const playStart = useRef({ ctxTime: 0, fromMs: 0 });
  const playingRef = useRef(false);
  const tracksRef = useRef(tracks);
  const soloRef = useRef(soloSet);
  const muteRef = useRef(muteSet);
  const pxRef = useRef(pxPerMs);
  const dragRef = useRef<{
    idx: number;
    startMs: number;
    durationMs: number;
    cx: number;
    el: HTMLElement | null;
    snappedMs: number | null;
  } | null>(null);
  const initialRef = useRef(initialTracks);
  const sidebarWRef = useRef(sidebarW);
  const hoverLineEl = useRef<HTMLDivElement>(null);
  const guideLineEl = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  tracksRef.current = tracks;
  sidebarWRef.current = sidebarW;
  soloRef.current = soloSet;
  muteRef.current = muteSet;
  pxRef.current = pxPerMs;

  // ─── Derived values ─────────────────────────────────────
  const actualDurationMs = useMemo(() => {
    let maxMs = 0;
    for (const t of tracks) {
      maxMs = Math.max(maxMs, t.start_ms + t.duration_ms);
    }
    return maxMs;
  }, [tracks]);
  const totalDurationMs = actualDurationMs + 2000;
  const actualRef = useRef(actualDurationMs);
  actualRef.current = actualDurationMs;

  const timelineWidth = totalDurationMs * pxPerMs;
  const isLoaded = loadedSet.size === initialTracks.length;

  const rulerMarks = useMemo(() => {
    const marks: { ms: number; label: string }[] = [];
    let interval = 1000;
    if (pxPerMs < 0.005) interval = 60000;
    else if (pxPerMs < 0.01) interval = 30000;
    else if (pxPerMs < 0.02) interval = 15000;
    else if (pxPerMs < 0.05) interval = 5000;
    else if (pxPerMs < 0.08) interval = 2000;
    else if (pxPerMs > 0.2) interval = 500;
    for (let ms = 0; ms <= totalDurationMs; ms += interval) {
      const s = ms / 1000;
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      marks.push({
        ms,
        label: m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`,
      });
    }
    return marks;
  }, [totalDurationMs, pxPerMs]);

  // ─── Audio loading ──────────────────────────────────────
  const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

  useEffect(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    for (const track of initialTracks) {
      const isBg = track.type === "music" || track.type === "ambience";
      const fetchOpts: RequestInit = isBg
        ? { headers: { Range: `bytes=0-${MAX_AUDIO_BYTES - 1}` } }
        : {};

      fetch(track.audioUrl, fetchOpts)
        .then((r) => r.arrayBuffer())
        .then((ab) => ctx.decodeAudioData(ab))
        .then((buf) => {
          buffers.current.set(track.index, buf);
          peaks.current.set(track.index, computePeaks(buf));
          setLoadedSet((prev) => new Set(prev).add(track.index));
        })
        .catch((err) => {
          console.warn(`Track ${track.index} decode failed (partial?):`, err);
          const synth = new Float32Array(PEAK_RES);
          for (let j = 0; j < PEAK_RES; j++) synth[j] = 0.3 + Math.random() * 0.4;
          peaks.current.set(track.index, synth);
          setLoadedSet((prev) => new Set(prev).add(track.index));
        });
    }

    return () => {
      cancelAnimationFrame(raf.current);
      for (const s of sources.current.values()) {
        try {
          s.stop();
        } catch {}
      }
      if (previewSrc.current) {
        try {
          previewSrc.current.stop();
        } catch {}
      }
      ctx.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Playback core ──────────────────────────────────────
  const stopSources = useCallback(() => {
    for (const s of sources.current.values()) {
      try {
        s.stop();
      } catch {}
    }
    sources.current.clear();
    gains.current.clear();
  }, []);

  const stopPreview = useCallback(() => {
    if (previewSrc.current) {
      try {
        previewSrc.current.stop();
      } catch {}
      previewSrc.current = null;
      previewIdxRef.current = null;
      setPreviewIdx(null);
    }
  }, []);

  const pause = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const ctx = ctxRef.current;
    if (ctx && playingRef.current) {
      const elapsed = (ctx.currentTime - playStart.current.ctxTime) * 1000;
      playStart.current.fromMs = Math.min(
        playStart.current.fromMs + elapsed,
        actualRef.current,
      );
    }
    stopSources();
    stopPreview();
    playingRef.current = false;
    setIsPlaying(false);
    if (playheadEl.current)
      playheadEl.current.style.transform = `translateX(${playStart.current.fromMs * pxRef.current}px)`;
    if (timeEl.current) timeEl.current.textContent = fmt(playStart.current.fromMs);
  }, [stopSources, stopPreview]);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stopSources();
    stopPreview();
    playingRef.current = false;
    setIsPlaying(false);
    playStart.current.fromMs = 0;
    if (playheadEl.current) playheadEl.current.style.transform = "translateX(0px)";
    if (timeEl.current) timeEl.current.textContent = fmt(0);
  }, [stopSources, stopPreview]);

  const play = useCallback(
    (fromMs: number = 0) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      stopPreview();
      stopSources();
      cancelAnimationFrame(raf.current);

      if (ctx.state === "suspended") ctx.resume();

      const ctxTime = ctx.currentTime;
      playStart.current = { ctxTime, fromMs };
      const hasSolo = soloRef.current.size > 0;

      for (const track of tracksRef.current) {
        const buf = buffers.current.get(track.index);
        if (!buf) continue;

        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        src.buffer = buf;

        const muted = muteRef.current.has(track.index);
        const soloed = soloRef.current.has(track.index);
        const hear = !muted && (!hasSolo || soloed);
        const typeGain = PREVIEW_GAIN[track.type] ?? 1;
        gain.gain.value = hear ? track.volume * typeGain : 0;

        src.connect(gain).connect(ctx.destination);

        const offset = track.start_ms - fromMs;
        if (offset >= 0) {
          src.start(ctxTime + offset / 1000);
        } else {
          const skip = Math.min(-offset / 1000, buf.duration - 0.01);
          if (skip < buf.duration) src.start(ctxTime, skip);
        }

        sources.current.set(track.index, src);
        gains.current.set(track.index, gain);
      }

      playingRef.current = true;
      setIsPlaying(true);

      const tick = () => {
        const elapsed = (ctx.currentTime - ctxTime) * 1000;
        const cur = fromMs + elapsed;

        if (cur >= actualRef.current + 500) {
          stop();
          return;
        }

        if (playheadEl.current)
          playheadEl.current.style.transform = `translateX(${cur * pxRef.current}px)`;
        if (timeEl.current) timeEl.current.textContent = fmt(cur);

        const el = scrollEl.current;
        if (el) {
          const headPx = sidebarWRef.current + cur * pxRef.current;
          if (headPx > el.scrollLeft + el.clientWidth - 80) {
            el.scrollLeft = headPx - el.clientWidth * 0.3;
          }
        }

        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [stopSources, stopPreview, stop],
  );

  const togglePlay = useCallback(() => {
    playingRef.current ? pause() : play(playStart.current.fromMs);
  }, [play, pause]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(ms, actualRef.current));
      if (playingRef.current) {
        play(clamped);
      } else {
        if (playheadEl.current)
          playheadEl.current.style.transform = `translateX(${clamped * pxRef.current}px)`;
        if (timeEl.current) timeEl.current.textContent = fmt(clamped);
        playStart.current.fromMs = clamped;
      }
    },
    [play],
  );

  // ─── Gain updates ───────────────────────────────────────
  const syncGains = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const hasSolo = soloRef.current.size > 0;
    for (const [idx, gain] of gains.current) {
      const t = tracksRef.current.find((t) => t.index === idx);
      if (!t) continue;
      const hear = !muteRef.current.has(idx) && (!hasSolo || soloRef.current.has(idx));
      const typeGain = PREVIEW_GAIN[t.type] ?? 1;
      gain.gain.setTargetAtTime(hear ? t.volume * typeGain : 0, ctx.currentTime, 0.015);
    }
  }, []);

  const toggleSolo = useCallback(
    (idx: number) => {
      setSoloSet((prev) => {
        const next = new Set(prev);
        next.has(idx) ? next.delete(idx) : next.add(idx);
        soloRef.current = next;
        syncGains();
        return next;
      });
    },
    [syncGains],
  );

  const toggleMute = useCallback(
    (idx: number) => {
      setMuteSet((prev) => {
        const next = new Set(prev);
        next.has(idx) ? next.delete(idx) : next.add(idx);
        muteRef.current = next;
        syncGains();
        return next;
      });
    },
    [syncGains],
  );

  // ─── Track preview ─────────────────────────────────────
  const previewTrack = useCallback(
    (idx: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      if (playingRef.current) stop();
      stopPreview();

      if (previewIdxRef.current === idx) return;

      if (ctx.state === "suspended") ctx.resume();
      const buf = buffers.current.get(idx);
      const t = tracksRef.current.find((t) => t.index === idx);
      if (!buf || !t) return;

      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.value = t.volume * (PREVIEW_GAIN[t.type] ?? 1);
      src.connect(gain).connect(ctx.destination);
      src.start();

      previewSrc.current = src;
      previewIdxRef.current = idx;
      setPreviewIdx(idx);

      src.onended = () => {
        previewSrc.current = null;
        previewIdxRef.current = null;
        setPreviewIdx(null);
      };
    },
    [stop, stopPreview],
  );

  // ─── History (undo / reset) ─────────────────────────────
  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-19), tracksRef.current]);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setTracks(h[h.length - 1]);
      if (h.length <= 1) setIsDirty(false);
      return h.slice(0, -1);
    });
  }, []);

  const resetTracks = useCallback(() => {
    pushHistory();
    setTracks(initialRef.current);
    setIsDirty(false);
  }, [pushHistory]);

  // ─── Track updates + drag ──────────────────────────────
  const updateTrack = useCallback((idx: number, upd: Partial<TimelineTrack>) => {
    setTracks((prev) => prev.map((t) => (t.index === idx ? { ...t, ...upd } : t)));
    setIsDirty(true);
    if (upd.volume != null) {
      const g = gains.current.get(idx);
      const ctx = ctxRef.current;
      if (g && ctx) {
        const hasSolo = soloRef.current.size > 0;
        const hear = !muteRef.current.has(idx) && (!hasSolo || soloRef.current.has(idx));
        const t = tracksRef.current.find((t) => t.index === idx);
        const typeGain = PREVIEW_GAIN[t?.type ?? "voice"] ?? 1;
        g.gain.setTargetAtTime(hear ? upd.volume * typeGain : 0, ctx.currentTime, 0.015);
      }
    }
  }, []);

  const deleteTrack = useCallback(
    (idx: number) => {
      pushHistory();
      setTracks((prev) => prev.filter((t) => t.index !== idx));
      setIsDirty(true);
    },
    [pushHistory],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, idx: number, startMs: number, durationMs: number) => {
      pushHistory();
      e.currentTarget.setPointerCapture(e.pointerId);
      const el = (e.currentTarget as HTMLElement).querySelector(
        `[data-track="${idx}"]`,
      ) as HTMLElement | null;
      dragRef.current = { idx, startMs, durationMs, cx: e.clientX, el, snappedMs: null };
    },
    [pushHistory],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d?.el) return;

    const deltaMs = (e.clientX - d.cx) / pxRef.current;
    let newStart = Math.max(0, d.startMs + deltaMs);
    const newEnd = newStart + d.durationMs;
    const SNAP_MS = 10 / pxRef.current;
    let snapAt = -1;

    for (const t of tracksRef.current) {
      if (t.index === d.idx) continue;
      for (const edge of [t.start_ms, t.start_ms + t.duration_ms]) {
        if (Math.abs(newStart - edge) < SNAP_MS) {
          newStart = edge;
          snapAt = edge;
          break;
        }
        if (Math.abs(newEnd - edge) < SNAP_MS) {
          newStart = edge - d.durationMs;
          snapAt = edge;
          break;
        }
      }
      if (snapAt >= 0) break;
    }
    if (snapAt < 0 && Math.abs(newStart) < SNAP_MS) {
      newStart = 0;
      snapAt = 0;
    }

    d.snappedMs = newStart;
    d.el.style.transform = `translateX(${(newStart - d.startMs) * pxRef.current}px)`;

    if (guideLineEl.current) {
      if (snapAt >= 0) {
        guideLineEl.current.style.transform = `translateX(${snapAt * pxRef.current}px)`;
        guideLineEl.current.style.opacity = "1";
      } else {
        guideLineEl.current.style.opacity = "0";
      }
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.el) d.el.style.transform = "";
      const finalMs =
        d.snappedMs != null
          ? Math.max(0, Math.round(d.snappedMs))
          : Math.max(0, Math.round(d.startMs + (e.clientX - d.cx) / pxRef.current));
      updateTrack(d.idx, { start_ms: finalMs });
      dragRef.current = null;
      if (guideLineEl.current) guideLineEl.current.style.opacity = "0";
    },
    [updateTrack],
  );

  // ─── Hover indicator ──────────────────────────────────
  const onTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!hoverLineEl.current || !scrollEl.current) return;
    const rect = scrollEl.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollEl.current.scrollLeft - sidebarWRef.current;
    if (x >= 0) {
      hoverLineEl.current.style.transform = `translateX(${x}px)`;
      hoverLineEl.current.style.opacity = "1";
    } else {
      hoverLineEl.current.style.opacity = "0";
    }
  }, []);

  const onTimelineMouseLeave = useCallback(() => {
    if (hoverLineEl.current) hoverLineEl.current.style.opacity = "0";
  }, []);

  // ─── Zoom ──────────────────────────────────────────────
  const zoomIn = useCallback(() => setPxPerMs((p) => Math.min(p * 2, 1.0)), []);
  const zoomOut = useCallback(() => setPxPerMs((p) => Math.max(p / 2, 0.0005)), []);
  const zoomFit = useCallback(() => {
    const el = scrollEl.current;
    if (!el) return;
    const available = el.clientWidth - sidebarWRef.current;
    if (available > 0 && totalDurationMs > 0) {
      setPxPerMs(available / totalDurationMs);
      el.scrollLeft = 0;
    }
  }, [totalDurationMs]);

  // ─── Masterize ──────────────────────────────────────────
  const audioUrlRef = useRef(audioUrl);
  audioUrlRef.current = audioUrl;

  const handleMasterize = useCallback(async () => {
    if (playingRef.current) pause();
    setIsRemixing(true);
    try {
      let url = audioUrlRef.current;
      if (isDirty) {
        const res = await apiFetch(`/remix/${jobId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracks: tracksRef.current.map((t) => ({
              index: t.index,
              start_ms: t.start_ms,
              volume: t.volume,
            })),
          }),
        }, apiToken);
        if (!res.ok) throw new Error("Remix failed");
        const data = await res.json();
        onRemixDone(data.audioUrl);
        url = data.audioUrl;
        setIsDirty(false);
      }
      setMasterUrl(url);
      setShowMaster(true);
    } catch (err) {
      console.error("Masterize error:", err);
    } finally {
      setIsRemixing(false);
    }
  }, [jobId, isDirty, onRemixDone, pause, apiToken]);

  // ─── Keyboard ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay]);

  // ─── Responsive sidebar width ──────────────────────────
  useEffect(() => {
    const update = () => setSidebarW(window.innerWidth < 640 ? 120 : 160);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ─── Auto-fit on load ─────────────────────────────────
  useEffect(() => {
    if (isLoaded) zoomFit();
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Render ─────────────────────────────────────────────
  return (
    <div
      className="w-full mx-auto transition-opacity duration-300"
      style={{ opacity: isLoaded ? 1 : 0 }}
    >
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1/70 backdrop-blur-xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Transport */}
        <TransportBar
          isPlaying={isPlaying}
          isLoaded={isLoaded}
          isRemixing={isRemixing}
          isDirty={isDirty}
          historyLength={history.length}
          actualDurationMs={actualDurationMs}
          timeRef={timeEl}
          onTogglePlay={togglePlay}
          onStop={stop}
          onUndo={undo}
          onReset={resetTracks}
          onMasterize={handleMasterize}
        />

        {/* Timeline */}
        <div
          className="relative overflow-x-auto overflow-y-hidden"
          ref={scrollEl}
          onMouseMove={onTimelineMouseMove}
          onMouseLeave={onTimelineMouseLeave}
        >
          <div
            style={{ width: Math.max(timelineWidth + sidebarW, 600), minWidth: "100%" }}
            className="relative"
          >
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: sidebarW, zIndex: 15 }}
            >
              <div ref={playheadEl} className="absolute top-0 bottom-0" style={{ left: 0 }}>
                <div
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent"
                  style={{ boxShadow: "0 0 8px rgba(232,168,56,0.5)" }}
                />
                <div
                  className="absolute top-0 bottom-0 left-1/2 w-[1.5px] -translate-x-[0.75px]"
                  style={{
                    background: "rgba(232,168,56,0.8)",
                    boxShadow: isPlaying ? "0 0 8px rgba(232,168,56,0.3)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Hover indicator */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: sidebarW, zIndex: 13 }}
            >
              <div
                ref={hoverLineEl}
                className="absolute top-0 bottom-0 opacity-0 transition-opacity duration-75"
              >
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/30" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-[0.5px] bg-white/20" />
              </div>
            </div>

            {/* Snap guide line */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: sidebarW, zIndex: 14 }}
            >
              <div ref={guideLineEl} className="absolute top-0 bottom-0 opacity-0">
                <div
                  className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-[0.5px] bg-accent/50"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, rgba(232,168,56,0.5) 0px, rgba(232,168,56,0.5) 4px, transparent 4px, transparent 8px)",
                  }}
                />
              </div>
            </div>

            {/* Ruler */}
            <TimelineRuler
              rulerMarks={rulerMarks}
              pxPerMs={pxPerMs}
              sidebarW={sidebarW}
              onSeek={seek}
            />

            {/* Track Lanes */}
            {tracks.map((track, laneIdx) => {
              const muted = muteSet.has(track.index);
              const soloed = soloSet.has(track.index);
              const hasSolo = soloSet.size > 0;
              const dimmed = muted || (hasSolo && !soloed);

              return (
                <TrackLane
                  key={track.index}
                  track={track}
                  laneIdx={laneIdx}
                  pxPerMs={pxPerMs}
                  sidebarW={sidebarW}
                  actualDurationMs={actualDurationMs}
                  dimmed={dimmed}
                  previewing={previewIdx === track.index}
                  loaded={loadedSet.has(track.index)}
                  trackPeaks={peaks.current.get(track.index) ?? null}
                  onPreview={previewTrack}
                  onDelete={deleteTrack}
                  onVolumePointerDown={pushHistory}
                  onVolumeChange={(idx, vol) => updateTrack(idx, { volume: vol })}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-0/40 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-body uppercase tracking-wider text-white/50">
              Zoom
            </span>
            <button
              onClick={zoomOut}
              className="h-6 w-6 rounded-md border border-white/[0.06] bg-surface-2 text-text-secondary hover:text-text-primary text-xs flex items-center justify-center transition-colors"
            >
              −
            </button>
            <button
              onClick={zoomIn}
              className="h-6 w-6 rounded-md border border-white/[0.06] bg-surface-2 text-text-secondary hover:text-text-primary text-xs flex items-center justify-center transition-colors"
            >
              +
            </button>
            <button
              onClick={zoomFit}
              title="Ajustar al ancho"
              className="h-6 w-6 rounded-md border border-white/[0.06] bg-surface-2 text-text-secondary hover:text-text-primary text-xs flex items-center justify-center transition-colors"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
                />
              </svg>
            </button>
          </div>
          <span className="text-xs font-body text-white/60 select-none hidden sm:block">
            Espacio para reproducir · Arrastra para mover pistas
          </span>
        </div>
      </div>

      {/* Pre-master note */}
      <p className="mt-3 text-xs font-body text-white/50 text-center leading-relaxed">
        Vista previa sin masterizar. Los volúmenes y la mezcla final pueden sonar diferente al audio masterizado.
      </p>

      {/* Master dialog */}
      <MasterDialog
        show={showMaster}
        masterUrl={masterUrl}
        jobId={jobId}
        onClose={() => setShowMaster(false)}
        canDownload={canDownload}
      />
    </div>
  );
}
