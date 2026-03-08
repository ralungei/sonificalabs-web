"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { STYLE, type TimelineTrack } from "./types";
import { WaveformCanvas } from "./WaveformCanvas";

export function TrackLane({
  track,
  laneIdx,
  pxPerMs,
  sidebarW,
  actualDurationMs,
  dimmed,
  previewing,
  loaded,
  trackPeaks,
  onPreview,
  onDelete,
  onVolumePointerDown,
  onVolumeChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  track: TimelineTrack;
  laneIdx: number;
  pxPerMs: number;
  sidebarW: number;
  actualDurationMs: number;
  dimmed: boolean;
  previewing: boolean;
  loaded: boolean;
  trackPeaks: Float32Array | null;
  onPreview: (idx: number) => void;
  onDelete: (idx: number) => void;
  onVolumePointerDown: () => void;
  onVolumeChange: (idx: number, volume: number) => void;
  onPointerDown: (e: React.PointerEvent, idx: number, startMs: number, durationMs: number) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}) {
  const t = useTranslations("trackLane");
  const s = STYLE[track.type] || STYLE.voice;
  const isBg = track.type === "music" || track.type === "ambience";
  const visualDurationMs = isBg
    ? Math.min(track.duration_ms, Math.max(0, actualDurationMs - track.start_ms))
    : track.duration_ms;

  return (
    <div
      className={cn(
        "flex border-b border-white/[0.03] transition-opacity duration-200",
        dimmed ? "opacity-40" : "opacity-100",
        laneIdx % 2 === 1 && "bg-white/[0.008]",
      )}
    >
      {/* Sidebar */}
      <div
        className="sticky left-0 z-20 flex flex-col justify-center gap-1 px-2.5 py-2 bg-surface-1/95 backdrop-blur-sm border-r border-white/[0.04] shrink-0"
        style={{ width: sidebarW, minWidth: sidebarW }}
      >
        {/* Type + Label */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-[9px] font-mono font-bold uppercase tracking-wider shrink-0"
            style={{ color: s.accent }}
          >
            {s.label}
          </span>
          <span className="text-[11px] text-text-secondary truncate" title={track.label}>
            {track.label}
          </span>
        </div>

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={track.volume}
          title={`${Math.round(track.volume * 100)}%`}
          onPointerDown={onVolumePointerDown}
          onChange={(e) => onVolumeChange(track.index, parseFloat(e.target.value))}
          className="w-full h-4 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-surface-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current [&::-webkit-slider-thumb]:-mt-[3px]"
          style={{ color: s.accent }}
        />

        {/* Actions row */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPreview(track.index)}
            disabled={!loaded}
            className={cn(
              "h-5 w-5 rounded flex items-center justify-center transition-all",
              previewing
                ? "bg-accent/30 text-accent"
                : loaded
                  ? "bg-surface-3 text-text-muted hover:text-text-secondary"
                  : "bg-surface-2 text-text-muted/15 cursor-not-allowed",
            )}
          >
            {previewing ? (
              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="h-2 w-2 ml-px" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onDelete(track.index)}
            title={t("deleteTrack")}
            className="h-5 w-5 rounded flex items-center justify-center bg-surface-3 text-text-muted hover:text-fail transition-colors"
          >
            <svg
              className="h-2.5 w-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Waveform area */}
      <div
        className="relative flex-1 cursor-grab active:cursor-grabbing"
        style={{ minHeight: 64 }}
        onPointerDown={(e) => onPointerDown(e, track.index, track.start_ms, visualDurationMs)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          data-track={track.index}
          className="absolute top-1.5 bottom-1.5 rounded-xl overflow-hidden"
          style={{
            left: track.start_ms * pxPerMs,
            width: Math.max(visualDurationMs * pxPerMs, 20),
            backgroundColor: s.bg,
          }}
        >
          {loaded && trackPeaks ? (
            <WaveformCanvas
              peaks={trackPeaks}
              color="#ffffff"
              dimmed={dimmed}
              width={Math.max(visualDurationMs * pxPerMs, 20)}
              height={61}
            />
          ) : (
            <div className="absolute inset-0 flex items-center px-2">
              <div className="w-full h-5 rounded bg-white/[0.03] animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
