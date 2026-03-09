"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/* ── Animated concentric rings ── */
function GlowRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-accent/25"
          initial={{ width: 52, height: 52, opacity: 0.5 }}
          animate={{
            width: [52, 110],
            height: [52, 110],
            opacity: [0.4, 0],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            delay: i * 0.9,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Waveform-style progress (fake but pretty) ── */
function WaveProgress({
  progress,
  onClick,
}: {
  progress: number;
  onClick: (ratio: number) => void;
}) {
  const bars = 48;
  const waveRef = useRef<HTMLDivElement>(null);
  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const x = i / bars;
        const base = 0.3 + 0.7 * Math.abs(Math.sin(x * Math.PI * 3.2 + 0.5));
        const detail = 0.15 * Math.sin(x * Math.PI * 11) + 0.1 * Math.cos(x * Math.PI * 7);
        return Math.max(0.15, Math.min(1, base + detail));
      }),
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = waveRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      onClick(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
    },
    [onClick],
  );

  return (
    <div
      ref={waveRef}
      onClick={handleClick}
      className="flex items-center gap-[2px] h-10 cursor-pointer group px-1"
    >
      {heights.map((h, i) => {
        const played = i / bars < progress;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors duration-150",
              played
                ? "bg-accent group-hover:bg-accent-bright"
                : "bg-white/[0.1] group-hover:bg-white/[0.15]",
            )}
            style={{ height: `${h * 100}%` }}
          />
        );
      })}
    </div>
  );
}

