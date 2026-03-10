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
import { Navbar } from "@/components/Navbar";
import { apiFetch, apiUrl, API_URL } from "@/lib/api";
import { useApiToken } from "@/components/Providers";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const canDownload = userPlan !== "free";
  const cleanupRef = useRef<(() => void) | null>(null);
  const apiToken = useApiToken();

  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditorOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen]);

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.plan) setUserPlan(data.plan);
      })
      .catch(() => {});
  }, [apiToken]);

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
        const raw = data.audioUrl;
        const url = raw
          ? raw.startsWith("http") ? raw : apiUrl(raw, apiToken)
          : null;
        setAudioUrl(url);
        if (data.tracks) {
          setTracks(data.tracks.map((tr: TimelineTrack) => ({
            ...tr,
            audioUrl: tr.audioUrl?.startsWith("http") ? tr.audioUrl : apiUrl(tr.audioUrl, apiToken),
          })));
        }
        setState("done");
      } else if (data.status === "error") {
        setErrorMsg(data.error || "Something went wrong");
        setState("error");
      }
    },
    [apiToken],
  );

  useEffect(() => {
    if (!id) return;

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // Try SSE first, fall back to polling
    try {
      eventSource = new EventSource(apiUrl(`/p/${id}/stream`, apiToken));

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
          const res = await apiFetch(`/p/${id}`, {}, apiToken);
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
  }, [id, apiToken, handleData]);

  const handleCancel = useCallback(async () => {
    await apiFetch(`/cancel/${id}`, { method: "POST" }, apiToken).catch(() => {});
    cleanupRef.current?.();
    router.push("/");
  }, [id, router]);

  return (
    <>
    <main className="relative flex min-h-screen flex-col items-center px-3 pt-[6vh] overflow-hidden">
      <BackgroundBeams />
      <Navbar />

      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl">

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
                className="mt-10 text-xs font-body uppercase tracking-wider text-contrast/40 hover:text-fail transition-colors duration-300"
              >
                {t("cancel")}
              </motion.button>
            </motion.div>
          )}

          {/* Done state — always inline master, editor in fullscreen modal for paid */}
          {state === "done" && audioUrl && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center w-full pb-[10vh]"
              style={{ minHeight: "calc(100dvh - 14vh)" }}
            >
              <MasterDialog
                show
                masterUrl={audioUrl}
                jobId={id}
                onClose={() => {}}
                canDownload={canDownload}
                inline
                prompt={prompt}
                onOpenEditor={tracks && tracks.length > 0 ? () => setEditorOpen(true) : undefined}
              />

              {/* Create another */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <button
                  onClick={() => router.push("/")}
                  className="px-5 py-2.5 rounded-xl bg-white text-surface-0 text-sm font-body font-semibold hover:bg-white/90 transition-all active:scale-[0.98]"
                >
                  {t("createAnother")}
                </button>
              </motion.div>

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
                  className="mt-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-surface-2 border border-contrast/[0.08] text-text-secondary hover:text-text-primary text-xs font-body uppercase tracking-wider transition-all hover:bg-surface-3 active:scale-[0.98]"
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

      {/* Fullscreen editor — outside main to avoid overflow clipping */}
      <AnimatePresence>
        {editorOpen && tracks && tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[var(--z-editor)] bg-surface-0 flex flex-col"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 h-12 border-b border-contrast/[0.06] flex-shrink-0">
              <span className="text-xs font-body uppercase tracking-wider text-contrast/40">Timeline</span>
              <button
                onClick={() => setEditorOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-contrast/50 hover:text-contrast hover:bg-contrast/[0.06] transition-all"
              >
                <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
              </button>
            </div>

            {/* Studio fills remaining space */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <Studio
                tracks={tracks}
                jobId={id}
                audioUrl={audioUrl!}
                onRemixDone={(newUrl) => setAudioUrl(newUrl)}
                canDownload={canDownload}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
