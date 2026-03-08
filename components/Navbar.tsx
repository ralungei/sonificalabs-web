"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import { apiFetch } from "@/lib/api";

const PLAN_LABELS: Record<string, { label: string; style: string }> = {
  free: { label: "Free", style: "bg-white/[0.08] text-text-secondary" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    apiFetch("/user/quota")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.plan) setQuota(data); })
      .catch(() => {});
  }, [status]);

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

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-8 h-14 bg-transparent"
    >
      {/* Left: Logo + nav links */}
      <div className="flex items-baseline gap-5">
        <Link href="/" className="flex items-baseline gap-2 select-none">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white self-center" fill="currentColor" aria-hidden>
            <path d="m20.713 7.128-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M7 6a5 5 0 0 1 7.697-4.21l-1.08 1.682A3 3 0 0 0 9 6v6a3 3 0 1 0 6 0V7h2v5a5 5 0 0 1-10 0zm-4.808 7.962 1.962-.393a8.003 8.003 0 0 0 15.692 0l1.962.393C20.896 18.545 16.852 22 12 22s-8.896-3.455-9.808-8.038" />
          </svg>
          <span className="text-lg font-brand tracking-[0.04em] leading-none">
            <span className="text-white">sonifica</span><span className="text-accent">labs</span>
          </span>
        </Link>
        <a
          href="#como-funciona"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="hidden sm:inline ml-6 text-sm text-text-secondary hover:text-text-primary transition-colors leading-none"
        >
          {t("howItWorks")}
        </a>
        <Link
          href="/pricing"
          className="hidden sm:inline text-sm text-text-secondary hover:text-text-primary transition-colors leading-none"
        >
          {t("pricing")}
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Locale switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
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
                className="absolute right-0 top-full mt-1.5 w-20 rounded-xl border border-white/[0.08] bg-surface-2/95 backdrop-blur-xl shadow-xl py-1 z-50"
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
                        : "text-text-secondary hover:text-text-primary hover:bg-white/[0.06]"
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
          <div className="h-8 w-8 rounded-full bg-white/[0.06] animate-pulse" />
        ) : session?.user ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center rounded-full transition-colors hover:bg-white/[0.06] p-0.5"
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
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/[0.08] bg-surface-2/95 backdrop-blur-xl shadow-xl py-1 z-50"
                >
                  <div className="px-3 py-2.5 border-b border-white/[0.06]">
                    <p className="text-xs text-text-secondary truncate">{session.user.email}</p>
                    {quota && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAN_LABELS[quota.plan]?.style || "bg-white/[0.08] text-text-secondary"}`}>
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
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    {t("myAccount")}
                  </Link>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    {t("manageSubscription")}
                  </Link>
                  {quota?.isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                      </svg>
                      {t("admin")}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
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
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-surface-0 hover:bg-accent-bright transition-all duration-200 hover:shadow-[0_0_20px_rgba(232,168,56,0.3)]"
          >
            {t("signIn")}
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
