"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const t = useTranslations("audioPlayer");
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<InstanceType<
    typeof import("wavesurfer.js").default
  > | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [isReady, setIsReady] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!waveformRef.current) return;
    let cancelled = false;
    let ws: InstanceType<typeof import("wavesurfer.js").default>;

    waveformRef.current.innerHTML = "";

    (async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      if (cancelled) return;
      ws = WaveSurfer.create({
        container: waveformRef.current!,
        waveColor: "#8a6b20",
        progressColor: "#e8a838",
        cursorColor: "#f5c842",
        barWidth: 2,
        barGap: 2,
        barRadius: 4,
        height: 80,
        normalize: true,
        backend: "WebAudio",
      });

      ws.on("ready", () => {
        if (!cancelled) {
          setDuration(formatTime(ws.getDuration()));
          setIsReady(true);
        }
      });
      ws.on("audioprocess", () =>
        !cancelled && setCurrentTime(formatTime(ws.getCurrentTime())),
      );
      ws.on("seeking", () =>
        !cancelled && setCurrentTime(formatTime(ws.getCurrentTime())),
      );
      ws.on("play", () => !cancelled && setIsPlaying(true));
      ws.on("pause", () => !cancelled && setIsPlaying(false));
      ws.on("finish", () => !cancelled && setIsPlaying(false));

      ws.load(audioUrl);
      wavesurferRef.current = ws;
    })();

    return () => {
      cancelled = true;
      ws?.destroy();
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative rounded-2xl border border-border-subtle bg-surface-1/60 backdrop-blur-md p-6 overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />

        {/* Ambient glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse,rgba(232,168,56,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10">
          {/* Waveform */}
          <div
            ref={waveformRef}
            className={cn(
              "w-full cursor-pointer transition-opacity duration-500 rounded-lg",
              !isReady && "opacity-20",
            )}
          />

          {/* Controls */}
          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={togglePlay}
                disabled={!isReady}
                whileHover={isReady ? { scale: 1.08 } : {}}
                whileTap={isReady ? { scale: 0.95 } : {}}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300",
                  "bg-accent text-surface-0 shadow-[0_0_20px_rgba(232,168,56,0.15)]",
                  "hover:shadow-[0_0_30px_rgba(232,168,56,0.3)]",
                  !isReady && "opacity-40 cursor-not-allowed",
                )}
              >
                {isPlaying ? (
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </motion.button>

              <span className="text-sm text-text-secondary font-mono tabular-nums tracking-wide">
                {currentTime}{" "}
                <span className="text-text-muted/60">/</span>{" "}
                {duration}
              </span>
            </div>

            <a
              href={audioUrl}
              download
              className="group flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white transition-colors duration-300"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:-translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {t("download")}
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
