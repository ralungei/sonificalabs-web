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
import { Wordmark } from "@/components/Navbar";

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
    return <div className="h-[92px] animate-pulse rounded-[18px] bg-surface-2/60" />;
  }
  const limit = Math.max(1, quota.creditsLimit);
  const left = Math.max(0, Math.min(quota.remaining, limit));
  const pct = (left / limit) * 100;
  const low = left <= limit * 0.15;

  return (
    <div className="rounded-[18px] bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-text-muted">
          {t("stats.credits")}
        </span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-accent-dim">
          {PLAN_LABELS[quota.plan] ?? quota.plan}
        </span>
      </div>
      <p className="mb-0 mt-1.5 text-[22px] font-medium tabular-nums tracking-[-0.035em] text-ink">
        {left}
        <span className="text-sm font-normal tracking-normal text-text-muted"> / {quota.creditsLimit}</span>
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className={cn("h-full rounded-full transition-all duration-500", low ? "bg-fail" : "bg-[linear-gradient(90deg,#0f766e,#2dd4bf)]")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {low && (
        <Link href="/pricing" className="mt-2.5 inline-block text-sm font-medium text-accent hover:underline">
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
    <nav className="flex flex-col gap-1">
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
              "group flex h-11 items-center gap-2.5 rounded-full px-4 text-[15px] font-medium tracking-[-0.02em] transition-colors",
              active
                ? "bg-ink text-white"
                : "text-text-secondary hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon icon={item.icon} className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#2dd4bf]" : "text-text-muted")} />
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
      <div className="px-6 pb-5 pt-1">
        <Link href="/" onClick={onNavigate} aria-label="SonificaLabs">
          <Wordmark size={19} />
        </Link>
      </div>

      <div className="px-3">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="mt-auto flex flex-col gap-3 p-3">
        <CreditsBlock quota={quota} />
        <div className="flex h-9 items-center gap-2 px-3">
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-mint text-xs font-semibold text-accent-dim">
              {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-medium text-ink">{session?.user?.name}</p>
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
    <div className="flex min-h-screen bg-white text-ink">
      {/* Sidebar, fixed on desktop */}
      <aside className="fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-64 flex-col border-r border-contrast/[0.06] bg-white py-5 lg:flex">
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
              className="fixed inset-0 z-[var(--z-overlay)] bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
              className="fixed inset-y-0 left-0 z-[var(--z-mobile-menu)] flex w-[min(288px,86vw)] flex-col bg-white py-5 lg:hidden"
            >
              <SidebarContent quota={quota} onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative flex min-w-0 flex-1 flex-col lg:pl-64">
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-[560px] w-[min(900px,100%)] bg-[radial-gradient(closest-side_at_70%_30%,rgba(45,212,191,.14),transparent)]" />
        <header className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-between gap-2 bg-white/90 px-[clamp(18px,3vw,40px)] py-4 backdrop-blur-[10px] lg:hidden">
          <Link href="/" aria-label="SonificaLabs">
            <Wordmark size={18} />
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("openMenu")}
            className="flex h-[46px] w-[46px] flex-col items-center justify-center gap-[5px] rounded-full bg-ink transition-colors hover:bg-accent"
          >
            <span className="h-[1.5px] w-4 bg-white" />
            <span className="h-[1.5px] w-4 bg-white" />
          </button>
        </header>
        <main className="relative min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
