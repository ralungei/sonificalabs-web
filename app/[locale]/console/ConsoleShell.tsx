"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { LogoIcon } from "@/components/Logo";

/**
 * Sections of the console.
 *
 * Audio generation is the only one today, but the shell is built as an app
 * chrome rather than a single page so new tools slot in as extra entries here
 * without touching the layout.
 */
interface NavItem {
  id: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "generator", href: "/console", icon: "solar:soundwave-bold" },
  { id: "history", href: "/console/history", icon: "solar:library-bold" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

interface Quota {
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  remaining: number;
}

function CreditsBlock({ quota }: { quota: Quota | null }) {
  const t = useTranslations("console");
  if (!quota) {
    return <div className="h-16 animate-pulse rounded-xl bg-surface-2/60" />;
  }
  const limit = Math.max(1, quota.creditsLimit);
  const left = Math.max(0, Math.min(quota.remaining, limit));
  const pct = (left / limit) * 100;
  const low = left <= limit * 0.15;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-0 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption-md font-medium uppercase tracking-wide text-text-muted">
          {t("stats.credits")}
        </span>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
          {PLAN_LABELS[quota.plan] ?? quota.plan}
        </span>
      </div>
      <p className="mt-1 text-body-md font-bold tabular-nums text-contrast">
        {left}
        <span className="text-caption-md font-normal text-text-muted"> / {quota.creditsLimit}</span>
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn("h-full rounded-full transition-all duration-500", low ? "bg-fail" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {low && (
        <Link href="/pricing" className="mt-2 inline-block text-[11px] font-medium text-accent hover:underline">
          {t("stats.upgrade")}
        </Link>
      )}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("console");
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        // /console must not stay highlighted while a deeper section is open.
        const active = item.href === "/console" ? pathname === "/console" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-label-md transition-colors",
              active
                ? "bg-accent/10 font-medium text-accent"
                : "text-text-secondary hover:bg-contrast/[0.04] hover:text-contrast",
            )}
          >
            <Icon icon={item.icon} className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-text-muted")} />
            {t(`nav.${item.id}`)}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ quota, onNavigate }: { quota: Quota | null; onNavigate?: () => void }) {
  const t = useTranslations("console");
  const { data: session } = useSession();

  return (
    <>
      <div className="px-3 pb-5 pt-1">
        <Link href="/" onClick={onNavigate} aria-label="SonificaLabs">
          <span className="flex items-center gap-1.5 select-none">
            <LogoIcon className="h-6 w-auto text-contrast" />
            <span className="text-label-lg leading-none">
              <span className="font-bold text-contrast">sonifica</span><span className="font-light text-contrast">labs</span>
            </span>
          </span>
        </Link>
      </div>

      <div className="px-3">
        <Link
          href="/console"
          onClick={onNavigate}
          className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-label-md font-medium text-white transition-all hover:bg-accent-bright hover:shadow-[var(--shadow-glow-sm)]"
        >
          <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4" />
          {t("newProduction")}
        </Link>
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="mt-auto flex flex-col gap-3 p-3">
        <CreditsBlock quota={quota} />
        <div className="flex items-center gap-2 rounded-xl px-1 py-1">
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-accent/20 text-label-sm font-semibold text-accent">
              {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-sm text-contrast">{session?.user?.name}</p>
          </div>
          <Link
            href="/account"
            onClick={onNavigate}
            aria-label={t("nav.account")}
            className="grid h-7 w-7 place-items-center rounded-lg text-text-muted transition-colors hover:bg-contrast/[0.06] hover:text-contrast"
          >
            <Icon icon="solar:settings-linear" className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label={t("nav.signOut")}
            className="grid h-7 w-7 place-items-center rounded-lg text-text-muted transition-colors hover:bg-contrast/[0.06] hover:text-contrast"
          >
            <Icon icon="solar:logout-2-linear" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("console");
  const apiToken = useApiToken();
  const pathname = usePathname();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setQuota(d))
      .catch(() => {});
  }, [apiToken]);

  // Navigating on mobile should not leave the drawer covering the page.
  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-surface-1">
      {/* Sidebar, fixed on desktop */}
      <aside className="fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-60 flex-col border-r border-border-subtle bg-surface-1 py-4 lg:flex">
        <SidebarContent quota={quota} />
      </aside>

      {/* Drawer, mobile */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
              className="fixed inset-y-0 left-0 z-[var(--z-mobile-menu)] flex w-64 flex-col border-r border-border-subtle bg-surface-1 py-4 lg:hidden"
            >
              <SidebarContent quota={quota} onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-3 border-b border-border-subtle bg-surface-1/85 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("openMenu")}
            className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-contrast/[0.06]"
          >
            <Icon icon="solar:hamburger-menu-linear" className="h-5 w-5" />
          </button>
          <LogoIcon className="h-5 w-auto text-contrast" />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
