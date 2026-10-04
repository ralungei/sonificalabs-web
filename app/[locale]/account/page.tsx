"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

const CARD = "rounded-[26px] border border-contrast/[0.07] bg-white p-[clamp(20px,3vw,28px)] shadow-[0_30px_60px_-40px_rgba(15,42,46,.4)]";
const TILE = "rounded-[18px] bg-surface-2 px-4 py-3.5";
const LABEL = "mb-1 mt-0 text-[13px] font-medium text-text-muted";
const H2 = "m-0 text-[22px] font-medium tracking-[-0.035em]";
const PILL_DARK = "flex h-12 cursor-pointer items-center self-start rounded-full bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-accent";
const PILL_OUTLINE = "flex h-12 cursor-pointer items-center self-start rounded-full border-[1.5px] border-ink bg-white px-5 text-[15px] font-medium text-ink transition-colors hover:border-accent hover:text-accent";

interface AccountData {
  email: string;
  name: string | null;
  avatar: string | null;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  createdAt: string;
  pendingPlan: string | null;
  currentPeriodEnd: string | null;
}

export default function AccountPage() {
  const t = useTranslations("account");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const apiToken = useApiToken();
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    const reset = () => setManagingSubscription(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/account", {}, apiToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAccount(data);
      })
      .catch(() => {});
  }, [apiToken]);

  async function openPortal() {
    setManagingSubscription(true);
    try {
      const res = await apiFetch("/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      }, apiToken);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setManagingSubscription(false);
      }
    } catch {
      setManagingSubscription(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== t("deleteWord")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch("/user/account", { method: "DELETE" }, apiToken);
      if (!res.ok) throw new Error("Error al eliminar la cuenta");
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setError(t("deleteError"));
      setDeleting(false);
    }
  }

  const dateLong = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  if (status === "loading" || !session) {
    return (
      <main className="flex min-h-screen flex-col bg-white text-ink">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </main>
    );
  }

  const used = account?.creditsUsed ?? 0;
  const limit = account?.creditsLimit ?? 0;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <main className="flex min-h-screen flex-col overflow-x-clip bg-white text-ink">
      <Navbar />
      <div className="relative mx-auto flex w-full max-w-[640px] flex-1 flex-col px-[clamp(18px,4vw,48px)] pb-[clamp(64px,8vw,110px)] pt-[clamp(48px,7vw,96px)]">
        <div aria-hidden className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-[420px] w-[min(900px,120vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.14),transparent)]" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-[13px]"
        >
          <h1 className="mb-5 mt-0 text-[clamp(40px,5vw,72px)] font-normal leading-[1.02] tracking-[-0.065em]">{t("title")}</h1>

          {/* Profile card */}
          <section className={CARD}>
            <div className="flex items-center gap-4">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-14 w-14 rounded-full"
                  style={{ boxShadow: "0 0 0 3px #fff, 0 0 0 4px rgba(13,148,136,.25)" }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-[22px] font-medium text-accent-dim">
                  {session.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="m-0 truncate text-[20px] font-medium tracking-[-0.03em]">{session.user?.name}</p>
                <p className="m-0 truncate text-[15px] text-text-secondary">{session.user?.email}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-[13px]">
              <div className={TILE}>
                <p className={LABEL}>{t("plan")}</p>
                <p className="m-0 text-[22px] font-medium tracking-[-0.035em]">
                  {PLAN_LABELS[account?.plan ?? "free"] ?? account?.plan ?? "Free"}
                </p>
              </div>
              <div className={TILE}>
                <p className={LABEL}>{t("creditsUsed")}</p>
                <p className="m-0 text-[22px] font-medium tracking-[-0.035em]">{used} / {limit}</p>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white">
                  <span className="block h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#2dd4bf)]" style={{ width: `${pct}%` }} />
                </span>
              </div>
              <div className={cn(TILE, "col-span-2")}>
                <p className={LABEL}>{t("memberSince")}</p>
                <p className="m-0 text-base font-medium">{account?.createdAt ? dateLong(account.createdAt) : "..."}</p>
              </div>
            </div>
          </section>

          {/* Pending downgrade notice */}
          {account?.pendingPlan && (() => {
            const planLabel = PLAN_LABELS[account.pendingPlan] ?? account.pendingPlan;
            const dateStr = account.currentPeriodEnd ? dateLong(account.currentPeriodEnd) : null;
            return (
              <div className="rounded-[21px] border border-amber-500/25 bg-amber-50 px-6 py-4">
                <p className="m-0 text-[15px] text-amber-800">
                  {dateStr
                    ? t("pendingDowngrade", { plan: planLabel, date: dateStr })
                    : t("pendingDowngradeNoDate", { plan: planLabel })}
                </p>
              </div>
            );
          })()}

          {/* Subscription management */}
          {account && (
            <section className={CARD}>
              <h2 className={H2}>{t("subscription")}</h2>
              {account.plan === "free" ? (
                <button onClick={() => router.push("/pricing")} className={cn(PILL_DARK, "mt-4")}>
                  {t("upgradePlan")}
                </button>
              ) : (
                <div className="mt-4 flex flex-col gap-4">
                  {account.currentPeriodEnd && (
                    <div>
                      <p className={LABEL}>{t("renewalDate")}</p>
                      <p className="m-0 text-base font-medium">{dateLong(account.currentPeriodEnd)}</p>
                    </div>
                  )}
                  <button onClick={openPortal} disabled={managingSubscription} className={cn(PILL_OUTLINE, "disabled:opacity-50")}>
                    {managingSubscription ? t("managingSubscription") : t("manageSubscription")}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Danger zone */}
          <section className="rounded-[26px] border border-red-500/15 bg-red-50/60 p-[clamp(20px,3vw,28px)]">
            <h2 className={cn(H2, "text-red-700")}>{t("dangerZone")}</h2>
            <p className="mb-4 mt-2 text-[15px] leading-[1.45] text-text-secondary">{t("dangerDescription")}</p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex h-[42px] cursor-pointer items-center rounded-full border border-red-500/30 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
            >
              {t("deleteAccount")}
            </button>
          </section>
        </motion.div>
      </div>

      <Footer />

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[var(--z-dropdown)] flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-[0_40px_80px_-30px_rgba(15,42,46,.6)]"
          >
            <h3 className="mb-2 mt-0 text-[22px] font-medium tracking-[-0.035em]">{t("confirmDeletion")}</h3>
            <p className="mb-4 mt-0 text-[15px] leading-[1.45] text-text-secondary">
              {t("typeDeleteConfirm", { word: "" })} <span className="font-mono font-semibold text-red-600">{t("deleteWord")}</span>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("typePlaceholder")}
              className="mb-4 h-12 w-full rounded-full border border-contrast/[0.12] bg-white px-5 text-base text-ink placeholder:text-text-muted focus:border-red-500/50 focus:outline-none"
              autoFocus
            />
            {error && <p className="mb-3 mt-0 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setConfirmText("");
                  setError(null);
                }}
                className="flex h-[42px] cursor-pointer items-center rounded-full px-4 text-sm font-medium text-text-secondary transition-colors hover:text-ink"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== t("deleteWord") || deleting}
                className="flex h-[42px] cursor-pointer items-center rounded-full bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? t("deleting") : t("deleteAccount")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
