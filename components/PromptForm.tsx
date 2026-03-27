"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
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
}

function buildDurationOptions(plan: string): DropdownOption[] {
  if (plan === "studio" || plan === "pro") {
    return [
      { value: "30s" },
      { value: "1min" },
      { value: "2min" },
    ];
  }
  // free
  return [
    { value: "30s" },
    { value: "1min", locked: true, lockBadge: "Pro" },
    { value: "2min", locked: true, lockBadge: "Pro" },
  ];
}

function buildPersonajesOptions(plan: string): DropdownOption[] {
  const all = ["1", "2", "3", "4", "5", "6", "7", "8"];
  if (plan === "studio") return all.map(v => ({ value: v }));
  if (plan === "pro") {
    return all.map(v => {
      const n = parseInt(v, 10);
      if (n <= 4) return { value: v };
      return { value: v, locked: true, lockBadge: "Studio" };
    });
  }
  // free
  return all.map(v => {
    const n = parseInt(v, 10);
    if (n <= 2) return { value: v };
    return { value: v, locked: true, lockBadge: "Pro" };
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
    if (parts.length > 0) {
      return `${parts.join(" ")} ${prompt.trim()}`;
    }
    return prompt.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError("");
    sessionStorage.setItem("sonificalabs_choose_voices", chooseVoices ? "1" : "0");
    try {
      await onSubmit(buildPrompt());
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

        {/* Textarea area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 3500))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={3500}
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

          {prompt.length > 2800 && (
            <span className={`absolute bottom-1 right-3 text-[10px] font-mono ${prompt.length >= 3500 ? "text-red-400" : "text-contrast/30"}`}>
              {prompt.length}/3500
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
                {(plan === "pro" || plan === "studio") && (
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
              disabled={!prompt.trim() || isLoading || rateLimitCountdown > 0}
              whileHover={prompt.trim() && !isLoading ? { scale: 1.1 } : {}}
              whileTap={prompt.trim() && !isLoading ? { scale: 0.9 } : {}}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-xl shrink-0",
                "transition-all duration-300",
                prompt.trim() && !isLoading
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

    </form>
  );
}
