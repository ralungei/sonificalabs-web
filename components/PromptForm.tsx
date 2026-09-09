"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";

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
            "px-2.5 py-1 rounded-lg text-xs transition-all",
            opt.locked
              ? "opacity-50 cursor-pointer hover:opacity-70 border border-contrast/[0.08] text-text-secondary"
              : opt.value === value
                ? "bg-accent/15 text-accent border border-accent/25 font-medium"
                : "text-text-primary hover:bg-contrast/[0.06] border border-contrast/[0.08]",
          )}
        >
          <span className="flex items-center gap-1.5">
            {opt.value}
            {opt.locked && opt.lockBadge && (
              <span className={cn(
                "text-[9px] px-1 rounded-full font-semibold leading-tight",
                opt.lockBadge === "Studio"
                  ? "bg-violet-500/20 text-violet-400"
                  : "bg-accent/20 text-accent",
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
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors",
          activeCount > 0
            ? "bg-accent/15 text-accent border border-accent/25"
            : "text-contrast/70 hover:text-contrast hover:bg-contrast/[0.06] border border-transparent",
        )}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        {labels.parameters}
        {activeCount > 0 && (
          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-accent text-white text-[9px] font-bold leading-none">
            {activeCount}
          </span>
        )}
        <svg className={cn("w-3 h-3 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1.5 left-0 min-w-[240px] max-w-[320px] rounded-xl border border-contrast/[0.08] bg-white shadow-xl p-3 z-[var(--z-dropdown)] space-y-3"
          >
            {/* Tipo */}
            <div>
              <label className="block text-[10px] text-text-muted font-body uppercase tracking-wider mb-1.5">{labels.type}</label>
              <OptionPills options={tipos.map(t => ({ value: t }))} value={tipo} onChange={setTipo} />
            </div>
            {/* Duracion */}
            <div>
              <label className="block text-[10px] text-text-muted font-body uppercase tracking-wider mb-1.5">{labels.duration}</label>
              <OptionPills options={durationOptions} value={duracion} onChange={setDuracion} onLockedClick={onLockedClick} />
            </div>
            {/* Personajes */}
            <div>
              <label className="block text-[10px] text-text-muted font-body uppercase tracking-wider mb-1.5">{labels.characters}</label>
              <OptionPills options={personajesOptions} value={personajes} onChange={setPersonajes} onLockedClick={onLockedClick} />
            </div>
            {/* Choose voices toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-contrast/[0.06]">
              <label className="text-[10px] text-text-muted font-body uppercase tracking-wider">{labels.voices}</label>
              <button
                type="button"
                onClick={() => setChooseVoices(!chooseVoices)}
                className={cn(
                  "relative flex items-center w-8 h-[18px] rounded-full px-[2px] transition-colors duration-200",
                  chooseVoices ? "bg-accent justify-end" : "bg-contrast/15 justify-start",
                )}
              >
                <span className="block h-[14px] w-[14px] rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PromptForm({
  onSubmit,
}: {
  onSubmit: (prompt: string) => Promise<void>;
}) {
  const t = useTranslations("promptForm");
  const router = useRouter();
  const PLACEHOLDERS = t.raw("placeholders") as string[];
  const TIPOS = (t("tipos") as string).split(",");
  const { data: session, status: authStatus } = useSession();
  const apiToken = useApiToken();
  const [prompt, setPrompt] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [quota, setQuota] = useState<QuotaData | null>(null);

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
  const [pastedChunks, setPastedChunks] = useState<string[]>([]);
  const [viewerChunk, setViewerChunk] = useState<number | null>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.length < PASTE_CARD_THRESHOLD) return;
    e.preventDefault();
    // Never trim on paste: the quota may still be in flight and a paid user
    // would silently lose most of a long script. Submit enforces the limit.
    setPastedChunks((prev) => [...prev, text]);
  };

  const removeChunk = (idx: number) => {
    setPastedChunks((prev) => prev.filter((_, i) => i !== idx));
    setViewerChunk(null);
  };
  const durationOptions = buildDurationOptions(plan);
  const personajesOptions = buildPersonajesOptions(plan);

  const [tipo, setTipo] = useState("");
  const [duracion, setDuracion] = useState("");
  const [personajes, setPersonajes] = useState("");
  const [chooseVoices, setChooseVoices] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (isFocused || prompt) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isFocused, prompt]);

  const buildPrompt = () => {
    const parts: string[] = [];
    if (tipo) parts.push(`[Tipo: ${tipo}]`);
    if (duracion) parts.push(`[Duracion: ${duracion}]`);
    if (personajes) parts.push(`[Personajes: ${personajes}]`);
    const pasted = pastedChunks.length > 0 ? `\n\n${pastedChunks.join("\n\n")}` : "";
    if (parts.length > 0) {
      return `${parts.join(" ")} ${prompt.trim()}${pasted}`;
    }
    return `${prompt.trim()}${pasted}`.trim();
  };

  // Count what is actually sent (separators and [Tipo: ...] prefix included) or
  // the client shows 3500/3500 while the server rejects 3550 with an upsell
  const outgoingPrompt = buildPrompt();
  const totalChars = outgoingPrompt.length;
  const overBy = totalChars - maxPromptChars;
  const isOverLimit = limitKnown && overBy > 0;
  // A paste with no typed text is a valid submission
  const hasContent = prompt.trim().length > 0 || pastedChunks.length > 0;
  const canSubmit = hasContent && !isLoading && !isOverLimit && rateLimitCountdown === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent || isLoading) return;
    if (isOverLimit) return;
    setIsLoading(true);
    setError("");
    sessionStorage.setItem("sonificalabs_choose_voices", chooseVoices ? "1" : "0");
    try {
      await onSubmit(outgoingPrompt);
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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          "relative rounded-2xl border transition-all duration-500",
          "bg-surface-1/75 backdrop-blur-md",
          "border-border-subtle shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]",
        )}
      >
        {/* Top accent line on focus */}
        <div
          className={cn(
            "absolute top-0 left-4 right-4 h-px transition-opacity duration-500",
            "bg-gradient-to-r from-transparent via-accent/30 to-transparent",
            isFocused ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Pasted content cards (Claude-style: text preview + PASTED chip) */}
        {pastedChunks.length > 0 && (
          <div className="flex flex-wrap gap-3 px-4 pt-4">
            {pastedChunks.map((chunk, i) => (
              <div key={i} className="relative group">
                <button
                  type="button"
                  onClick={() => setViewerChunk(i)}
                  className="w-28 h-28 rounded-xl border border-border-subtle bg-surface-2/90 overflow-hidden text-left flex flex-col hover:border-accent/40 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 overflow-hidden px-2 pt-2">
                    <p className="text-[7px] leading-[1.5] font-mono text-text-muted whitespace-pre-wrap break-words select-none">
                      {chunk.slice(0, 480)}
                    </p>
                  </div>
                  <div className="shrink-0 px-2 py-1.5 bg-surface-1/80 border-t border-border-subtle">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted">
                      {t("pastedLabel")}
                    </span>
                  </div>
                </button>
                {/* Remove — always visible on touch, hover-revealed on pointer devices */}
                <button
                  type="button"
                  aria-label={t("removePasted")}
                  onClick={() => removeChunk(i)}
                  className="absolute -top-2 -left-2 h-6 w-6 rounded-full grid place-items-center bg-surface-0 border border-border-subtle shadow-sm text-text-muted hover:text-red-400 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            autoFocus
            rows={2}
            className="w-full bg-transparent px-5 pt-4 pb-3 text-text-primary placeholder-transparent outline-none text-base font-body resize-none"
            disabled={isLoading}
          />

          {/* Animated placeholder */}
          {!prompt && !isFocused && (
            <div className="pointer-events-none absolute top-4 left-5 right-5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholderIdx}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 0.7, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.35 }}
                  className="text-base text-contrast/60 block truncate"
                >
                  {PLACEHOLDERS[placeholderIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}

          {!prompt && isFocused && (
            <span className="pointer-events-none absolute top-4 left-5 text-base text-contrast/40">
              {t("describePlaceholder")}
            </span>
          )}

          {totalChars > 2800 && (
            <span className={`absolute bottom-1 right-3 text-[10px] font-mono ${isOverLimit ? "text-red-400" : "text-contrast/30"}`}>
              {limitKnown ? `${totalChars}/${maxPromptChars}` : totalChars}
            </span>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex flex-wrap items-center justify-between border-t border-contrast/[0.06] px-3 py-2 gap-2">
          {/* Left — parameters + debug */}
          <div className="flex items-center gap-1.5">
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
          </div>

          {/* Right — counter + submit */}
          <div className="flex items-center gap-3 ml-auto">
            {remaining === null ? (
              session
                ? <span className="h-4 w-16 rounded bg-contrast/[0.06] animate-pulse" />
                : <span className="text-[11px] text-contrast/50 whitespace-nowrap flex items-center gap-1.5">
                    <span className="font-bold">20 {t("creditsUnit")}</span>
                  </span>
            ) : remaining > 0 ? (
              <span className="text-[11px] text-contrast/50 whitespace-nowrap flex items-center gap-1.5">
                {(plan === "starter" || plan === "pro" || plan === "studio") && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5 leading-none">
                    {plan}
                  </span>
                )}
                <span className="font-bold">{remaining} {t("creditsUnit")}</span>
              </span>
            ) : (
              <button
                type="button"
                className="text-[11px] text-accent border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/10 transition-colors font-body whitespace-nowrap"
              >
                {t("upgradePlan")}
              </button>
            )}

            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.1 } : {}}
              whileTap={canSubmit ? { scale: 0.9 } : {}}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-xl shrink-0",
                "transition-all duration-300",
                canSubmit
                  ? "bg-accent text-white"
                  : "bg-contrast/5 text-contrast/25 cursor-not-allowed",
              )}
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="inline-block h-3.5 w-3.5 border-2 border-surface-0/20 border-t-surface-0 rounded-full"
                />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Error / Rate limit countdown */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-3 rounded-xl border px-4 py-3 text-sm text-center font-body",
              rateLimitCountdown > 0
                ? "border-accent/20 bg-accent/5 text-accent animate-pulse"
                : "border-fail/30 bg-fail/90 text-white",
            )}
          >
            {rateLimitCountdown > 0
              ? t("rateLimitWait", { seconds: rateLimitCountdown })
              : error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Over the limit the submit button is disabled, so say why and how to fix it */}
      <AnimatePresence>
        {isOverLimit && !error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl border border-fail/30 bg-fail/[0.06] px-4 py-3 text-sm text-center font-body text-fail"
          >
            {t("overLimit", { count: overBy, max: maxPromptChars })}
          </motion.div>
        )}
      </AnimatePresence>


      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {viewerChunk !== null && pastedChunks[viewerChunk] != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setViewerChunk(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
                className="relative w-full max-w-2xl max-h-[75vh] flex flex-col rounded-2xl bg-surface-0 border border-border-subtle shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle shrink-0">
                  <div className="flex flex-col">
                    <span className="text-label-md font-body font-semibold text-text-primary">
                      {t("pastedContent")}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {t("pastedChars", { count: pastedChunks[viewerChunk].length })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewerChunk(null)}
                    className="h-7 w-7 rounded-full grid place-items-center text-text-muted hover:text-text-primary hover:bg-contrast/[0.06] transition-all"
                  >
                    <Icon icon="solar:close-circle-linear" className="h-4.5 w-4.5" />
                  </button>
                </div>
                <div className="overflow-y-auto px-5 py-4 text-sm font-body text-text-secondary whitespace-pre-wrap break-words leading-relaxed">
                  {pastedChunks[viewerChunk]}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body)}
    </form>
  );
}
