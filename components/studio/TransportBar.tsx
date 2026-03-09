"use client";
import { cn } from "@/lib/cn";

function fmt(ms: number): string {
  const sec = Math.max(0, ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`;
}

export function TransportBar({
  isPlaying,
  isLoaded,
  isRemixing,
  isDirty,
  historyLength,
  actualDurationMs,
  timeRef,
  onTogglePlay,
  onStop,
  onUndo,
  onReset,
  onMasterize,
}: {
  isPlaying: boolean;
  isLoaded: boolean;
  isRemixing: boolean;
  isDirty: boolean;
  historyLength: number;
  actualDurationMs: number;
  timeRef: React.RefObject<HTMLSpanElement | null>;
  onTogglePlay: () => void;
  onStop: () => void;
  onUndo: () => void;
  onReset: () => void;
  onMasterize: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-0/50 border-b border-white/[0.04]">
      {/* Play */}
      <button
        onClick={onTogglePlay}
        disabled={!isLoaded}
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0",
          isLoaded
            ? "bg-accent text-surface-0 hover:shadow-[0_0_20px_rgba(232,168,56,0.25)] active:scale-95"
            : "bg-surface-3 text-text-muted cursor-not-allowed",
        )}
      >
        {isPlaying ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        onClick={onStop}
        disabled={!isPlaying}
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
          isPlaying
            ? "bg-surface-3 text-text-secondary hover:text-text-primary"
            : "bg-surface-2 text-text-muted/20",
        )}
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </button>

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={historyLength === 0}
        title="Deshacer"
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
          historyLength > 0
            ? "bg-surface-3 text-text-secondary hover:text-text-primary"
            : "bg-surface-2 text-text-muted/20",
        )}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
          />
        </svg>
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        disabled={!isDirty}
        title="Restablecer"
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
          isDirty
            ? "bg-surface-3 text-text-secondary hover:text-text-primary"
            : "bg-surface-2 text-text-muted/20",
        )}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* Time */}
      <div className="flex items-baseline gap-1 font-mono text-sm tabular-nums tracking-wide min-w-[110px]">
        <span ref={timeRef} className="text-text-primary">
          0:00.0
        </span>
        <span className="text-white/40">/</span>
        <span className="text-white/50">{fmt(actualDurationMs)}</span>
      </div>

      <div className="flex-1" />

      {/* Loading */}
      {!isLoaded && (
        <span className="text-xs font-body text-white/50 animate-pulse shrink-0">
          Cargando pistas...
        </span>
      )}

      {/* Masterize */}
      <button
        onClick={onMasterize}
        disabled={isRemixing || !isLoaded}
        className={cn(
          "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-body font-semibold uppercase tracking-wider transition-all duration-200 shrink-0",
          isRemixing || !isLoaded
            ? "bg-surface-2 text-white/20 border border-transparent cursor-not-allowed"
            : "bg-accent/15 text-accent border border-accent/20 hover:bg-accent/25",
        )}
      >
        {isRemixing ? (
          <>
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Masterizando...
          </>
        ) : (
          "Masterizar"
        )}
      </button>
    </div>
  );
}
