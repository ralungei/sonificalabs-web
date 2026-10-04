"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { apiFetch, apiUrl } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { timeAgo, formatDate, formatDuration } from "@/lib/format";

const DEFAULT_PAGE_SIZE = 12;

export interface ProductionItem {
  id: string;
  title: string | null;
  prompt: string;
  status: string;
  trackCount: number;
  creditsUsed: number;
  durationMs: number | null;
  createdAt: string | null;
  finishedAt: string | null;
  hasAudio: boolean;
}

interface ActiveItem {
  id: string;
  title: string | null;
  prompt: string;
  status: string;
  createdAt: string;
}

interface Payload {
  total: number;
  limit: number;
  offset: number;
  active: ActiveItem[];
  productions: ProductionItem[];
}

/** Status pill. Colours come from the semantic tokens, not from raw Tailwind greys. */
function StatusDot({ status }: { status: string }) {
  const t = useTranslations("console");
  const tone =
    status === "done"
      ? { dot: "bg-done", text: "text-done" }
      : status === "error"
        ? { dot: "bg-fail", text: "text-fail" }
        : status === "cancelled"
          ? { dot: "bg-text-muted", text: "text-text-muted" }
          : { dot: "bg-accent", text: "text-accent" };

  const label = ["done", "error", "cancelled", "queued", "generating", "confirming", "producing"].includes(status)
    ? t(`status.${status}`)
    : status;

  return (
    <span className={`inline-flex items-center gap-1.5 text-caption-md font-medium ${tone.text}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${tone.dot} ${
          ["queued", "generating", "confirming", "producing"].includes(status) ? "animate-pulse" : ""
        }`}
      />
      {label}
    </span>
  );
}

/** The row currently playing, so starting another one stops it. */
let activeAudio: HTMLAudioElement | null = null;

type PlayState = "idle" | "loading" | "playing" | "error";

/**
 * Inline player.
 *
 * It streams through a plain audio element. The first version fetched the
 * whole MP3 as a blob and only then called play(), after an await and outside
 * the click, which browsers that require a user gesture reject; the rejection
 * was swallowed, so the button flipped to "pause" while nothing sounded. The
 * token rides in the query string, which the API accepts for media requests.
 */
function PlayButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("console");
  const token = useApiToken();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayState>("idle");

  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (!el) return;
      el.pause();
      el.removeAttribute("src");
      el.load();
      if (activeAudio === el) activeAudio = null;
    };
  }, []);

  const toggle = () => {
    let el = audioRef.current;

    if (el && state === "error") {
      el.removeAttribute("src");
      el = null;
      audioRef.current = null;
    }

    if (el && !el.paused) {
      el.pause();
      return;
    }

    if (!el) {
      el = new Audio();
      el.preload = "none";
      el.addEventListener("playing", () => setState("playing"));
      el.addEventListener("waiting", () => setState("loading"));
      el.addEventListener("pause", () => setState((s) => (s === "error" ? s : "idle")));
      el.addEventListener("ended", () => setState("idle"));
      el.addEventListener("error", () => setState("error"));
      el.src = apiUrl(`/audio/${id}`, token);
      audioRef.current = el;
    }

    if (activeAudio && activeAudio !== el) activeAudio.pause();
    activeAudio = el;
    setState("loading");
    // Called synchronously inside the click, so the gesture still counts.
    el.play().catch((err: unknown) => {
      if ((err as { name?: string })?.name !== "AbortError") setState("error");
    });
  };

  const icon =
    state === "loading" ? "svg-spinners:ring-resize"
    : state === "playing" ? "solar:pause-bold"
    : state === "error" ? "solar:danger-triangle-linear"
    : "solar:play-bold";

  const label =
    state === "playing" ? t("actions.pause", { title })
    : state === "error" ? t("actions.playError", { title })
    : t("actions.play", { title });

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={state === "error" ? label : undefined}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-surface-0 transition-all duration-200 hover:shadow-[var(--shadow-glow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        state === "error" ? "border-fail/40 text-fail hover:border-fail" : "border-border-subtle text-accent hover:border-accent"
      }`}
    >
      <Icon icon={icon} className={state === "idle" ? "h-4 w-4 translate-x-px" : "h-4 w-4"} />
    </button>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border-subtle px-4 py-3 sm:px-5">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-2" />
      <div className="min-w-0 flex-1">
        <div className="flex h-[21px] items-center"><div className="h-3.5 w-2/5 animate-pulse rounded bg-surface-2" /></div>
        <div className="mt-1 flex h-[18px] items-center"><div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" /></div>
      </div>
    </div>
  );
}

export function ConsoleList({
  limit,
  compact = false,
  refreshKey,
}: {
  limit?: number;
  compact?: boolean;
  /** Bump to reload in place. Remounting instead flashed the skeleton on every window focus. */
  refreshKey?: number;
} = {}) {
  const PAGE_SIZE = limit ?? DEFAULT_PAGE_SIZE;
  const t = useTranslations("console");
  const locale = useLocale();
  const token = useApiToken();
  const reduceMotion = useReducedMotion();

  const [data, setData] = useState<Payload | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    async (nextOffset: number, showSpinner: boolean) => {
      if (!token) return;
      if (showSpinner) setLoading(true);
      try {
        const res = await apiFetch(`/user/productions?limit=${PAGE_SIZE}&offset=${nextOffset}`, {}, token);
        if (!res.ok) {
          setFailed(true);
          return;
        }
        setData(await res.json());
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    load(offset, true);
  }, [load, offset]);

  useEffect(() => {
    if (refreshKey) load(offset, false);
    // Only the key should trigger this; offset changes already reload above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Anything still rendering will change state on its own; poll only while
  // something is actually in flight.
  useEffect(() => {
    if (!data?.active?.length) return;
    const id = setInterval(() => load(offset, false), 5000);
    return () => clearInterval(id);
  }, [data?.active?.length, load, offset]);

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  if (loading && !data) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-0">
        {Array.from({ length: compact ? PAGE_SIZE : 6 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-0 px-6 py-14 text-center">
        <Icon icon="solar:cloud-cross-linear" className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-body-sm text-text-secondary">{t("error")}</p>
        <button
          type="button"
          onClick={() => load(offset, true)}
          className="mt-4 rounded-full border border-border-subtle px-4 py-2 text-label-md text-contrast transition-colors hover:border-accent hover:text-accent"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  const active = data?.active ?? [];
  const items = data?.productions ?? [];

  if (!active.length && !items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-0 px-6 py-16 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent/8 text-accent">
          <Icon icon="solar:soundwave-linear" className="h-7 w-7" />
        </div>
        <h2 className="text-heading-sm font-semibold text-contrast">{t("empty.title")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-body-sm text-text-secondary">{t("empty.body")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-label-md font-medium text-white transition-all hover:bg-accent-bright hover:shadow-[var(--shadow-glow-md)]"
        >
          <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4" />
          {t("empty.cta")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-0">
        <AnimatePresence initial={false}>
          {active.map((item) => (
            <motion.div
              key={item.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              className="flex items-center gap-4 border-b border-border-subtle bg-accent/[0.03] px-4 py-3 sm:px-5"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/30 text-accent">
                <Icon icon="svg-spinners:ring-resize" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-contrast">
                  {item.title || item.prompt || t("untitled")}
                </p>
                <div className="mt-1 flex items-center gap-x-3 text-caption-md text-text-muted">
                  <StatusDot status={item.status} />
                  <span title={formatDate(item.createdAt, locale)}>{timeAgo(item.createdAt, locale)}</span>
                </div>
              </div>
              <Link
                href={`/p/${item.id}`}
                className="inline-flex h-9 shrink-0 items-center rounded-full border border-border-subtle px-4 text-label-md text-text-secondary transition-colors hover:border-accent hover:text-accent"
              >
                {t("actions.follow")}
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.map((item, i) => {
          const label = item.title || item.prompt || t("untitled");
          return (
            <motion.div
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : Math.min(i * 0.03, 0.25), duration: 0.25 }}
              className="group flex items-center gap-4 border-b border-border-subtle px-4 py-3 last:border-b-0 transition-colors hover:bg-surface-2/40 sm:px-5"
            >
              {item.hasAudio ? (
                <PlayButton id={item.id} title={label} />
              ) : (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border-subtle text-text-muted">
                  <Icon
                    icon={item.status === "error" ? "solar:danger-triangle-linear" : "solar:soundwave-linear"}
                    className="h-4 w-4"
                  />
                </div>
              )}

              <Link href={`/p/${item.id}`} className="min-w-0 flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <p className="truncate text-body-sm font-medium text-contrast transition-colors group-hover:text-accent">
                  {label}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption-md text-text-muted">
                  {item.status !== "done" ? <StatusDot status={item.status} /> : null}
                  <span title={formatDate(item.createdAt, locale)}>{timeAgo(item.createdAt, locale)}</span>
                  {item.durationMs ? <span className="tabular-nums">{formatDuration(item.durationMs)}</span> : null}
                  {item.creditsUsed ? <span className="tabular-nums">{t("credits", { n: item.creditsUsed })}</span> : null}
                </div>
              </Link>

              {item.hasAudio ? (
                <a
                  href={apiUrl(`/audio/${item.id}/download?format=mp3`, token)}
                  className="hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-border-subtle text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:grid"
                  aria-label={t("actions.download", { title: label })}
                >
                  <Icon icon="solar:download-minimalistic-linear" className="h-4 w-4" />
                </a>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      {pages > 1 && !compact ? (
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-caption-md text-text-muted">{t("pageOf", { page, pages, total })}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="grid h-9 w-9 place-items-center rounded-full border border-border-subtle text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-35"
              aria-label={t("actions.prev")}
            >
              <Icon icon="solar:alt-arrow-left-linear" className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border-subtle text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-35"
              aria-label={t("actions.next")}
            >
              <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
