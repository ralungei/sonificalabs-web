"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { Icon } from "@iconify/react";

const PLAN_LABELS: Record<string, { label: string; style: string }> = {
  free: { label: "Free", style: "bg-contrast/[0.08] text-text-secondary" },
  starter: { label: "Starter", style: "bg-blue-500/20 text-blue-400" },
  pro: { label: "Pro", style: "bg-accent/20 text-accent" },
  studio: { label: "Studio", style: "bg-violet-500/20 text-violet-400" },
};

interface QuotaData {
  plan: string;
  remaining: number;
  creditsLimit: number;
  isAdmin?: boolean;
}

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const apiToken = useApiToken();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.plan) setQuota(data); })
      .catch(() => {});
  }, [apiToken]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = (
    <>
      <a
        href="/#como-funciona"
        onClick={(e) => {
          const el = document.getElementById("como-funciona");
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: "smooth" });
          }
          setMobileOpen(false);
        }}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors leading-none"
      >
        {t("howItWorks")}
      </a>
      <Link
        href="/pricing"
        onClick={() => setMobileOpen(false)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors leading-none"
      >
        {t("pricing")}
      </Link>
      <Link
        href="/about"
        onClick={() => setMobileOpen(false)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors leading-none"
      >
        {t("about")}
      </Link>
    </>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[var(--z-dropdown)] flex items-center justify-between px-5 md:px-8 h-14 transition-[background-color,backdrop-filter] duration-300 ${scrolled ? "bg-surface-0/80 backdrop-blur-xl border-b border-contrast/[0.04]" : "bg-transparent border-b border-transparent"}`}
      >
        {/* Left: Logo + nav links */}
        <div className="flex items-baseline gap-8">
          <Link href="/" className="flex items-baseline gap-2 select-none">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-contrast self-center" fill="currentColor" aria-hidden>
              <path d="m20.713 7.128-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M7 6a5 5 0 0 1 7.697-4.21l-1.08 1.682A3 3 0 0 0 9 6v6a3 3 0 1 0 6 0V7h2v5a5 5 0 0 1-10 0zm-4.808 7.962 1.962-.393a8.003 8.003 0 0 0 15.692 0l1.962.393C20.896 18.545 16.852 22 12 22s-8.896-3.455-9.808-8.038" />
            </svg>
            <span className="text-lg font-brand tracking-[0.04em] leading-none">
              <span className="text-contrast">sonifica</span><span className="text-accent">labs</span>
            </span>
            <span className="text-[10px] text-contrast/80 leading-none -ml-1">by Ras</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-baseline gap-8">
            {navLinks}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Locale switcher */}
          <div ref={langRef} className="relative hidden md:block">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
            >
              {locale.toUpperCase()}
              <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-20 rounded-xl border border-contrast/[0.08] bg-surface-2/95 backdrop-blur-xl shadow-xl py-1 z-[var(--z-dropdown)]"
                >
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        router.replace(pathname, { locale: l });
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                        l === locale
                          ? "text-accent bg-accent/10"
                          : "text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06]"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {status === "loading" ? (
            <div className="hidden md:block h-8 w-8 rounded-full bg-contrast/[0.06] animate-pulse" />
          ) : session?.user ? (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center rounded-full transition-colors hover:bg-contrast/[0.06] p-0.5"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-semibold">
                    {session.user.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-contrast/[0.08] bg-surface-2/95 backdrop-blur-xl shadow-xl py-1 z-[var(--z-dropdown)]"
                  >
                    <div className="px-3 py-2.5 border-b border-contrast/[0.06]">
                      <p className="text-xs text-text-secondary truncate">{session.user.email}</p>
                      {quota && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAN_LABELS[quota.plan]?.style || "bg-contrast/[0.08] text-text-secondary"}`}>
                            {PLAN_LABELS[quota.plan]?.label || quota.plan}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {quota.remaining} / {quota.creditsLimit} {t("credits")}
                          </span>
                        </div>
                      )}
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      {t("myAccount")}
                    </Link>
                    <Link
                      href="/pricing"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      {t("pricing")}
                    </Link>
                    {quota?.isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                        </svg>
                        {t("admin")}
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      {t("signOut")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/signin"
              className="hidden md:inline-flex px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-surface-0 hover:bg-accent-bright transition-all duration-200 hover:shadow-[0_0_20px_rgba(232,168,56,0.3)]"
            >
              {t("signIn")}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-contrast/70 hover:text-contrast hover:bg-contrast/[0.06] transition-colors"
            aria-label="Menu"
          >
            <Icon icon={mobileOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile side panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[var(--z-mobile-menu)] w-64 bg-surface-1/95 backdrop-blur-xl border-l border-contrast/[0.06] flex flex-col md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-contrast/[0.06]">
                <span className="text-sm font-body font-semibold text-contrast/80">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-contrast/50 hover:text-contrast hover:bg-contrast/[0.06] transition-all"
                >
                  <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex flex-col gap-1 px-3 py-4">
                <a
                  href="/#como-funciona"
                  onClick={(e) => {
                    setMobileOpen(false);
                    const el = document.getElementById("como-funciona");
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-body text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                >
                  <Icon icon="solar:lightbulb-bolt-linear" className="h-5 w-5 text-contrast/40" />
                  {t("howItWorks")}
                </a>
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-body text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                >
                  <Icon icon="solar:tag-price-linear" className="h-5 w-5 text-contrast/40" />
                  {t("pricing")}
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-body text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                >
                  <Icon icon="solar:users-group-rounded-linear" className="h-5 w-5 text-contrast/40" />
                  {t("about")}
                </Link>

              </div>

              {/* Language + User section at bottom */}
              <div className="mt-auto border-t border-contrast/[0.06] px-3 py-4">
                <div className="pb-3 mb-3 border-b border-contrast/[0.06] px-3">
                  <div className="relative">
                    <Icon icon="solar:global-linear" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-contrast/40 pointer-events-none" />
                    <select
                      value={locale}
                      onChange={(e) => {
                        router.replace(pathname, { locale: e.target.value });
                        setMobileOpen(false);
                      }}
                      className="w-full appearance-none bg-surface-0/60 border border-contrast/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-sm font-body text-text-primary focus:outline-none focus:border-accent/30 transition-colors cursor-pointer"
                    >
                      {locales.map((l) => (
                        <option key={l} value={l}>
                          {l === "es" ? "Español" : "English"}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-contrast/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
                {session?.user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl hover:bg-contrast/[0.06] transition-colors"
                    >
                      {session.user.image ? (
                        <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-semibold">
                          {session.user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-text-primary truncate">{session.user.name}</p>
                        <p className="text-xs text-text-muted truncate">{session.user.email}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileOpen(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-body text-text-secondary hover:text-text-primary hover:bg-contrast/[0.06] transition-colors"
                    >
                      <Icon icon="solar:logout-2-linear" className="h-5 w-5 text-contrast/40" />
                      {t("signOut")}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-accent text-surface-0 text-sm font-body font-semibold transition-all hover:bg-accent-bright"
                  >
                    {t("signIn")}
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
