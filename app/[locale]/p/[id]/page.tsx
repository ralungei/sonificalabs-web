"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { JobStatus } from "@/components/JobStatus";
import { Studio, type TimelineTrack } from "@/components/Studio";
import { MasterDialog } from "@/components/studio/MasterDialog";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { apiFetch, apiUrl } from "@/lib/api";

type JobState = "working" | "done" | "error";

export default function JobPage() {
  const t = useTranslations("jobPage");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<JobState>("working");
  const [status, setStatus] = useState("queued");
  const [progress, setProgress] = useState("");
  const [queuePosition, setQueuePosition] = useState<number | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TimelineTrack[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [prompt, setPrompt] = useState("");
  const [userPlan, setUserPlan] = useState<string>("free");
  const canDownload = userPlan !== "free";
  const cleanupRef = useRef<(() => void) | null>(null);

  // Fetch user plan
  useEffect(() => {
    apiFetch("/user/quota")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.plan) setUserPlan(data.plan);
      })
      .catch(() => {});
  }, []);

  const handleData = useCallback(
    (data: {
      status: string;
      progress?: string;
      queuePosition?: number;
      audioUrl?: string;
      tracks?: TimelineTrack[];
      error?: string;
      prompt?: string;
    }) => {
      setStatus(data.status);
      setProgress(data.progress || "");
      setQueuePosition(data.queuePosition);
      if (data.prompt) setPrompt(data.prompt);

      if (data.status === "done") {
        setAudioUrl(data.audioUrl || null);
        if (data.tracks) setTracks(data.tracks);
        setState("done");
      } else if (data.status === "error") {
        setErrorMsg(data.error || "Something went wrong");
        setState("error");
      }
    },
    [],
  );

  useEffect(() => {
    if (!id) return;

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // Try SSE first, fall back to polling
    try {
      eventSource = new EventSource(apiUrl(`/p/${id}/stream`));

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleData(data);
          if (data.status === "done" || data.status === "error") {
            eventSource?.close();
          }
        } catch {}
      };

      eventSource.onerror = () => {
        // SSE failed — fall back to polling
        eventSource?.close();
        eventSource = null;
        startPolling();
      };
    } catch {
      // EventSource not supported — use polling
      startPolling();
    }

    function startPolling() {
      if (pollTimer) return;
      const poll = async () => {
        try {
          const res = await apiFetch(`/p/${id}`);
          if (!res.ok) return;
          const data = await res.json();
          handleData(data);
          if (data.status === "done" || data.status === "error") {
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = null;
          }
        } catch {}
      };
      poll();
      pollTimer = setInterval(poll, 1500);
    }

    cleanupRef.current = () => {
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
    };

    return () => {
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [id, handleData]);

  const handleCancel = useCallback(async () => {
    await apiFetch(`/cancel/${id}`, { method: "POST" }).catch(() => {});
    cleanupRef.current?.();
    router.push("/");
  }, [id, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center px-3 pt-[6vh] overflow-hidden">
      <BackgroundBeams />

      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/")}
          className="self-start mb-6 flex items-center gap-2 text-xs font-body uppercase tracking-wider text-white/60 hover:text-white transition-colors duration-300"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t("back")}
        </motion.button>

        <AnimatePresence mode="wait">
          {/* Working state */}
          {state === "working" && (
            <motion.div
              key="working"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center w-full min-h-[60vh]"
            >
              <JobStatus status={status} progress={progress} queuePosition={queuePosition} />

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={handleCancel}
                className="mt-10 text-xs font-body uppercase tracking-wider text-white/40 hover:text-fail transition-colors duration-300"
              >
                {t("cancel")}
              </motion.button>
            </motion.div>
          )}

          {/* Done state — Free: inline master dialog / Paid: full editor */}
          {state === "done" && audioUrl && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center w-full"
            >
              {canDownload ? (
                <>
                  {/* Paid: full Studio editor */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-2 mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="h-2 w-2 rounded-full bg-done"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <h2 className="text-2xl font-body font-semibold text-text-primary">
                        {t("audioReady")}
                      </h2>
                    </div>
                    {prompt && (
                      <p className="text-sm text-text-muted text-center max-w-lg line-clamp-2">
                        &ldquo;{prompt.replace(/\[.*?\]/g, "").trim()}&rdquo;
                      </p>
                    )}
                  </motion.div>

                  {tracks && tracks.length > 0 && (
                    <Studio
                      tracks={tracks}
                      jobId={id}
                      audioUrl={audioUrl}
                      onRemixDone={(newUrl) => setAudioUrl(newUrl)}
                      canDownload={canDownload}
                    />
                  )}

                  <div className="flex items-center gap-6 mt-8">
                    <motion.a
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      href={`/api/srt/${id}`}
                      download
                      className="text-xs font-body uppercase tracking-wider text-white/40 hover:text-accent transition-colors duration-300"
                    >
                      SRT
                    </motion.a>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      onClick={() => router.push("/")}
                      className="px-5 py-2.5 rounded-xl bg-accent text-surface-0 text-sm font-body font-semibold hover:bg-accent-bright hover:shadow-[0_8px_32px_rgba(232,168,56,0.25)] transition-all active:scale-[0.98]"
                    >
                      {t("createAnother")}
                    </motion.button>
                  </div>
                </>
              ) : (
                /* Free: inline master panel (no editor) */
                <div className="flex flex-col items-center justify-center w-full pb-[10vh]" style={{ minHeight: "calc(100dvh - 14vh)" }}>
                  <MasterDialog
                    show
                    masterUrl={audioUrl}
                    jobId={id}
                    onClose={() => {}}
                    canDownload={false}
                    inline
                    prompt={prompt}
                  />

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => router.push("/")}
                    className="mt-6 px-5 py-2.5 rounded-xl bg-accent text-surface-0 text-sm font-body font-semibold hover:bg-accent-bright hover:shadow-[0_8px_32px_rgba(232,168,56,0.25)] transition-all active:scale-[0.98]"
                  >
                    Crear otro
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* Error state */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center w-full min-h-[60vh]"
            >
              <div className="flex flex-col items-center gap-5 max-w-sm w-full">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
                  className="h-16 w-16 rounded-2xl bg-fail/10 border border-fail/15 flex items-center justify-center"
                >
                  <Icon icon="solar:danger-triangle-bold" className="h-8 w-8 text-fail/80" />
                </motion.div>

                {/* Text */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="text-lg font-body font-semibold text-text-primary">
                    {t("somethingWentWrong")}
                  </h2>
                  <p className="text-sm text-text-secondary font-body leading-relaxed">
                    {errorMsg || t("errorDescription")}
                  </p>
                </div>

                {/* Retry button */}
                <button
                  onClick={() => router.push("/")}
                  className="mt-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-text-secondary hover:text-text-primary text-xs font-body uppercase tracking-wider transition-all hover:bg-surface-3 active:scale-[0.98]"
                >
                  <Icon icon="solar:restart-bold" className="h-3.5 w-3.5" />
                  {t("tryAgain")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
