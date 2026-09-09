"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Navbar } from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { ConsoleList } from "./ConsoleList";

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

function CreditMeter({ quota }: { quota: Quota | null }) {
  const t = useTranslations("console");
  if (!quota) {
    return <div className="h-[76px] animate-pulse rounded-2xl border border-border-subtle bg-surface-1" />;
  }

  const limit = Math.max(1, quota.creditsLimit);
  const used = Math.min(quota.creditsUsed, limit);
  const pct = Math.round((used / limit) * 100);
  const low = quota.remaining <= limit * 0.15;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label-sm font-medium uppercase tracking-wide text-text-muted">
          {t("stats.credits")}
        </span>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-caption-md font-semibold text-accent">
          {PLAN_LABELS[quota.plan] ?? quota.plan}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-heading-xl font-extrabold tabular-nums text-contrast">{quota.remaining}</span>
        <span className="text-body-sm text-text-muted">/ {quota.creditsLimit}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${100 - pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${low ? "bg-fail" : "bg-accent"}`}
        />
      </div>
      {low ? (
        <Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-caption-md font-medium text-accent hover:underline">
          {t("stats.upgrade")}
          <Icon icon="solar:alt-arrow-right-linear" className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <Icon icon={icon} className="pointer-events-none absolute -right-3 -top-2 h-20 w-20 text-accent/[0.07]" />
      <span className="text-label-sm font-medium uppercase tracking-wide text-text-muted">{label}</span>
      <p className="mt-2 text-heading-xl font-extrabold tabular-nums text-contrast">{value}</p>
    </div>
  );
}

export default function ConsolePage() {
  const t = useTranslations("console");
  const { data: session, status } = useSession();
  const apiToken = useApiToken();
  const router = useRouter();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setQuota(d))
      .catch(() => {});
  }, [apiToken]);

  // Headline counters. Uses one wide page so the totals are real, not a
  // per-page subtotal that changes as you paginate.
  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/productions?limit=100", {}, apiToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setTotal(d.total);
        const ms = (d.productions as { durationMs: number | null }[]).reduce(
          (sum, p) => sum + (p.durationMs ?? 0),
          0,
        );
        setMinutes(Math.round(ms / 60000));
      })
      .catch(() => {});
  }, [apiToken]);

  if (status === "loading") {
    return (
      <>
        <Navbar />
        <div className="grid min-h-screen place-items-center">
          <Icon icon="svg-spinners:ring-resize" className="h-6 w-6 text-accent" />
        </div>
      </>
    );
  }

  if (!session) return null;

  const firstName = session.user?.name?.split(" ")[0] ?? "";

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen w-full max-w-[1100px] px-5 pb-24 pt-28 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-display-sm font-extrabold tracking-[-0.03em] text-contrast">
              {firstName ? t("greeting", { name: firstName }) : t("title")}
            </h1>
            <p className="mt-1.5 text-body-md text-text-secondary">{t("subtitle")}</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-label-md font-medium text-white transition-all hover:bg-accent-bright hover:shadow-[var(--shadow-glow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4" />
            {t("newProduction")}
          </Link>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          <div className="col-span-2 sm:col-span-1">
            <CreditMeter quota={quota} />
          </div>
          <StatTile
            icon="solar:soundwave-bold"
            label={t("stats.productions")}
            value={total == null ? "—" : String(total)}
          />
          <StatTile
            icon="solar:clock-circle-bold"
            label={t("stats.minutes")}
            value={minutes == null ? "—" : String(minutes)}
          />
        </motion.div>

        <h2 className="mb-3 text-heading-sm font-semibold text-contrast">{t("listTitle")}</h2>
        <ConsoleList />
      </main>
    </>
  );
}
