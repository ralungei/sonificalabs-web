"use client";
import { useState, useRef, useEffect, useImperativeHandle, useCallback, type Ref } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { ATTACH_ACCEPT, extractText, UnsupportedFileError } from "@/lib/extract-text";
import { ArrowDot, Close, Paperclip } from "@/components/site/ui";

interface DropdownOption {
  value: string;
  locked?: boolean;
  lockBadge?: string;
}

interface QuotaData {
  plan: string;
  remaining: number;
  creditsUsed: number;
  creditsLimit: number;
  maxDuration: number;
  maxVoices: number;
  maxPromptChars?: number;
}

// Mirrors PLAN_CONFIG in the API. Ordered cheapest first: "starter" used to be
// missing here, so paying Starter users saw their own limits locked behind Pro.
const PLAN_TIERS = [
  { plan: "free", label: "Free", maxDuration: 30, maxVoices: 2 },
  { plan: "starter", label: "Starter", maxDuration: 60, maxVoices: 3 },
  { plan: "pro", label: "Pro", maxDuration: 300, maxVoices: 4 },
  { plan: "studio", label: "Studio", maxDuration: 600, maxVoices: 8 },
];

const DURATIONS = [
  { value: "30s", seconds: 30 },
  { value: "1min", seconds: 60 },
  { value: "2min", seconds: 120 },
  { value: "3min", seconds: 180 },
  { value: "5min", seconds: 300 },
  { value: "10min", seconds: 600 },
];

const PERSONAJES = ["1", "2", "3", "4", "5", "6", "7", "8"];

/** Text the textarea grows to before it scrolls (rows of 26px). */
const MAX_ROWS = 3;

function tierFor(plan: string) {
  return PLAN_TIERS.find(t => t.plan === plan) ?? PLAN_TIERS[0];
}

function buildDurationOptions(plan: string): DropdownOption[] {
  const current = tierFor(plan);
  return DURATIONS.map(({ value, seconds }) => {
    if (seconds <= current.maxDuration) return { value };
    // Badge the cheapest plan that really unlocks it, not a blanket "Pro"
    const unlocks = PLAN_TIERS.find(t => t.maxDuration >= seconds);
    return { value, locked: true, lockBadge: unlocks?.label ?? "Studio" };
  });
}

function buildPersonajesOptions(plan: string): DropdownOption[] {
  const current = tierFor(plan);
  return PERSONAJES.map((value) => {
    const n = parseInt(value, 10);
    if (n <= current.maxVoices) return { value };
    const unlocks = PLAN_TIERS.find(t => t.maxVoices >= n);
    return { value, locked: true, lockBadge: unlocks?.label ?? "Studio" };
  });
}

