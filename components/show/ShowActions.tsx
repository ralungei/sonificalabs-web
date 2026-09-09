"use client";
import { useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { apiUrl } from "@/lib/api";
import { useApiToken } from "@/components/Providers";

interface Props {
  jobId: string;
  audioUrl: string;
  prompt: string;
  userPlan: string;
  /** When true, renders just the buttons in a row (no floating pill). */
  inline?: boolean;
}

export function ShowActions({ jobId, audioUrl, prompt, userPlan, inline = false }: Props) {
  const t = useTranslations("masterDialog");
  const ts = useTranslations("show");
  const router = useRouter();
  const apiToken = useApiToken();
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const formatRef = useRef<HTMLDivElement>(null);

  // Free plan cannot download (same gate the old MasterDialog enforced);
  // lossless formats are pro/studio only.
  const canDownload = userPlan !== "free";
  const canLossless = userPlan === "pro" || userPlan === "studio";

  // Close format dropdown on outside click
  useEffect(() => {
    if (!formatMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (formatRef.current && !formatRef.current.contains(e.target as Node)) {
        setFormatMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [formatMenuOpen]);

  const downloadMaster = useCallback(
    async (format = "mp3") => {
      setDownloadingFormat(format);
      setFormatMenuOpen(false);
      setDownloadFailed(false);
      try {
        let url: string;
        let filename: string;
        if (format === "mp3") {
          url = audioUrl;
          filename = `sonificalabs-${jobId}.mp3`;
        } else {
          // The backend guards /audio/* with auth — build the URL with the
          // token (deriving it from audioUrl stripped the ?token and 401'd).
          url = apiUrl(`/audio/${jobId}/download?format=${format}`, apiToken);
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
        // Never hand the browser the raw /audio URL: it carries the session
        // token, so it would end up in the address bar and in history.
        setDownloadFailed(true);
        setTimeout(() => setDownloadFailed(false), 4000);
      } finally {
        setDownloadingFormat(null);
      }
    },
    [audioUrl, jobId, apiToken],
  );

  const handleDownloadClick = useCallback(() => {
    if (!canDownload) {
      router.push("/pricing");
      return;
    }
    if (canLossless) {
      setFormatMenuOpen((v) => !v);
    } else {
      downloadMaster("mp3");
    }
  }, [canDownload, canLossless, downloadMaster, router]);

  const copyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch {}
  }, []);

  const downloadVideo = useCallback(async () => {
    if (shareLoading) return;
    setShareLoading(true);
    setShareError(false);
    const videoUrl = apiUrl(`/video/${jobId}`, apiToken);
    try {
      let res: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        // 45s cap per attempt — a hung render must not pin the button forever
        res = await fetch(videoUrl, { signal: AbortSignal.timeout(45_000) });
        if (res.status === 409) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        break;
      }
      if (!res || !res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const file = new File([blob], `sonificalabs-${jobId}.mp4`, { type: "video/mp4" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "SonificaLabs" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // AbortError here can only come from the user dismissing the native
      // share sheet — not an error. Our 45s cap raises TimeoutError instead,
      // which is a real failure and must surface as one.
      if ((err as Error)?.name === "AbortError") return;
      // No URL fallback: videoUrl carries the session token, and `download`
      // is ignored cross-origin, so the browser would navigate away from the
      // player and park the token in the address bar and in history.
      setShareError(true);
    } finally {
      setShareLoading(false);
    }
  }, [audioUrl, jobId, shareLoading, apiToken]);

  const buttons = (
    <>
      {/* Download */}
      <div ref={formatRef} className="relative">
          <ActionBtn
            icon={
              downloadingFormat
                ? "svg-spinners:ring-resize"
                : downloadFailed
                  ? "solar:danger-triangle-linear"
                  : "solar:download-minimalistic-linear"
            }
            label={downloadFailed ? ts("downloadFailed") : t("downloadMp3")}
            onClick={handleDownloadClick}
            disabled={!!downloadingFormat}
          />
          <AnimatePresence>
            {formatMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 mb-2 w-32 rounded-xl border border-text-primary/10 bg-surface-0 backdrop-blur-xl shadow-xl py-1 overflow-hidden"
              >
                {[
                  { fmt: "mp3", label: "MP3" },
                  { fmt: "wav", label: "WAV" },
                  { fmt: "flac", label: "FLAC" },
                ].map((f) => (
                  <button
                    key={f.fmt}
                    onClick={() => downloadMaster(f.fmt)}
                    className="w-full flex items-center justify-between px-3 py-2 text-label-md font-mono text-text-secondary hover:text-text-primary hover:bg-contrast/[0.04] transition-colors"
                  >
                    <span>{f.label}</span>
                    {downloadingFormat === f.fmt && (
                      <Icon icon="svg-spinners:ring-resize" className="h-3.5 w-3.5" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share */}
        <ActionBtn
          icon="solar:share-linear"
          label={t("share")}
          onClick={() => {
            // A failure from a previous visit must not greet the user with a
            // red error before they have clicked anything.
            setShareError(false);
            setShareOpen(true);
          }}
        />
    </>
  );

  return (
    <>
      {inline ? (
        <div
          data-prevent-toggle
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {buttons}
        </div>
      ) : (
        <div
          data-prevent-toggle
          className="fixed bottom-6 right-6 z-30 flex items-center gap-1 p-1 rounded-full bg-surface-0/85 backdrop-blur-xl border border-text-primary/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
          onClick={(e) => e.stopPropagation()}
        >
          {buttons}
        </div>
      )}

      {/* Share modal — portaled to <body>: inside the player bar, its
          backdrop-filter establishes a containing block that would trap
          this fixed overlay inside the bar instead of covering the page. */}
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {shareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShareOpen(false)}
            data-prevent-toggle
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
              className="relative w-full max-w-sm mx-4 rounded-2xl bg-surface-0 border border-text-primary/10 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShareOpen(false)}
                className="absolute top-4 right-4 h-7 w-7 rounded-full text-text-muted hover:text-text-primary hover:bg-contrast/[0.06] grid place-items-center transition-all"
              >
                <Icon icon="solar:close-circle-linear" className="h-4 w-4" />
              </button>

              <h3 className="text-heading-sm font-body font-semibold text-text-primary mb-1">
                {t("share")}
              </h3>
              <p className="text-body-md text-text-secondary mb-5 leading-relaxed">
                {ts("shareDescription")}
              </p>

              {/* URL row */}
              <div className="flex items-center gap-2 p-2 pl-3 rounded-xl bg-surface-2 border border-text-primary/10 mb-3">
                <Icon icon="solar:link-linear" className="h-4 w-4 text-text-muted shrink-0" />
                <input
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="flex-1 bg-transparent text-label-md font-mono text-text-primary outline-none truncate"
                />
                <button
                  onClick={copyShareUrl}
                  className="px-3 py-1.5 rounded-lg bg-accent text-white text-label-sm font-mono uppercase tracking-wider transition-all hover:bg-accent-bright"
                >
                  {shareCopied ? "✓" : ts("copy")}
                </button>
              </div>

              {/* Video button */}
              <button
                onClick={downloadVideo}
                disabled={shareLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-text-primary text-surface-0 text-label-md font-body font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              >
                <Icon
                  icon={shareLoading ? "svg-spinners:ring-resize" : "solar:videocamera-linear"}
                  className="h-4 w-4"
                />
                {shareLoading ? ts("preparingVideo") : ts("saveAsVideo")}
              </button>
              {shareError && (
                <p className="text-label-sm text-fail text-center mt-2">
                  {ts("videoFailed")}
                </p>
              )}
              <p className="text-label-sm text-text-muted text-center mt-2 font-mono">
                {ts("bestFor")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}
    </>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-prevent-toggle
      className="group/btn relative h-10 w-10 rounded-full flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/[0.08] disabled:opacity-50 transition-all"
      title={label}
      aria-label={label}
    >
      <Icon icon={icon} className="h-4 w-4" />
    </button>
  );
}
