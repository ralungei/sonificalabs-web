"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch, apiUrl } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import type { TimelineTrack } from "@/components/studio/types";

export type ShowState = "loading" | "ready" | "not-found" | "error" | "auth-required";

export interface ShowData {
  state: ShowState;
  audioUrl: string | null;
  tracks: TimelineTrack[];
  prompt: string;
  title: string;
  durationMs: number;
}

/** Data the page already holds when it mounts the show — skips the refetch. */
export interface ShowInitialData {
  audioUrl: string;
  tracks: TimelineTrack[];
  prompt: string;
  title?: string;
}

function durationFromTracks(tracks: TimelineTrack[]): number {
  return tracks.reduce((max, t) => Math.max(max, t.start_ms + t.duration_ms), 0);
}

export function useShowData(id: string, initial?: ShowInitialData): ShowData {
  const apiToken = useApiToken();
  const { status: authStatus } = useSession();
  const [data, setData] = useState<ShowData>(() =>
    initial
      ? {
          state: "ready",
          audioUrl: initial.audioUrl,
          tracks: initial.tracks,
          prompt: initial.prompt,
          title: initial.title || "",
          durationMs: durationFromTracks(initial.tracks),
        }
      : {
          state: "loading",
          audioUrl: null,
          tracks: [],
          prompt: "",
          title: "",
          durationMs: 0,
        },
  );

  useEffect(() => {
    // The page already delivered the full payload — no refetch, no polling.
    if (initial) return;

    if (authStatus === "unauthenticated") {
      setData((d) => ({ ...d, state: "auth-required" }));
      return;
    }
    if (authStatus !== "authenticated" || !id || !apiToken) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let consecutiveFailures = 0;

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    async function poll() {
      if (cancelled) return;
      try {
        const res = await apiFetch(`/p/${id}`, {}, apiToken);
        if (cancelled) return;

        if (res.status === 401) {
          setData((d) => ({ ...d, state: "auth-required" }));
          stopPolling();
          return;
        }
        if (res.status === 404) {
          setData((d) => ({ ...d, state: "not-found" }));
          stopPolling();
          return;
        }
        if (!res.ok) {
          // Transient server errors: keep polling briefly, but don't spin on
          // a persistent outage forever showing "loading".
          consecutiveFailures++;
          if (consecutiveFailures >= 5) {
            setData((d) => ({ ...d, state: "error" }));
            stopPolling();
          }
          return;
        }
        consecutiveFailures = 0;

        const payload = await res.json();
        if (cancelled) return;

        if (payload.status === "done") {
          if (!payload.audioUrl) {
            // Terminal state with no audio — treat as error, never poll forever.
            setData((d) => ({ ...d, state: "error" }));
            stopPolling();
            return;
          }
          const url = payload.audioUrl.startsWith("http")
            ? payload.audioUrl
            : apiUrl(payload.audioUrl, apiToken);

          const tracks: TimelineTrack[] = (payload.tracks || []).map((t: TimelineTrack) => ({
            ...t,
            audioUrl: t.audioUrl?.startsWith("http") ? t.audioUrl : apiUrl(t.audioUrl, apiToken),
          }));

          setData({
            state: "ready",
            audioUrl: url,
            tracks,
            prompt: payload.prompt || "",
            title: payload.title || "",
            durationMs: durationFromTracks(tracks),
          });
          stopPolling();
        } else if (payload.status === "error") {
          setData((d) => ({ ...d, state: "error" }));
          stopPolling();
        }
      } catch {
        // A dropped connection must age out like an HTTP failure, otherwise a
        // visitor who goes offline sits on "loading" forever.
        if (cancelled) return;
        consecutiveFailures++;
        if (consecutiveFailures >= 5) {
          setData((d) => ({ ...d, state: "error" }));
          stopPolling();
        }
      }
    }

    poll();
    pollTimer = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, apiToken, authStatus, !!initial]);

  return data;
}