function OptionPills({
  options,
  value,
  onChange,
  onLockedClick,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  onLockedClick?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            if (opt.locked) { onLockedClick?.(); return; }
            onChange(opt.value === value ? "" : opt.value);
          }}
          className={cn(
            "rounded-full px-3 py-1 text-[13px] font-medium transition-all",
            opt.locked
              ? "cursor-pointer border border-contrast/[0.08] text-text-muted opacity-60 hover:opacity-80"
              : opt.value === value
                ? "bg-ink text-white"
                : "border border-contrast/10 text-ink hover:border-ink",
          )}
        >
          <span className="flex items-center gap-1.5">
            {opt.value}
            {opt.locked && opt.lockBadge && (
              <span className={cn(
                "rounded-full px-1.5 text-[9px] font-semibold leading-tight",
                opt.lockBadge === "Studio" ? "bg-violet-100 text-violet-700" : "bg-mint text-accent-dim",
              )}>
                {opt.lockBadge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function ParametersPopover({
  tipo, setTipo, duracion, setDuracion, personajes, setPersonajes,
  chooseVoices, setChooseVoices,
  tipos, durationOptions, personajesOptions,
  onLockedClick, labels,
}: {
  tipo: string; setTipo: (v: string) => void;
  duracion: string; setDuracion: (v: string) => void;
  personajes: string; setPersonajes: (v: string) => void;
  chooseVoices: boolean; setChooseVoices: (v: boolean) => void;
  tipos: string[];
  durationOptions: DropdownOption[];
  personajesOptions: DropdownOption[];
  onLockedClick: () => void;
  labels: { type: string; duration: string; characters: string; parameters: string; voices: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCount = [tipo, duracion, personajes].filter(Boolean).length + (chooseVoices ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
          activeCount > 0 ? "bg-ink text-white" : "border border-contrast/10 bg-white/80 text-ink hover:border-ink",
        )}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        {labels.parameters}
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold leading-none text-ink">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full z-[var(--z-dropdown)] mt-2 w-[min(340px,86vw)] -translate-x-1/2 space-y-3.5 rounded-[21px] border border-contrast/[0.07] bg-white p-4 text-left shadow-[0_30px_60px_-30px_rgba(15,42,46,.45)]"
          >
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-text-muted">{labels.type}</label>
              <OptionPills options={tipos.map(t => ({ value: t }))} value={tipo} onChange={setTipo} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-text-muted">{labels.duration}</label>
              <OptionPills options={durationOptions} value={duracion} onChange={setDuracion} onLockedClick={onLockedClick} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-text-muted">{labels.characters}</label>
              <OptionPills options={personajesOptions} value={personajes} onChange={setPersonajes} onLockedClick={onLockedClick} />
            </div>
            <div className="flex items-center justify-between border-t border-contrast/[0.06] pt-3">
              <label className="text-xs font-semibold uppercase tracking-[.08em] text-text-muted">{labels.voices}</label>
              <button
                type="button"
                role="switch"
                aria-checked={chooseVoices}
                onClick={() => setChooseVoices(!chooseVoices)}
                className={cn(
                  "relative flex h-[22px] w-10 items-center rounded-full px-[3px] transition-colors duration-200",
                  chooseVoices ? "justify-end bg-accent" : "justify-start bg-contrast/15",
                )}
              >
                <span className="block h-4 w-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A long paste or an attached document, sent after the typed text. */
interface Chunk {
  text: string;
  /** File name; pastes have none. */
  name?: string;
}

export interface PromptFormHandle {
  /** Puts a prompt in the box (ideas, examples) and focuses it. */
  setPrompt: (prompt: string) => void;
  /** Fills the box and produces right away (bottom call to action). */
  submitWith: (prompt: string) => void;
}

export interface Suggestion {
  label: string;
  prompt: string;
  icon?: React.ReactNode;
}

export function PromptForm({
  onSubmit,
  suggestions,
  onActivityChange,
  className,
  showQuota = true,
  ref,
}: {
  /** `instruction` is only what the user typed, without tags or pasted cards. */
  onSubmit: (prompt: string, instruction: string) => Promise<void>;
  /** Extra classes for the outer form. */
  className?: string;
  /** Hide the plan badge and credit count on surfaces that already show them. */
  showQuota?: boolean;
  suggestions?: Suggestion[];
  /** True while the box is focused, has text or is producing. */
  onActivityChange?: (active: boolean) => void;
  ref?: Ref<PromptFormHandle>;
}) {
  const t = useTranslations("promptForm");
  const router = useRouter();
  const TIPOS = (t("tipos") as string).split(",");
  const { data: session, status: authStatus } = useSession();
  const apiToken = useApiToken();
  const [prompt, setPrompt] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [rows, setRows] = useState(1);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setQuota(data); })
      .catch(() => {});
  }, [apiToken]);

  const plan = quota?.plan ?? "free";
  const remaining = quota?.remaining ?? null;
  // Paid plans allow long-form prompts (scripts); free stays at 3500
  const maxPromptChars = quota?.maxPromptChars ?? 3500;

  // The quota round-trips after mount, so maxPromptChars is the free cap for a
  // moment even for paid users. Until it lands we let the server be the judge.
  const limitKnown = quota !== null || authStatus === "unauthenticated";

  // Long pastes collapse into attached cards instead of flooding the textarea
  const PASTE_CARD_THRESHOLD = 1000;
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [viewerChunk, setViewerChunk] = useState<number | null>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.length < PASTE_CARD_THRESHOLD) return;
    e.preventDefault();
    // Never trim on paste: the quota may still be in flight and a paid user
    // would silently lose most of a long script. Submit enforces the limit.
    setChunks((prev) => [...prev, { text }]);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAttaching(true);
    setError("");
    try {
      const text = await extractText(file);
      if (!text) throw new Error(t("attachEmpty"));
      setChunks((prev) => [...prev, { text, name: file.name }]);
      // A document with no instruction becomes the design's default idea.
      setPrompt((p) => p || t("attachDefaultPrompt"));
    } catch (err) {
      setError(err instanceof UnsupportedFileError ? t("attachUnsupported") : err instanceof Error && err.message ? err.message : t("attachFailed"));
    } finally {
      setAttaching(false);
    }
  };

  const removeChunk = (idx: number) => {
    setChunks((prev) => prev.filter((_, i) => i !== idx));
    setViewerChunk(null);
  };
  const durationOptions = buildDurationOptions(plan);
  const personajesOptions = buildPersonajesOptions(plan);

  const [tipo, setTipo] = useState("");
  const [duracion, setDuracion] = useState("");
  const [personajes, setPersonajes] = useState("");
  const [chooseVoices, setChooseVoices] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grows with the text up to MAX_ROWS, then scrolls
  const fit = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const n = Math.max(1, Math.min(MAX_ROWS, Math.round((ta.scrollHeight - 28) / 26)));
    ta.style.height = `${28 + 26 * n}px`;
    setRows(n);
  }, []);
  useEffect(() => { fit(); }, [prompt, fit]);

  useEffect(() => {
    onActivityChange?.(isFocused || isLoading || prompt.length > 0);
  }, [isFocused, isLoading, prompt, onActivityChange]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const buildPrompt = (typed: string) => {
    const parts: string[] = [];
    if (tipo) parts.push(`[Tipo: ${tipo}]`);
    if (duracion) parts.push(`[Duracion: ${duracion}]`);
    if (personajes) parts.push(`[Personajes: ${personajes}]`);
    const attached = chunks.length > 0 ? `\n\n${chunks.map(c => c.text).join("\n\n")}` : "";
    if (parts.length > 0) {
      return `${parts.join(" ")} ${typed.trim()}${attached}`;
    }
    return `${typed.trim()}${attached}`.trim();
  };

  // Count what is actually sent (separators and [Tipo: ...] prefix included) or
  // the client shows 3500/3500 while the server rejects 3550 with an upsell
  const outgoingPrompt = buildPrompt(prompt);
  const totalChars = outgoingPrompt.length;
  const overBy = totalChars - maxPromptChars;
  const isOverLimit = limitKnown && overBy > 0;
  // A paste with no typed text is a valid submission
  const hasContent = prompt.trim().length > 0 || chunks.length > 0;
  const canSubmit = hasContent && !isLoading && !isOverLimit && rateLimitCountdown === 0;

  const produce = async (text: string, instruction: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    sessionStorage.setItem("sonificalabs_choose_voices", chooseVoices ? "1" : "0");
    try {
      await onSubmit(text, instruction);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "RateLimitError") {
        const seconds = parseInt(err.message.replace("rate_limit:", ""), 10) || 30;
        setRateLimitCountdown(seconds);
        setError(t("rateLimitWait", { seconds }));
      } else {
        setError(err instanceof Error ? err.message : t("errorProducing"));
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // An empty box is an invitation, not an error: put the cursor in it.
    if (!hasContent) { textareaRef.current?.focus(); return; }
    if (!canSubmit) return;
    produce(outgoingPrompt, prompt.trim());
  };

  useImperativeHandle(ref, () => ({
    setPrompt: (p: string) => {
      setPrompt(p);
      setError("");
      requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
    },
    submitWith: (p: string) => {
      setPrompt(p);
      const text = buildPrompt(p);
      if (!text || rateLimitCountdown > 0) return;
      if (limitKnown && text.length > maxPromptChars) return;
      produce(text, p.trim());
    },
  }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Restore prompt from sessionStorage after returning from sign-in
  useEffect(() => {
    const saved = sessionStorage.getItem("sonificalabs_draft");
    if (saved) {
      setPrompt(saved);
      sessionStorage.removeItem("sonificalabs_draft");
    }
  }, []);

  const rounded = rows > 1 || chunks.length > 0 ? "rounded-[28px]" : "rounded-full";

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div
        className={cn(
          "border bg-white p-2 backdrop-blur-[10px] transition-[border-color,border-radius] duration-200",
          "shadow-[0_1px_2px_rgba(15,42,46,.06),0_24px_60px_-30px_rgba(15,42,46,.35)]",
          rounded,
          isFocused ? "border-accent" : "border-contrast/[0.12]",
        )}
      >
        {/* Long pastes and attached documents: a card with a preview of the text */}
        {chunks.length > 0 && (
          <div className="flex flex-wrap gap-3 px-2 pb-1 pt-2">
            {chunks.map((chunk, i) => (
              <div key={i} className="group relative">
                <button
                  type="button"
                  onClick={() => setViewerChunk(i)}
                  className="flex h-28 w-28 flex-col overflow-hidden rounded-[14px] border border-contrast/[0.08] bg-surface-2/90 text-left transition-all hover:border-accent/40 hover:shadow-sm"
                >
                  <div className="flex-1 overflow-hidden px-2 pt-2">
                    <p className="m-0 select-none whitespace-pre-wrap break-words font-mono text-[7px] leading-[1.5] text-text-muted">
                      {chunk.text.slice(0, 480)}
                    </p>
                  </div>
                  <div className="shrink-0 truncate border-t border-contrast/[0.08] bg-white/80 px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                    {chunk.name ?? t("pastedLabel")}
                  </div>
                </button>
                {/* Remove: always visible on touch, revealed on hover with a pointer */}
                <button
                  type="button"
                  aria-label={t("removePasted")}
                  onClick={() => removeChunk(i)}
                  className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-contrast/[0.08] bg-white text-text-muted opacity-100 shadow-sm transition-opacity hover:text-fail focus:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                >
                  <Close size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-[5px]">
          <label
            title={t("attach")}
            aria-label={t("attachAria")}
            className={cn(
              "flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-accent",
              (attaching || isLoading) && "pointer-events-none opacity-50",
            )}
          >
            <input type="file" accept={ATTACH_ACCEPT} onChange={handleAttach} className="sr-only" disabled={attaching || isLoading} />
            {attaching ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-contrast/15 border-t-accent" />
            ) : (
              <Paperclip size={22} />
            )}
          </label>

          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={t("heroPlaceholder")}
            aria-label={t("heroPlaceholder")}
            disabled={isLoading}
            className={cn(
              "block min-w-0 flex-1 resize-none border-0 bg-transparent py-[14px] text-[clamp(17px,1.4vw,20px)] leading-[26px] tracking-[-0.02em] text-ink outline-none placeholder:text-text-muted",
              rows >= MAX_ROWS ? "overflow-y-auto" : "overflow-hidden",
            )}
            style={{ height: 54, transition: "height .28s cubic-bezier(.2,.7,.2,1)" }}
          />

          <button
            type="submit"
            disabled={isLoading || isOverLimit || rateLimitCountdown > 0}
            aria-label={t("create")}
            className={cn(
              "flex h-14 shrink-0 items-center gap-[13px] rounded-full bg-ink pr-2 text-base font-medium tracking-[-0.02em] text-white transition-colors",
              "pl-2 sm:pl-6",
              isOverLimit || rateLimitCountdown > 0 ? "cursor-not-allowed opacity-40" : "hover:bg-accent",
            )}
          >
            <span className="hidden sm:inline">{isLoading ? t("creating") : t("create")}</span>
            {isLoading ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
              </span>
            ) : (
              <ArrowDot size={40} />
            )}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mx-auto mt-3.5 h-0.5 max-w-[640px] overflow-hidden rounded-sm bg-contrast/15" aria-hidden>
          <motion.div className="h-full w-1/3 bg-ink" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      )}

      {/* Options and credits */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <ParametersPopover
          tipo={tipo} setTipo={setTipo}
          duracion={duracion} setDuracion={setDuracion}
          personajes={personajes} setPersonajes={setPersonajes}
          chooseVoices={chooseVoices} setChooseVoices={setChooseVoices}
          tipos={TIPOS}
          durationOptions={durationOptions}
          personajesOptions={personajesOptions}
          onLockedClick={() => router.push("/pricing")}
          labels={{ type: t("type"), duration: t("duration"), characters: t("characters"), parameters: t("parameters"), voices: t("voices") }}
        />
        {showQuota && (remaining === null ? (
          session
            ? <span className="h-4 w-16 animate-pulse rounded bg-contrast/[0.06]" />
            : <span className="text-sm text-text-muted">{t("credits", { count: 20 })}</span>
        ) : remaining > 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-text-muted">
            {(plan === "starter" || plan === "pro" || plan === "studio") && (
              <span className="rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-dim">{plan}</span>
            )}
            {t("credits", { count: remaining })}
          </span>
        ) : (
          <button type="button" onClick={() => router.push("/pricing")}
            className="h-9 rounded-full border border-accent/30 px-3.5 text-sm font-medium text-accent hover:bg-accent/10">
            {t("upgradePlan")}
          </button>
        ))}
        {totalChars > 2800 && (
          <span className={cn("text-xs tabular-nums", isOverLimit ? "text-fail" : "text-text-muted")}>
            {limitKnown ? `${totalChars}/${maxPromptChars}` : totalChars}
          </span>
        )}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="no-scrollbar mx-auto mt-[clamp(14px,2.4vh,24px)] flex w-fit max-w-full gap-2 overflow-x-auto p-0.5"
          style={{ animation: "rise .8s .55s cubic-bezier(.2,.7,.2,1) both" }}>
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => { setPrompt(s.prompt); requestAnimationFrame(() => textareaRef.current?.focus()); }}
              className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-contrast/10 bg-white/80 pl-[13px] pr-4 text-sm font-medium text-ink backdrop-blur-[8px] transition-all hover:-translate-y-px hover:border-ink"
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Error / Rate limit countdown */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className={cn(
              "mx-auto mt-4 max-w-[640px] rounded-[21px] px-5 py-3 text-center text-[15px] font-medium",
              rateLimitCountdown > 0 ? "bg-surface-2 text-accent-dim" : "bg-fail/[0.07] text-fail",
            )}
          >
            {rateLimitCountdown > 0 ? t("rateLimitWait", { seconds: rateLimitCountdown }) : error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Over the limit the submit button is disabled, so say why and how to fix it */}
      <AnimatePresence>
        {isOverLimit && !error && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-4 max-w-[640px] rounded-[21px] bg-fail/[0.07] px-5 py-3 text-center text-[15px] font-medium text-fail"
          >
            {t("overLimit", { count: overBy, max: maxPromptChars })}
          </motion.p>
        )}
      </AnimatePresence>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {viewerChunk !== null && chunks[viewerChunk] != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
              onClick={() => setViewerChunk(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
                className="relative flex max-h-[75vh] w-full max-w-2xl flex-col rounded-[26px] bg-white shadow-[0_40px_80px_-36px_rgba(15,42,46,.45)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-contrast/[0.07] px-6 py-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-base font-medium text-ink">{chunks[viewerChunk].name ?? t("pastedContent")}</span>
                    <span className="text-xs text-text-muted">{t("pastedChars", { count: chunks[viewerChunk].text.length })}</span>
                  </div>
                  <button type="button" onClick={() => setViewerChunk(null)} aria-label={t("remove")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-contrast/10 text-ink hover:border-ink">
                    <Close size={11} />
                  </button>
                </div>
                <div className="overflow-y-auto whitespace-pre-wrap break-words px-6 py-5 text-sm leading-relaxed text-text-secondary">
                  {chunks[viewerChunk].text}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body)}
    </form>
  );
}
