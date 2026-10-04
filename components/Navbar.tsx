"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { LogoIcon } from "@/components/Logo";
import { cn } from "@/lib/cn";

const PLAN_LABELS: Record<string, { label: string; style: string }> = {
  free: { label: "Free", style: "bg-contrast/[0.06] text-text-secondary" },
  starter: { label: "Starter", style: "bg-sky text-sky-ink" },
  pro: { label: "Pro", style: "bg-mint text-accent-dim" },
  studio: { label: "Studio", style: "bg-violet-100 text-violet-700" },
};

interface QuotaData {
  plan: string;
  remaining: number;
  creditsLimit: number;
}

export function Wordmark({ size = 21 }: { size?: number }) {
  return (
    <span className="flex select-none items-center gap-2">
      <LogoIcon className="w-auto text-ink" style={{ height: Math.round(size * 1.15) }} />
      <span className="font-semibold leading-none text-ink" style={{ fontSize: size, letterSpacing: "-0.04em" }}>
        sonifica<span className="font-light">labs</span>
      </span>
    </span>
  );
}

/**
 * Site header. `home` floats over the landing hero with in-page anchors;
 * every other page gets a sticky white bar with a "Crear audio" button.
 * `overlay` keeps the page links but floats too, for full-screen views.
 */
export function Navbar({ variant = "page", overlay = false }: { variant?: "home" | "page"; overlay?: boolean }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const apiToken = useApiToken();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const home = variant === "home";

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.plan) setQuota(data); })
      .catch(() => {});
  }, [apiToken]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Anchors on the landing scroll in place; elsewhere they go to the landing.
  const anchor = (id: string) => (e: React.MouseEvent) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const linkCls = "text-base font-medium tracking-[-0.02em] text-ink transition-colors hover:text-accent";
  const active = (href: string) => (pathname === href ? "text-accent" : "");

  const links = home ? (
    <>
      <Link href="/examples" className={linkCls}>{t("examples")}</Link>
      <a href="/#ideas" onClick={anchor("ideas")} className={linkCls}>{t("ideas")}</a>
      <a href="/#empresas" onClick={anchor("empresas")} className={linkCls}>{t("business")}</a>
      <Link href="/about" className={linkCls}>{t("about")}</Link>
    </>
  ) : (
    <>
      <Link href="/examples" className={cn(linkCls, active("/examples"))}>{t("examples")}</Link>
      <Link href="/about" className={cn(linkCls, active("/about"))}>{t("about")}</Link>
    </>
  );

  const avatar = (sz: string) =>
    session?.user?.image ? (
      <img src={session.user.image} alt="" className={cn(sz, "rounded-full")} referrerPolicy="no-referrer" />
    ) : (
      <span className={cn(sz, "flex items-center justify-center rounded-full bg-mint text-sm font-semibold text-accent-dim")}>
        {session?.user?.name?.[0]?.toUpperCase() || "?"}
      </span>
    );

  return (
    <>
      <header
        className={cn(
          "left-0 right-0 top-0 z-[var(--z-dropdown)] flex items-center justify-between gap-5 px-[clamp(18px,3vw,40px)]",
          home || overlay
            ? "fixed py-[22px] bg-[linear-gradient(to_bottom,rgba(255,255,255,.92),rgba(255,255,255,0))]"
            : "sticky py-5 bg-white/90 backdrop-blur-[10px]",
        )}
      >
        <Link href="/" aria-label="sonificalabs"><Wordmark /></Link>

        <nav className="flex items-center gap-[clamp(16px,3.4vw,48px)]">
          <div className="hidden items-center gap-[clamp(16px,3.4vw,48px)] md:flex">{links}</div>

          {status === "loading" ? (
            <span className="hidden h-9 w-9 animate-pulse rounded-full bg-contrast/[0.06] md:block" />
          ) : session?.user ? (
            <>
            {/* Signed-in users get a direct way into the app: the marketing
                page is not where their work lives. */}
            <Link href="/console" className={cn(linkCls, "hidden md:inline", active("/console"))}>{t("myProductions")}</Link>
            <div ref={menuRef} className="relative hidden md:block">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={t("myAccount")}
                className="flex items-center rounded-full p-0.5 transition-colors hover:bg-contrast/[0.06]">
                {avatar("h-9 w-9")}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-60 rounded-[21px] border border-contrast/[0.07] bg-white py-1.5 shadow-[0_30px_60px_-30px_rgba(15,42,46,.45)]"
                  >
                    <div className="border-b border-contrast/[0.06] px-4 py-3">
                      <p className="truncate text-sm text-text-secondary">{session.user.email}</p>
                      {quota && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", PLAN_LABELS[quota.plan]?.style ?? PLAN_LABELS.free.style)}>
                            {PLAN_LABELS[quota.plan]?.label ?? quota.plan}
                          </span>
                          <span className="text-xs text-text-muted">{quota.remaining} / {quota.creditsLimit} {t("credits")}</span>
                        </div>
                      )}
                    </div>
                    <Link href="/console" className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-2">{t("myProductions")}</Link>
                    <Link href="/account" className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-2">{t("myAccount")}</Link>
                    <Link href="/pricing" className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-2">{t("manageSubscription")}</Link>
                    <button type="button" onClick={() => signOut()} className="block w-full px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-surface-2">
                      {t("signOut")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <Link href="/signin" className={cn(linkCls, "hidden border-b border-current pb-[3px] md:inline")}>{t("enter")}</Link>
          )}

          {!home && (
            <Link href="/" className="hidden h-11 items-center rounded-full bg-ink px-[18px] text-base font-medium tracking-[-0.02em] text-white transition-colors hover:bg-accent md:flex">
              {t("createAudio")}
            </Link>
          )}

          <button type="button" onClick={() => setMobileOpen(true)} aria-label={t("menu")}
            className="flex h-[46px] w-[46px] flex-col items-center justify-center gap-[5px] rounded-full bg-ink transition-colors hover:bg-accent md:hidden">
            <span className="h-[1.5px] w-4 bg-white" />
            <span className="h-[1.5px] w-4 bg-white" />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-ink/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-[var(--z-mobile-menu)] flex w-[min(320px,86vw)] flex-col bg-white md:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <Wordmark size={18} />
                <button type="button" onClick={() => setMobileOpen(false)} aria-label={t("close")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-contrast/10 text-ink">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex flex-col gap-1 px-3 pt-2 text-xl font-medium tracking-[-0.03em]">
                <Link href="/" onClick={() => setMobileOpen(false)} className="rounded-2xl px-3 py-3 hover:bg-surface-2">{t("createAudio")}</Link>
                {session?.user && (
                  <Link href="/console" onClick={() => setMobileOpen(false)} className="rounded-2xl px-3 py-3 hover:bg-surface-2">{t("myProductions")}</Link>
                )}
                <Link href="/examples" onClick={() => setMobileOpen(false)} className="rounded-2xl px-3 py-3 hover:bg-surface-2">{t("examples")}</Link>
                <a href="/#ideas" onClick={anchor("ideas")} className="rounded-2xl px-3 py-3 hover:bg-surface-2">{t("ideas")}</a>
                <a href="/#empresas" onClick={anchor("empresas")} className="rounded-2xl px-3 py-3 hover:bg-surface-2">{t("business")}</a>
                <Link href="/pricing" onClick={() => setMobileOpen(false)} className="rounded-2xl px-3 py-3 hover:bg-surface-2">{t("pricing")}</Link>
                <Link href="/about" onClick={() => setMobileOpen(false)} className="rounded-2xl px-3 py-3 hover:bg-surface-2">{t("about")}</Link>
              </div>
              <div className="mt-auto border-t border-contrast/[0.06] px-5 py-5">
                <div className="mb-4 flex gap-2">
                  {locales.map((l) => (
                    <button key={l} type="button"
                      onClick={() => { router.replace(pathname, { locale: l }); setMobileOpen(false); }}
                      className={cn("h-9 rounded-full px-4 text-sm font-medium", l === locale ? "bg-ink text-white" : "border border-contrast/10 text-ink")}>
                      {l === "es" ? "Español" : "English"}
                    </button>
                  ))}
                </div>
                {session?.user ? (
                  <>
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="mb-2 flex items-center gap-3 rounded-2xl p-2 hover:bg-surface-2">
                      {avatar("h-9 w-9")}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{session.user.name}</span>
                        <span className="block truncate text-xs text-text-muted">{session.user.email}</span>
                      </span>
                    </Link>
                    <button type="button" onClick={() => { signOut(); setMobileOpen(false); }}
                      className="w-full rounded-full border border-contrast/10 py-2.5 text-sm font-medium text-ink">
                      {t("signOut")}
                    </button>
                  </>
                ) : (
                  <Link href="/signin" onClick={() => setMobileOpen(false)}
                    className="flex h-12 items-center justify-center rounded-full bg-ink text-base font-medium text-white">
                    {t("enter")}
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
