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
  isAdmin?: boolean;
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

function DebugDropdown({
  adminClaude, setAdminClaude, adminTts, setAdminTts, labels,
}: {
  adminClaude: string; setAdminClaude: (v: string) => void;
  adminTts: string; setAdminTts: (v: string) => void;
  labels: { debugClaudeModel: string; debugTtsModel: string; debugPlanDefault: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasOverride = !!(adminClaude || adminTts);

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
          "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors",
          hasOverride
            ? "bg-red-400/15 text-red-400 border border-red-400/25"
            : "text-contrast/70 hover:text-contrast hover:bg-contrast/[0.06] border border-transparent",
        )}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135 3.22 3.22 0 00-2.165-2.948A24.84 24.84 0 0012 4.5a24.84 24.84 0 00-4.89.607 3.22 3.22 0 00-2.165 2.948 23.91 23.91 0 01-1.152 6.135c2.56-.932 5.324-1.44 8.207-1.44zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 019.75 10.125v-1.5z" /></svg>
        Debug
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
            className="absolute bottom-full mb-1.5 left-0 min-w-[220px] rounded-xl border border-contrast/[0.08] bg-white/95 backdrop-blur-xl shadow-xl p-3 z-[var(--z-dropdown)] space-y-3"
          >
            <div>
              <label className="block text-[10px] text-text-muted font-mono uppercase tracking-wider mb-1">{labels.debugClaudeModel}</label>
              <select
                value={adminClaude}
                onChange={(e) => {
                  setAdminClaude(e.target.value);
                  if (e.target.value) localStorage.setItem("sonificalabs_admin_model", e.target.value);
                  else localStorage.removeItem("sonificalabs_admin_model");
                }}
                className="w-full text-xs bg-surface-0/60 border border-contrast/[0.08] rounded-lg px-2.5 py-1.5 text-text-primary font-mono cursor-pointer hover:border-contrast/[0.15] transition-colors focus:outline-none"
              >
                <option value="">{labels.debugPlanDefault}</option>
                <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
                <option value="claude-sonnet-4-6">Sonnet 4.6</option>
                <option value="claude-opus-4-6">Opus 4.6</option>
                <option value="grok-3">Grok 3</option>
                <option value="grok-4-1-fast-reasoning">Grok 4.1 Fast</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-text-muted font-mono uppercase tracking-wider mb-1">{labels.debugTtsModel}</label>
              <select
                value={adminTts}
                onChange={(e) => {
                  setAdminTts(e.target.value);
                  if (e.target.value) localStorage.setItem("sonificalabs_admin_tts_model", e.target.value);
                  else localStorage.removeItem("sonificalabs_admin_tts_model");
                }}
                className="w-full text-xs bg-surface-0/60 border border-contrast/[0.08] rounded-lg px-2.5 py-1.5 text-text-primary font-mono cursor-pointer hover:border-contrast/[0.15] transition-colors focus:outline-none"
              >
                <option value="">{labels.debugPlanDefault}</option>
                <option value="eleven_flash_v2_5">Flash v2.5</option>
                <option value="eleven_v3">Eleven v3</option>
                <option value="eleven_turbo_v2_5">Turbo v2.5</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  onLockedClick,
  removeLabel = "Quitar",
}: {
  label: string;
  icon: React.ReactNode;
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  onLockedClick?: () => void;
  removeLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
          "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors",
          value
            ? "bg-accent/15 text-accent border border-accent/25"
            : "text-contrast/70 hover:text-contrast hover:bg-contrast/[0.06] border border-transparent",
        )}
      >
        {icon}
        {value || label}
        <svg
          className={cn(
            "w-3 h-3 transition-transform",
            open && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1.5 left-0 min-w-[120px] rounded-xl border border-contrast/[0.08] bg-white/95 backdrop-blur-xl shadow-xl py-1 z-[var(--z-dropdown)]"
          >
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:bg-contrast/[0.06] transition-colors"
              >
                {removeLabel}
              </button>
            )}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (opt.locked) {
                    if (onLockedClick) onLockedClick();
                    return;
                  }
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-2",
                  opt.locked
                    ? "opacity-60 cursor-pointer hover:opacity-80"
                    : opt.value === value
                      ? "text-accent bg-accent/10"
                      : "text-text-primary hover:bg-contrast/[0.06]",
                )}
              >
                <span>{opt.value}</span>
                {opt.locked && opt.lockBadge && (
                  <span className={cn(
                    "text-[9px] px-1.5 rounded-full font-semibold",
                    opt.lockBadge === "Studio"
                      ? "bg-violet-500/20 text-violet-400"
                      : "bg-accent/20 text-accent",
                  )}>
                    {opt.lockBadge}
                  </span>
                )}
              </button>
            ))}
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
  const isAdmin = quota?.isAdmin ?? false;
  const durationOptions = buildDurationOptions(plan);
  const personajesOptions = buildPersonajesOptions(plan);

  // Admin model overrides (localStorage)
  const [adminClaude, setAdminClaude] = useState("");
  const [adminTts, setAdminTts] = useState("");
  useEffect(() => {
    if (!isAdmin) return;
    setAdminClaude(localStorage.getItem("sonificalabs_admin_model") || "");
    setAdminTts(localStorage.getItem("sonificalabs_admin_tts_model") || "");
  }, [isAdmin]);

  const [tipo, setTipo] = useState("");
  const [duracion, setDuracion] = useState("");
  const [personajes, setPersonajes] = useState("");

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
    if (e.key === "Enter" && !e.shiftKey) {
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
          "bg-surface-1/85 backdrop-blur-md",
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
            onChange={(e) => setPrompt(e.target.value)}
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
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between border-t border-contrast/[0.06] px-3 py-2 gap-2">
          {/* Left — dropdowns */}
          <div className="flex items-center gap-1.5">
            <ToolbarDropdown
              label={t("type")}
              icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
              options={TIPOS.map(tipo => ({ value: tipo }))}
              value={tipo}
              onChange={setTipo}
              removeLabel={t("remove")}
            />
            <ToolbarDropdown
              label={t("duration")}
              icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              options={durationOptions}
              value={duracion}
              onChange={setDuracion}
              removeLabel={t("remove")}
              onLockedClick={() => router.push("/pricing")}
            />
            <ToolbarDropdown
              label={t("characters")}
              icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
              options={personajesOptions}
              value={personajes}
              onChange={setPersonajes}
              removeLabel={t("remove")}
              onLockedClick={() => router.push("/pricing")}
            />
            {isAdmin && <DebugDropdown adminClaude={adminClaude} setAdminClaude={setAdminClaude} adminTts={adminTts} setAdminTts={setAdminTts} labels={{ debugClaudeModel: t("debugClaudeModel"), debugTtsModel: t("debugTtsModel"), debugPlanDefault: t("debugPlanDefault") }} />}
          </div>

          {/* Right — counter + submit */}
          <div className="flex items-center gap-3">
            {remaining === null ? (
              session
                ? <span className="hidden sm:block h-4 w-16 rounded bg-contrast/[0.06] animate-pulse" />
                : <span className="text-[11px] text-contrast/50 whitespace-nowrap hidden sm:flex items-center gap-1.5">
                    {t("credits", { count: 20 })}
                  </span>
            ) : remaining > 0 ? (
              <span className="text-[11px] text-contrast/50 whitespace-nowrap hidden sm:flex items-center gap-1.5">
                {(plan === "pro" || plan === "studio") && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5 leading-none">
                    {plan}
                  </span>
                )}
                {t("credits", { count: remaining })}
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
                "flex items-center justify-center h-8 w-8 rounded-xl",
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
