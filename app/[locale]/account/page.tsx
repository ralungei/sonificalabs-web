"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

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

  if (status === "loading" || !session) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-display-sm md:text-display-md font-brand text-contrast mb-8">{t("title")}</h1>

          {/* Profile card */}
          <div className="rounded-2xl border border-contrast/[0.08] bg-surface-1/60 backdrop-blur-sm p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-14 w-14 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center text-heading-md text-accent font-semibold">
                  {session.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <p className="text-contrast font-medium">{session.user?.name}</p>
                <p className="text-body-md text-text-secondary">{session.user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-body-md">
              <div>
                <p className="text-text-muted text-label-md mb-1">{t("plan")}</p>
                <p className="text-contrast font-medium">
                  {PLAN_LABELS[account?.plan ?? "free"] ?? account?.plan ?? "Free"}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-label-md mb-1">{t("creditsUsed")}</p>
                <p className="text-contrast font-medium">{account?.creditsUsed ?? 0} / {account?.creditsLimit ?? 0}</p>
              </div>
              <div className="col-span-2">
                <p className="text-text-muted text-label-md mb-1">{t("memberSince")}</p>
                <p className="text-contrast font-medium">
                  {account?.createdAt
                    ? new Date(account.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Pending downgrade notice */}
          {account?.pendingPlan && (() => {
            const planLabel = PLAN_LABELS[account.pendingPlan] ?? account.pendingPlan;
            const dateStr = account.currentPeriodEnd
              ? new Date(account.currentPeriodEnd).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
              : null;
            return (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 mb-6">
                <p className="text-body-md text-amber-400">
                  {dateStr
                    ? t("pendingDowngrade", { plan: planLabel, date: dateStr })
                    : t("pendingDowngradeNoDate", { plan: planLabel })}
                </p>
              </div>
            );
          })()}

          {/* Subscription management */}
          {account && (
            <div className="rounded-2xl border border-contrast/[0.08] bg-surface-1/60 backdrop-blur-sm p-6 mb-6">
              <h2 className="text-body-md font-semibold text-text-primary mb-4">{t("subscription")}</h2>
              {account.plan === "free" ? (
                <button
                  onClick={() => router.push("/pricing")}
                  className="px-4 py-2 rounded-lg text-label-md font-semibold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer"
                >
                  {t("upgradePlan")}
                </button>
              ) : (
                <div className="flex flex-col gap-4">
                  {account.currentPeriodEnd && (
                    <div>
                      <p className="text-text-muted text-label-md mb-1">{t("renewalDate")}</p>
                      <p className="text-contrast font-medium">
                        {new Date(account.currentPeriodEnd).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={async () => {
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
                    }}
                    disabled={managingSubscription}
                    className="self-start px-4 py-2 rounded-lg text-label-md font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {managingSubscription ? t("managingSubscription") : t("cancelSubscription")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
            <h2 className="text-body-md font-semibold text-red-400 mb-2">{t("dangerZone")}</h2>
            <p className="text-label-md text-text-secondary mb-4">
              {t("dangerDescription")}
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 rounded-lg text-label-md font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              {t("deleteAccount")}
            </button>
          </div>
        </motion.div>

        {/* Delete confirmation dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 z-[var(--z-dropdown)] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-2xl border border-contrast/[0.08] bg-surface-2 p-6 shadow-2xl"
            >
              <h3 className="text-contrast font-semibold mb-2">
                {t("confirmDeletion")}
              </h3>
              <p className="text-label-md text-text-secondary mb-4">
                {t.rich("typeDeleteConfirm", {
                  word: (chunks) => <span className="text-red-400 font-mono font-semibold">{t("deleteWord")}</span>,
                })}
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t("typePlaceholder")}
                className="w-full px-3 py-2 rounded-lg bg-surface-0 border border-contrast/[0.08] text-contrast text-body-md placeholder:text-text-muted focus:outline-none focus:border-red-500/50 mb-4"
                autoFocus
              />
              {error && (
                <p className="text-label-md text-red-400 mb-3">{error}</p>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setConfirmText("");
                    setError(null);
                  }}
                  className="px-4 py-2 rounded-lg text-label-md text-text-secondary hover:text-contrast transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== t("deleteWord") || deleting}
                  className="px-4 py-2 rounded-lg text-label-md font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleting ? t("deleting") : t("deleteAccount")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </>
  );
}