/* ── Master audio player ── */
function MasterPlayer({
  url,
  playing,
  onToggle,
  audioRef,
}: {
  url: string;
  playing: boolean;
  onToggle: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (!el.duration) return;
      setProgress(el.currentTime / el.duration);
      setCurrentTime(fmt(el.currentTime));
    };
    const onMeta = () => {
      if (el.duration && isFinite(el.duration)) setDuration(fmt(el.duration));
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    if (el.duration && isFinite(el.duration)) {
      setDuration(fmt(el.duration));
      setProgress(el.currentTime / el.duration);
      setCurrentTime(fmt(el.currentTime));
    }
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
    };
  }, [url, playing, audioRef]);

  const seek = useCallback(
    (ratio: number) => {
      const el = audioRef.current;
      if (!el || !el.duration) return;
      el.currentTime = ratio * el.duration;
    },
    [audioRef],
  );

  return (
    <div className="w-full rounded-2xl bg-surface-0/80 border border-white/[0.06] p-4">
      <div className="flex items-start gap-3">
        {/* Play button — aligned to waveform center (h-10 wave → offset by ~0px) */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-[2px] h-11 w-11 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200",
            playing
              ? "bg-accent text-surface-0 shadow-[0_0_24px_rgba(232,168,56,0.3)]"
              : "bg-accent text-surface-0 hover:shadow-[0_0_24px_rgba(232,168,56,0.25)] active:scale-95",
          )}
        >
          <Icon
            icon={playing ? "solar:pause-bold" : "solar:play-bold"}
            className={cn("h-4 w-4", !playing && "ml-0.5")}
          />
        </button>

        {/* Waveform + time */}
        <div className="flex-1 flex flex-col gap-1">
          <WaveProgress progress={progress} onClick={seek} />
          <div className="flex justify-between px-1">
            <span className="text-[10px] font-mono text-text-secondary tabular-nums">{currentTime}</span>
            <span className="text-[10px] font-mono text-text-muted tabular-nums">{duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Share field with copy ── */
function ShareField({ jobId }: { jobId: string }) {
  const t = useTranslations("masterDialog");
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${jobId}` : "";

  const copy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [url]);

  return (
    <div className="w-full space-y-2">
      <label className="text-[11px] font-body uppercase tracking-wider text-text-muted flex items-center gap-1.5">
        <Icon icon="solar:link-bold" className="h-3 w-3" />
        {t("shareLink")}
      </label>
      <div className="flex items-center rounded-xl border border-white/[0.08] bg-surface-0/60 overflow-hidden">
        <div className="flex-1 px-3.5 py-2.5 text-xs font-body text-text-secondary truncate select-all min-w-0">
          {url || `…/p/${jobId}`}
        </div>
        <button
          onClick={copy}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-body uppercase tracking-wider border-l border-white/[0.08] transition-all duration-300 shrink-0",
            copied
              ? "bg-done/15 text-done"
              : "bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3",
          )}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <Icon icon="solar:check-circle-bold" className="h-3.5 w-3.5" />
                {t("copied")}
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <Icon icon="solar:copy-bold" className="h-3.5 w-3.5" />
                {t("copy")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

/* ── Inner panel (shared between modal and inline) ── */
function MasterPanel({
  masterUrl,
  jobId,
  canDownload,
  onClose,
  inline,
  prompt,
  onOpenEditor,
}: {
  masterUrl: string;
  jobId: string;
  canDownload: boolean;
  onClose: () => void;
  inline: boolean;
  prompt?: string;
  onOpenEditor?: () => void;
}) {
  const t = useTranslations("masterDialog");
  const masterRef = useRef<HTMLAudioElement | null>(null);
  const [masterPlaying, setMasterPlaying] = useState(false);

  const toggleMasterPlay = useCallback(() => {
    if (masterPlaying && masterRef.current) {
      masterRef.current.pause();
      setMasterPlaying(false);
      return;
    }
    if (!masterRef.current) {
      masterRef.current = new Audio();
      masterRef.current.onended = () => setMasterPlaying(false);
    }
    masterRef.current.src = masterUrl;
    masterRef.current.play();
    setMasterPlaying(true);
  }, [masterUrl, masterPlaying]);

  const downloadMaster = useCallback(async () => {
    try {
      const res = await fetch(masterUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sonificalabs-${jobId}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(masterUrl, "_blank");
    }
  }, [masterUrl, jobId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      masterRef.current?.pause();
    };
  }, []);

  const content = (
    <>
      {/* Ambient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-52 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

      {/* Close (only in modal mode) */}
      {!inline && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-7 w-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all"
        >
          <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
        </button>
      )}

      {/* Hero badge */}
      <div className="relative flex flex-col items-center gap-3 pt-1">
        <div className="relative">
          <GlowRing />
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
            className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center shadow-[0_8px_32px_rgba(232,168,56,0.3)]"
          >
            <Icon icon="solar:music-note-slider-bold" className="h-8 w-8 text-surface-0" />
          </motion.div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-body font-semibold text-text-primary"
          >
            {inline ? t("audioReady") : t("masterReady")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[11px] text-text-muted font-body flex items-center gap-1.5"
          >
            <Icon icon="solar:tuning-2-linear" className="h-3 w-3" />
            {t("normalizedLufs")}
          </motion.p>
        </div>
      </div>

      {/* Player */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="w-full"
      >
        <MasterPlayer
          url={masterUrl}
          playing={masterPlaying}
          onToggle={toggleMasterPlay}
          audioRef={masterRef}
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full flex flex-col gap-3"
      >
        {canDownload ? (
          <>
            <button
              onClick={downloadMaster}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-accent text-surface-0 font-body text-xs uppercase tracking-wider font-semibold transition-all hover:bg-accent-bright hover:shadow-[0_8px_32px_rgba(232,168,56,0.25)] active:scale-[0.98]"
            >
              <Icon icon="solar:download-minimalistic-bold" className="h-4.5 w-4.5" />
              {t("downloadMp3")}
            </button>
            <ShareField jobId={jobId} />
          </>
        ) : (
          <>
            <ShareField jobId={jobId} />
            <Link
              href="/pricing"
              className="group w-full flex items-center justify-between px-4 py-3 rounded-xl border border-accent/15 bg-accent/[0.04] hover:bg-accent/[0.08] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Icon icon="solar:download-minimalistic-bold" className="h-4 w-4 text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-body font-medium text-text-primary">{t("downloadInMp3")}</span>
                  <span className="text-[10px] text-text-muted">{t("availableInPro")}</span>
                </div>
              </div>
              <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
            </Link>
          </>
        )}
      </motion.div>
    </>
  );

  // Inline: wide card — title top, player middle, share+download row bottom
  if (inline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center gap-5 bg-gradient-to-b from-surface-1 to-surface-0 border border-white/[0.08] rounded-3xl px-8 py-7 overflow-hidden w-full max-w-2xl mx-auto shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)]"
      >
        {/* Ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-52 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-body font-semibold text-text-primary"
          >
            {t("audioReady")}
          </motion.h2>
          {prompt && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-text-muted text-center line-clamp-2"
            >
              &ldquo;{prompt.replace(/\[.*?\]/g, "").trim()}&rdquo;
            </motion.p>
          )}
        </div>

        {/* Player */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full"
        >
          <MasterPlayer
            url={masterUrl}
            playing={masterPlaying}
            onToggle={toggleMasterPlay}
            audioRef={masterRef}
          />
        </motion.div>

        {/* Share + Download row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          {/* Share field takes remaining space */}
          <div className="flex-1 min-w-0">
            <ShareField jobId={jobId} />
          </div>

          {/* Download + Editor buttons */}
          <div className="flex items-center gap-3 shrink-0">
          {canDownload ? (
            <>
              <button
                onClick={downloadMaster}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-surface-0 text-xs font-body font-semibold uppercase tracking-wider transition-all hover:bg-accent-bright hover:shadow-[0_8px_32px_rgba(232,168,56,0.25)] active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                <Icon icon="solar:download-minimalistic-bold" className="h-3.5 w-3.5" />
                {t("downloadMp3")}
              </button>
              {onOpenEditor && (
                <button
                  onClick={onOpenEditor}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-surface-0 text-xs font-body font-semibold uppercase tracking-wider transition-all hover:shadow-[0_8px_32px_rgba(232,168,56,0.3)] active:scale-[0.98] whitespace-nowrap shrink-0 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #d4a229 0%, #e8a838 40%, #f0c45c 60%, #e8a838 100%)" }}
                >
                  <svg className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none" xmlns="http://www.w3.org/2000/svg"><filter id="edGrain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#edGrain)"/></svg>
                  <Icon icon="solar:tuning-2-bold" className="h-3.5 w-3.5 relative z-10" />
                  <span className="relative z-10">Editor</span>
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent/20 bg-accent/[0.06] hover:bg-accent/[0.12] text-accent text-xs font-body font-medium transition-all whitespace-nowrap shrink-0"
              >
                <Icon icon="solar:download-minimalistic-bold" className="h-3.5 w-3.5" />
                {t("downloadMp3")}
                <span className="text-[9px] text-accent/60 uppercase">{t("pro")}</span>
              </Link>
              <Link
                href="/pricing"
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent/25 bg-accent/[0.08] hover:bg-accent/[0.15] text-accent text-xs font-body font-medium transition-all whitespace-nowrap shrink-0 overflow-hidden"
              >
                <Icon icon="solar:tuning-2-bold" className="h-3.5 w-3.5" />
                Editor
                <span className="text-[9px] text-accent/60 uppercase">{t("pro")}</span>
              </Link>
            </>
          )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Modal: vertical centered layout
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
      className="relative flex flex-col items-center gap-6 bg-gradient-to-b from-surface-1 to-surface-0 border border-white/[0.08] rounded-3xl px-8 py-8 overflow-hidden w-full max-w-md mx-4 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8),0_0_0_1px_rgba(232,168,56,0.06)]"
      onClick={(e) => e.stopPropagation()}
    >
      {content}
    </motion.div>
  );
}

/* ── Main dialog ── */
export function MasterDialog({
  show,
  masterUrl,
  jobId,
  onClose,
  canDownload = true,
  inline = false,
  prompt,
  onOpenEditor,
}: {
  show: boolean;
  masterUrl: string | null;
  jobId: string;
  onClose: () => void;
  canDownload?: boolean;
  inline?: boolean;
  prompt?: string;
  onOpenEditor?: () => void;
}) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!show || !masterUrl) return null;

  // Inline mode: render panel directly without modal overlay
  if (inline) {
    return (
      <MasterPanel
        masterUrl={masterUrl}
        jobId={jobId}
        canDownload={canDownload}
        onClose={handleClose}
        inline
        prompt={prompt}
        onOpenEditor={onOpenEditor}
      />
    );
  }

  // Modal mode: render with backdrop overlay
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={handleClose}
      >
        <MasterPanel
          masterUrl={masterUrl}
          jobId={jobId}
          canDownload={canDownload}
          onClose={handleClose}
          inline={false}
        />
      </motion.div>
    </AnimatePresence>
  );
}
