"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { DemoCircle, NEUTRAL_TEXTURE, type Demo } from "@/components/DemoCircle";
import { type TimelineTrack } from "./types";
import { LiveTrackChips } from "./LiveTrackChips";
import { LiveSubtitles } from "./LiveSubtitles";

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
                : "bg-contrast/[0.1] group-hover:bg-contrast/[0.15]",
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
    <div className="w-full rounded-2xl bg-surface-0/80 border border-contrast/[0.06] p-4">
      <div className="flex items-start gap-3">
        {/* Play button — aligned to waveform center (h-10 wave → offset by ~0px) */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-[2px] h-11 w-11 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200",
            playing
              ? "bg-contrast text-surface-0"
              : "bg-contrast text-surface-0 hover:bg-contrast/90 active:scale-95",
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
            <span className="text-caption-md font-mono text-text-secondary tabular-nums">{currentTime}</span>
            <span className="text-caption-md font-mono text-text-muted tabular-nums">{duration}</span>
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
      <label className="text-label-sm font-body uppercase tracking-wider text-text-muted flex items-center gap-1.5">
        <Icon icon="solar:link-bold" className="h-3 w-3" />
        {t("shareLink")}
      </label>
      <div className="flex items-stretch rounded-xl border border-contrast/[0.08] bg-surface-0/60 overflow-hidden">
        <div className="flex-1 px-3.5 py-2.5 text-label-md font-body text-text-secondary truncate select-all min-w-0 flex items-center">
          {url || `…/p/${jobId}`}
        </div>
        <button
          onClick={copy}
          className={cn(
            "flex items-center gap-1.5 px-3 text-[0.65rem] font-body uppercase tracking-wider border-l border-contrast/[0.08] transition-all duration-300 shrink-0",
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
  firstVoiceText,
  userPlan,
  tracks,
}: {
  masterUrl: string;
  jobId: string;
  canDownload: boolean;
  onClose: () => void;
  inline: boolean;
  userPlan?: string;
  prompt?: string;
  onOpenEditor?: () => void;
  tracks?: TimelineTrack[];
  firstVoiceText?: string;
}) {
  const t = useTranslations("masterDialog");
  const masterRef = useRef<HTMLAudioElement | null>(null);
  const [masterPlaying, setMasterPlaying] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [timeLabel, setTimeLabel] = useState("0:00");
  const [durationLabel, setDurationLabel] = useState("0:00");
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [totalDurationMs, setTotalDurationMs] = useState(0);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    setTimeLabel(fmt(currentTime));
    setCurrentTimeMs(currentTime * 1000);
    if (duration && isFinite(duration)) {
      setDurationLabel(fmt(duration));
      setTotalDurationMs(duration * 1000);
    }
  }, []);

  const toggleMasterPlay = useCallback(() => {
    const el = masterRef.current;
    if (!el) return;
    if (masterPlaying) {
      el.pause();
      setMasterPlaying(false);
    } else {
      el.play();
      setMasterPlaying(true);
    }
  }, [masterPlaying]);

  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const canLossless = userPlan === "pro" || userPlan === "studio";

  const downloadMaster = useCallback(async (format: string = "mp3") => {
    setDownloadingFormat(format);
    setFormatMenuOpen(false);
    try {
      let url: string;
      let filename: string;
      if (format === "mp3") {
        url = masterUrl;
        filename = `sonificalabs-${jobId}.mp3`;
      } else {
        const apiBase = masterUrl.replace(/\/audio\/.*/, "");
        url = `${apiBase}/audio/${jobId}/download?format=${format}`;
        filename = `sonificalabs-${jobId}.${format}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(masterUrl, "_blank");
    } finally {
      setDownloadingFormat(null);
    }
  }, [masterUrl, jobId]);

  const videoUrl = masterUrl.replace(/\/audio\/([^/]+)(?:\/[^?]*)?(\?.*)/, "/video/$1$2");

  const shareVideo = useCallback(async () => {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error("Video generation failed");
      const blob = await res.blob();
      const file = new File([blob], `sonificalabs-${jobId}.mp4`, { type: "video/mp4" });

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "SonificaLabs",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // AbortError = user cancelled share sheet, ignore
      if (e instanceof Error && e.name === "AbortError") return;
      window.open(videoUrl, "_blank");
    } finally {
      setShareLoading(false);
    }
  }, [videoUrl, jobId, shareLoading]);

  // Preload audio metadata to show duration before play
  useEffect(() => {
    if (!masterRef.current) {
      masterRef.current = new Audio();
      masterRef.current.onended = () => {
        setMasterPlaying(false);
        setCurrentTimeMs(0);
      };
    }
    masterRef.current.preload = "auto";
    masterRef.current.src = masterUrl;
    return () => {
      masterRef.current?.pause();
    };
  }, [masterUrl]);

  const shareDialog = shareOpen && (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[var(--z-dropdown)] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setShareOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
          className="relative w-full max-w-xs mx-4 mb-4 sm:mb-0 bg-surface-1 border border-contrast/[0.08] rounded-2xl p-5 flex flex-col items-center gap-4 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={() => setShareOpen(false)}
            className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-white text-black shadow-md flex items-center justify-center hover:bg-white/90 transition-all z-10"
          >
            <Icon icon="material-symbols:close-rounded" className="h-4 w-4" />
          </button>

          {/* Cover preview 1:1 */}
          <div className="relative w-full rounded-xl overflow-hidden border border-contrast/[0.06]" style={{ aspectRatio: "1/1" }}>
            <img src="/waves-bg-black.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
            <img src="/sonificalabs-logo.svg" alt="" className="relative w-full h-full object-contain p-12 [filter:brightness(0)_invert(1)]" />
          </div>

          {/* Download button */}
          <button
            onClick={shareVideo}
            disabled={shareLoading}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white text-black border border-contrast/15 font-body text-label-md font-semibold transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
          >
            <Icon icon={shareLoading ? "svg-spinners:ring-resize" : "solar:download-minimalistic-bold"} className="h-4 w-4" />
            {shareLoading ? t("preparingShare") : t("downloadVideo")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  const content = (
    <>
      {/* Ambient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-52 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

      {/* Close (only in modal mode) */}
      {!inline && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-7 w-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-contrast/[0.06] transition-all"
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
            className="text-heading-sm font-body font-semibold text-text-primary"
          >
            {inline ? t("audioReady") : t("masterReady")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-label-sm text-text-muted font-body flex items-center gap-1.5"
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
        className="flex justify-center"
      >
        <DemoCircle
          demo={{ id: jobId, title: "", icon: "", file: masterUrl, texture: NEUTRAL_TEXTURE }}
          delay={0}
          size={160}
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
          <div className="w-full flex gap-3">
            <div className="relative flex-1 flex">
              <button
                onClick={() => downloadMaster("mp3")}
                disabled={!!downloadingFormat}
                className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-l-xl bg-accent text-surface-0 font-body text-label-md uppercase tracking-wider font-semibold transition-all hover:bg-accent-bright hover:shadow-[0_8px_32px_rgba(232,168,56,0.25)] active:scale-[0.98] disabled:opacity-60"
              >
                <Icon icon={downloadingFormat ? "svg-spinners:ring-resize" : "solar:download-minimalistic-bold"} className="h-4.5 w-4.5" />
                {downloadingFormat ? downloadingFormat.toUpperCase() : "MP3"}
              </button>
              {canLossless && (
                <button
                  onClick={() => setFormatMenuOpen(!formatMenuOpen)}
                  className="flex items-center justify-center px-2.5 py-3 rounded-r-xl bg-accent/80 text-surface-0 border-l border-accent-bright/30 hover:bg-accent-bright transition-all"
                >
                  <Icon icon="solar:alt-arrow-down-bold" className="h-3.5 w-3.5" />
                </button>
              )}
              {!canLossless && <div className="rounded-r-xl" />}
              {formatMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-1 border border-contrast/[0.1] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-20">
                  {[{ fmt: "wav", label: "WAV" }, { fmt: "flac", label: "FLAC" }].map(({ fmt, label }) => (
                    <button
                      key={fmt}
                      onClick={() => downloadMaster(fmt)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label-md font-body text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-all"
                    >
                      <Icon icon="solar:download-minimalistic-bold" className="h-3.5 w-3.5" />
                      {label}
                      <span className="ml-auto text-caption-md text-text-muted">Lossless</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black border border-contrast/15 font-body text-label-md font-semibold transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              <Icon icon="solar:share-bold" className="h-4 w-4" />
              {t("share")}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShareOpen(true)}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white text-black border border-contrast/15 font-body text-label-md font-semibold transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              <Icon icon="solar:share-bold" className="h-4 w-4" />
              {t("share")}
            </button>
            <Link
              href="/pricing"
              className="group w-full flex items-center justify-between px-4 py-3 rounded-xl border border-accent/15 bg-accent/[0.04] hover:bg-accent/[0.08] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Icon icon="solar:download-minimalistic-bold" className="h-4 w-4 text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-label-md font-body font-medium text-text-primary">{t("downloadInMp3")}</span>
                  <span className="text-caption-md text-text-muted">{t("availableInPro")}</span>
                </div>
              </div>
              <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
            </Link>
          </>
        )}
      </motion.div>
    </>
  );

  // Inline: hero player layout — three-column with live sync
  const hasTracks = !!tracks && tracks.length > 0;

  if (inline) {
    return (
    <>
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
        {/* Three-column layout: chips | player | subtitles */}
        <div className="relative flex flex-col md:flex-row items-center md:items-center justify-center gap-4 md:gap-0 w-full">
          {/* Left: track chips (desktop) / top (mobile) */}
          {hasTracks && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="md:w-[200px] md:flex md:justify-end md:pr-6 z-0 shrink-0"
            >
              <LiveTrackChips tracks={tracks} currentTimeMs={currentTimeMs} totalDurationMs={totalDurationMs} />
            </motion.div>
          )}

          {/* Center: player circle */}
          <div className="relative z-10 flex flex-col items-center gap-4 shrink-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <DemoCircle
                demo={{ id: jobId, title: "", icon: "", file: masterUrl, texture: NEUTRAL_TEXTURE }}
                delay={0.1}
                size={148}
                onTimeUpdate={handleTimeUpdate}
              />
            </motion.div>

            {/* Time display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 font-mono text-caption-md tabular-nums"
            >
              <span className="text-text-secondary">{timeLabel}</span>
              <span className="text-text-muted">/</span>
              <span className="text-text-muted">{durationLabel}</span>
            </motion.div>
          </div>

          {/* Right: subtitles (desktop) / bottom (mobile) */}
          {hasTracks && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="md:w-[200px] md:pl-6 z-0 shrink-0"
            >
              <LiveSubtitles tracks={tracks} currentTimeMs={currentTimeMs} />
            </motion.div>
          )}
        </div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3"
        >
          {canDownload ? (
            <>
              <div className="relative flex">
                <button
                  onClick={() => downloadMaster("mp3")}
                  disabled={!!downloadingFormat}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-l-xl bg-contrast text-surface-0 text-label-md font-body font-semibold uppercase tracking-wider transition-all hover:bg-contrast/90 active:scale-[0.98] whitespace-nowrap disabled:opacity-60"
                >
                  <Icon icon={downloadingFormat ? "svg-spinners:ring-resize" : "solar:download-minimalistic-bold"} className="h-3.5 w-3.5" />
                  {downloadingFormat ? downloadingFormat.toUpperCase() : "MP3"}
                </button>
                {canLossless ? (
                  <button
                    onClick={() => setFormatMenuOpen(!formatMenuOpen)}
                    className="flex items-center justify-center px-2 py-2.5 rounded-r-xl bg-contrast/80 text-surface-0 border-l border-contrast/50 hover:bg-contrast/70 transition-all"
                  >
                    <Icon icon="solar:alt-arrow-down-bold" className="h-3 w-3" />
                  </button>
                ) : <div className="rounded-r-xl bg-contrast w-0.5" />}
                {formatMenuOpen && (
                  <div className="absolute top-full left-0 mt-1.5 min-w-[120px] bg-surface-1 border border-contrast/[0.1] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-20">
                    {[{ fmt: "wav", label: "WAV" }, { fmt: "flac", label: "FLAC" }].map(({ fmt, label }) => (
                      <button
                        key={fmt}
                        onClick={() => downloadMaster(fmt)}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-label-md font-body text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-all"
                      >
                        <Icon icon="solar:download-minimalistic-bold" className="h-3 w-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black border border-contrast/15 text-label-md font-body font-semibold transition-all hover:bg-white/90 active:scale-[0.98] whitespace-nowrap"
              >
                <Icon icon="solar:share-bold" className="h-3.5 w-3.5" />
                {t("share")}
              </button>
              {onOpenEditor && (
                <button
                  onClick={onOpenEditor}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-body font-semibold uppercase tracking-wider transition-all active:scale-[0.98] whitespace-nowrap overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #5a5e65 0%, #787d85 20%, #a0a6ae 45%, #8c929a 65%, #6b7078 85%, #52565d 100%)",
                    color: "#e8eaee",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  <Icon icon="solar:tuning-2-bold" className="h-3.5 w-3.5 relative z-10" />
                  <span className="relative z-10">Editor</span>
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent/20 bg-accent/[0.06] hover:bg-accent/[0.12] text-accent text-label-md font-body font-medium transition-all whitespace-nowrap"
              >
                <Icon icon="solar:download-minimalistic-bold" className="h-3.5 w-3.5" />
                {t("downloadMp3")}
                <span className="text-caption-sm text-accent/60 uppercase">{t("pro")}</span>
              </Link>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black border border-contrast/15 text-label-md font-body font-semibold transition-all hover:bg-white/90 active:scale-[0.98] whitespace-nowrap"
              >
                <Icon icon="solar:share-bold" className="h-3.5 w-3.5" />
                {t("share")}
              </button>
            </>
          )}
        </motion.div>
      </div>
      {shareDialog}
    </>
    );
  }

  // Modal: vertical centered layout
  return (
    <>
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
      className="relative flex flex-col items-center gap-6 bg-gradient-to-b from-surface-1 to-surface-0 border border-contrast/[0.08] rounded-3xl px-8 py-8 overflow-hidden w-full max-w-md mx-4 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8),0_0_0_1px_rgba(232,168,56,0.06)]"
      onClick={(e) => e.stopPropagation()}
    >
      {content}
    </motion.div>
    {shareDialog}
    </>
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
  firstVoiceText,
  userPlan,
  tracks,
}: {
  show: boolean;
  masterUrl: string | null;
  jobId: string;
  onClose: () => void;
  canDownload?: boolean;
  inline?: boolean;
  prompt?: string;
  onOpenEditor?: () => void;
  firstVoiceText?: string;
  userPlan?: string;
  tracks?: TimelineTrack[];
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
        firstVoiceText={firstVoiceText}
        tracks={tracks}
        userPlan={userPlan}
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
        className="fixed inset-0 z-[var(--z-dropdown)] flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={handleClose}
      >
        <MasterPanel
          masterUrl={masterUrl}
          jobId={jobId}
          canDownload={canDownload}
          onClose={handleClose}
          inline={false}
          firstVoiceText={firstVoiceText}
          userPlan={userPlan}
        />
      </motion.div>
    </AnimatePresence>
  );
}
