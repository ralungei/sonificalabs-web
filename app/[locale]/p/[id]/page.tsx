"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { JobStatus } from "@/components/JobStatus";
import { VoiceConfirmation } from "@/components/VoiceConfirmation";
import type { TimelineTrack } from "@/components/Studio";
import { HeroWave } from "@/components/site/HeroWave";
import { Navbar } from "@/components/Navbar";
import { apiFetch, apiUrl } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { ShowController } from "@/components/show/ShowController";
import { RaveShow } from "@/components/show/RaveShow";

type JobState = "working" | "confirming" | "done" | "error" | "not-found";

export default function JobPage() {
  const t = useTranslations("jobPage");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [state, setState] = useState<JobState>("working");
  const [status, setStatus] = useState("loading");
  const [progress, setProgress] = useState("");
  const [queuePosition, setQueuePosition] = useState<number | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TimelineTrack[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [escaleta, setEscaleta] = useState<any>(null);
  const [confirmDeadline, setConfirmDeadline] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [handedOver, setHandedOver] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hasConfirmedRef = useRef(false);
  const chooseVoicesRef = useRef(false);
  const apiToken = useApiToken();

  useEffect(() => {
    chooseVoicesRef.current = sessionStorage.getItem("sonificalabs_choose_voices") === "1";
  }, []);

  // Someone opening a shared /p/{id} link with no session: hand the page over
  // to ShowController instead of bouncing to a bare /signin, which dropped the
  // visitor on the homepage after authenticating. It shows the "private
  // production" screen with a callbackUrl back here, and once the session
  // arrives its own polling takes it the rest of the way (ready / not-found /
  // error). Latched: the handover must survive the session resolving.
  useEffect(() => {
    if (authStatus === "unauthenticated") setHandedOver(true);
  }, [authStatus]);

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
      title?: string;
      escaleta?: any;
      confirmDeadline?: number;
    }) => {
      setStatus(data.status);
      setProgress(data.progress || "");
      setQueuePosition(data.queuePosition);
      if (data.prompt) setPrompt(data.prompt);
      if (data.title) setTitle(data.title);

      if (data.status === "confirming" && !hasConfirmedRef.current) {
        if (!chooseVoicesRef.current) {
          // Auto-confirm immediately
          hasConfirmedRef.current = true;
          apiFetch(`/p/${id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voiceChanges: {} }),
          }, apiToken).catch(() => {});
          return;
        }
        if (data.escaleta) setEscaleta(data.escaleta);
        if (data.confirmDeadline) setConfirmDeadline(data.confirmDeadline);
        setState("confirming");
      } else if (data.status === "done") {
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
      } else if (state === "confirming" && data.status !== "confirming") {
        // Confirmed or auto-confirmed, back to working
        setState("working");
      }
    },
    [apiToken, state],
  );

  useEffect(() => {
    if (!id || !apiToken) return;

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
          if (res.status === 404) {
            setState("not-found");
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = null;
            return;
          }
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
  }, [id, router, apiToken]);

  // No session, or a job that reported "done" without a playable URL (which
  // used to render a blank page): ShowController owns the fetch from here, so
  // its sign-in / loading / not-found / error screens drive the outcome.
  if (handedOver || (state === "done" && !audioUrl)) {
    return <ShowController id={id} view={RaveShow} withAnalyser />;
  }

  // Done state: render the fullscreen Reactive show, handing over the data
  // this page already fetched (no duplicate /p/{id} + /user/quota round-trips,
  // no loading flash).
  if (state === "done" && audioUrl) {
    return (
      <ShowController
        id={id}
        view={RaveShow}
        withAnalyser
        userPlan={userPlan}
        initialData={{ audioUrl, tracks: tracks ?? [], prompt, title }}
      />
    );
  }

  const backHome = (
    <button onClick={() => router.push("/")} className={PILL}>
      <Icon icon="solar:alt-arrow-left-linear" className="h-4 w-4" />
      {t("backToHome")}
    </button>
  );

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-white text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -left-[12%] top-[20%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.2),transparent)]" />
        <span className="absolute -right-[14%] top-[5%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(13,148,136,.12),transparent)]" />
      </div>
      {state === "working" && <HeroWave active />}
      <Navbar />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-3 pb-[8vh]">

        <AnimatePresence mode="wait">

          {/* Not found state */}
          {state === "not-found" && authStatus !== "unauthenticated" && (
            <motion.div key="not-found" {...FADE} className="w-full">
              <Notice icon="solar:file-remove-linear" tone="muted" title={t("notFound")} text={t("notFoundDescription")}>
                {backHome}
              </Notice>
            </motion.div>
          )}

          {/* Working state */}
          {state === "working" && authStatus !== "unauthenticated" && (
            <motion.div
              key="working"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex w-full flex-col items-center"
            >
              <JobStatus status={status} progress={progress} queuePosition={queuePosition} />

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={handleCancel}
                className="mt-10 flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-text-muted transition-colors duration-300 hover:bg-fail/[0.08] hover:text-fail"
              >
                <Icon icon="solar:close-circle-linear" className="h-4 w-4" />
                {t("cancel")}
              </motion.button>
            </motion.div>
          )}

          {/* Confirming state: voice review */}
          {state === "confirming" && escaleta && (
            <VoiceConfirmation
              escaleta={escaleta}
              confirmDeadline={confirmDeadline}
              userPlan={userPlan}
              onConfirm={async (voiceChanges) => {
                hasConfirmedRef.current = true;
                setState("working");
                setStatus("queued");
                setProgress("En cola...");
                await apiFetch(`/p/${id}/confirm`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ voiceChanges }),
                }, apiToken).catch(() => {});
              }}
              onCancel={handleCancel}
            />
          )}

          {/* Error state */}
          {state === "error" && (
            <motion.div key="error" {...FADE} className="w-full">
              <Notice icon="solar:danger-triangle-linear" tone="fail" title={t("somethingWentWrong")} text={errorMsg || t("errorDescription")}>
                <button
                  onClick={() => {
                    if (prompt) sessionStorage.setItem("sonificalabs_draft", prompt.replace(/\[.*?\]/g, "").trim());
                    router.push("/");
                  }}
                  className={PILL}
                >
                  <Icon icon="solar:restart-linear" className="h-4 w-4" />
                  {t("tryAgain")}
                </button>
              </Notice>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

const FADE = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};

const PILL = "mt-2 flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-accent";

function Notice({ icon, tone, title, text, children }: {
  icon: string;
  tone: "muted" | "fail";
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-5 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
        className={`flex h-16 w-16 items-center justify-center rounded-full ${tone === "fail" ? "bg-fail/10 text-fail" : "bg-surface-2 text-text-muted"}`}
      >
        <Icon icon={icon} className="h-8 w-8" />
      </motion.div>
      <div className="flex flex-col items-center gap-3">
        <h1 className="m-0 text-balance text-[clamp(32px,4vw,48px)] font-normal leading-[1.04] tracking-[-0.06em]">{title}</h1>
        <p className="m-0 text-base leading-[1.5] text-text-secondary">{text}</p>
      </div>
      {children}
    </div>
  );
}
