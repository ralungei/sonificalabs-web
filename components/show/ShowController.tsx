"use client";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { ArrowDot } from "@/components/site/ui";
import { useShowData, type ShowInitialData } from "./useShowData";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import type { ShowViewProps } from "./types";

interface Props {
  id: string;
  view: ComponentType<ShowViewProps>;
  /** Whether to expose a Web Audio AnalyserNode for audio-reactive rendering. */
  withAnalyser?: boolean;
  /** Payload the parent page already fetched — skips the refetch + loading flash. */
  initialData?: ShowInitialData;
  /** User plan the parent already knows — skips the duplicate /user/quota fetch. */
  userPlan?: string;
}

export function ShowController({ id, view: View, withAnalyser = false, initialData, userPlan: userPlanProp }: Props) {
  const t = useTranslations("show");
  const data = useShowData(id, initialData);
  const apiToken = useApiToken();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [audioDurationMs, setAudioDurationMs] = useState(0);
  const [userPlan, setUserPlan] = useState<string>(userPlanProp ?? "free");
  const pendingSeekRatio = useRef<number | null>(null);

  useEffect(() => {
    if (userPlanProp != null) {
      setUserPlan(userPlanProp);
      return;
    }
    if (!apiToken) return;
    // Guard against out-of-order responses (token refresh can overlap fetches)
    let stale = false;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!stale && d?.plan) setUserPlan(d.plan);
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [apiToken, userPlanProp]);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (withAnalyser && !ctxRef.current) {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctx();
        const source = ctx.createMediaElementSource(audio);
        const a = ctx.createAnalyser();
        a.fftSize = 1024;
        a.smoothingTimeConstant = 0.78;
        source.connect(a);
        a.connect(ctx.destination);
        ctxRef.current = ctx;
        sourceRef.current = source;
        analyserRef.current = a;
        setAnalyser(a);
      } catch {}
    }

    if (ctxRef.current?.state === "suspended") {
      await ctxRef.current.resume().catch(() => {});
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {}
    } else {
      audio.pause();
    }
  }, [withAnalyser]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let raf = 0;
    let lastPushed = 0;
    const loop = () => {
      // ~10Hz is enough for karaoke word states and the progress bar —
      // a 60fps setState re-rendered the whole show tree every frame.
      const now = performance.now();
      if (now - lastPushed >= 100) {
        lastPushed = now;
        setCurrentTimeMs(audio.currentTime * 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    if (isPlaying) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setAudioDurationMs(audio.duration * 1000);
        if (pendingSeekRatio.current != null) {
          audio.currentTime = pendingSeekRatio.current * audio.duration;
          setCurrentTimeMs(audio.currentTime * 1000);
          pendingSeekRatio.current = null;
        }
      }
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setAudioDurationMs(audio.duration * 1000);
    }
    if (!audio.paused) setIsPlaying(true);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
    };
  }, [data.audioUrl]);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    const dur = audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) {
      // Metadata not loaded yet — remember the intent and apply on load
      // (the bar renders from track metadata before the file is ready).
      pendingSeekRatio.current = clamped;
      return;
    }
    audio.currentTime = clamped * dur;
    setCurrentTimeMs(audio.currentTime * 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  if (data.state === "loading") return <Frame><CenterMessage msg={t("loading")} pulse /></Frame>;
  if (data.state === "not-found") return <Frame><CenterMessage msg={t("notFound")} /></Frame>;
  if (data.state === "error") return <Frame><CenterMessage msg={t("error")} /></Frame>;
  if (data.state === "auth-required") {
    return (
      <Frame>
        <SignInScreen
          redirectId={id}
          eyebrow={t("privateProduction")}
          prompt={t("signInPrompt")}
          cta={t("signIn")}
        />
      </Frame>
    );
  }
  if (!data.audioUrl) return <Frame><CenterMessage msg={t("loading")} pulse /></Frame>;

  return (
    <div className="relative min-h-screen">
      <Navbar overlay />
      <audio
        ref={audioRef}
        src={data.audioUrl}
        crossOrigin="anonymous"
        preload="auto"
        playsInline
        className="sr-only"
      />
      <View
        jobId={id}
        audioUrl={data.audioUrl}
        tracks={data.tracks}
        prompt={data.prompt}
        title={data.title}
        durationMs={audioDurationMs || data.durationMs}
        currentTimeMs={currentTimeMs}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        seek={seek}
        analyser={analyser}
        userPlan={userPlan}
      />
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white text-ink">
      <Navbar overlay />
      {children}
    </div>
  );
}

function CenterMessage({ msg, pulse = false }: { msg: string; pulse?: boolean }) {
  return (
    <div className="fixed inset-0 grid place-items-center text-sm font-medium uppercase tracking-[.12em] text-text-muted">
      <span className={pulse ? "animate-pulse" : undefined}>{msg}</span>
    </div>
  );
}

function SignInScreen({
  redirectId,
  eyebrow,
  prompt,
  cta,
}: {
  redirectId: string;
  eyebrow: string;
  prompt: string;
  cta: string;
}) {
  // SSR and first client render must match (hydration) — start with the
  // canonical route and pick up the locale-prefixed pathname after mount.
  const [callbackUrl, setCallbackUrl] = useState(`/p/${redirectId}`);
  useEffect(() => {
    setCallbackUrl(window.location.pathname);
  }, []);
  return (
    <div className="fixed inset-0 grid place-items-center px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-surface-2 px-3.5 py-[7px] text-[13px] font-semibold uppercase tracking-[.08em] text-text-secondary">
          {eyebrow}
        </span>
        <p className="m-0 text-balance text-[clamp(26px,3vw,36px)] font-normal leading-[1.15] tracking-[-0.05em]">{prompt}</p>
        <a
          href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          data-prevent-toggle
          className="flex h-14 items-center gap-[13px] rounded-full bg-ink pl-6 pr-2 text-base font-medium tracking-[-0.02em] text-white transition-colors hover:bg-accent"
        >
          {cta}
          <ArrowDot size={40} />
        </a>
      </div>
    </div>
  );
}
