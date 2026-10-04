"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { ArrowDot, Check, PillLink, Reveal } from "@/components/site/ui";

const H2 = "m-0 text-balance text-[clamp(30px,3.6vw,48px)] font-normal leading-[1.04] tracking-[-0.06em]";

/* ── FAQ Item ──────────────────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[21px] border border-contrast/[0.07] bg-white px-[clamp(18px,2.5vw,26px)]">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[17px] font-medium tracking-[-0.025em] transition-colors group-hover:text-accent">{q}</span>
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink transition-transform duration-200", open && "rotate-180")}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="m-0 pb-5 text-base leading-[1.5] text-text-secondary">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function PricingPage() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const { data: session } = useSession();
  const apiToken = useApiToken();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    apiFetch("/user/quota", {}, apiToken)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.plan) setCurrentPlan(data.plan);
        if (data?.pendingPlan) setPendingPlan(data.pendingPlan);
        if (data?.currentPeriodEnd) setPeriodEnd(data.currentPeriodEnd);
      })
      .catch(() => {});
  }, [apiToken]);

  async function handleCheckout(planId: string) {
    if (!session?.user) {
      window.location.href = `/${locale}/signin?callbackUrl=/${locale}/pricing`;
      return;
    }
    setLoading(planId);
    try {
      const res = await apiFetch("/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, locale }),
      }, apiToken);
      const data = await res.json();
      if (data.url) {
        // Always redirect to Stripe (Checkout or Billing Portal)
        window.location.href = data.url;
      } else {
        alert(data.error || "Error");
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  }

  async function handleCancelDowngrade() {
    try {
      const res = await apiFetch("/stripe/cancel-downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }, apiToken);
      if (res.ok) {
        setPendingPlan(null);
      }
    } catch {}
  }

  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const PLANS = [
    {
      name: "Free",
      price: "0",
      unit: "",
      credits: t("plans.free.credits"),
      cta: t("plans.free.cta"),
      highlighted: false,
      includes: null,
      features: t.raw("plans.free.features") as string[],
    },
    {
      name: "Starter",
      price: fmt(9.99),
      unit: t("perMonth"),
      credits: t("plans.starter.credits"),
      cta: t("plans.starter.cta"),
      highlighted: false,
      includes: t("plans.starter.includes"),
      features: t.raw("plans.starter.features") as string[],
    },
    {
      name: "Pro",
      price: fmt(29.99),
      unit: t("perMonth"),
      credits: t("plans.pro.credits"),
      cta: t("plans.pro.cta"),
      highlighted: true,
      badge: t("plans.pro.badge"),
      includes: t("plans.pro.includes"),
      features: t.raw("plans.pro.features") as string[],
    },
    {
      name: "Studio",
      price: fmt(59.99),
      unit: t("perMonth"),
      credits: t("plans.studio.credits"),
      cta: t("plans.studio.cta"),
      highlighted: false,
      includes: t("plans.studio.includes"),
      features: t.raw("plans.studio.features") as string[],
    },
  ];

  const CREDIT_COSTS = t.raw("creditCosts") as Array<{ action: string; credits: number }>;
  const EXAMPLES = t.raw("creditExamples") as Array<{ desc: string; total: string }>;
  const FAQS = t.raw("faqs") as Array<{ q: string; a: string }>;

  return (
    <PageShell title={t("titleStart")} keyword={t("titleKeyword")} subtitle={t("subtitle")}>

      {/* Plans grid */}
      <section className="px-[clamp(18px,4vw,48px)] pb-[clamp(56px,7vw,96px)]">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-[13px] sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => {
            const dark = plan.highlighted;
            const planKey = plan.name.toLowerCase();
            const isCurrent = !!session?.user && currentPlan === planKey;
            const isPending = pendingPlan === planKey;
            const ctaCls = cn(
              "mb-5 mt-5 flex h-12 w-full items-center justify-between rounded-full pl-5 pr-1.5 text-[15px] font-medium tracking-[-0.02em] transition-colors",
              dark ? "bg-accent text-white hover:bg-white hover:text-ink" : "bg-ink text-white hover:bg-accent",
            );
            const arrow = <ArrowDot size={36} tone={dark ? "teal" : "light"} />;

            let cta: React.ReactNode;
            if (isCurrent) {
              cta = (
                <span className={cn(
                  "mb-5 mt-5 flex h-12 w-full cursor-default items-center justify-center gap-2 rounded-full border-[1.5px] text-[15px] font-medium",
                  dark ? "border-white/50 text-white" : "border-ink text-ink",
                )}>
                  <Check size={14} />{t("currentPlan")}
                </span>
              );
            } else if (isPending) {
              const dateStr = periodEnd
                ? new Date(periodEnd).toLocaleDateString(locale, { day: "numeric", month: "long" })
                : null;
              cta = (
                <div className="mb-5 mt-5 flex flex-col gap-2">
                  <span className="flex h-12 cursor-default items-center justify-center rounded-full bg-amber-50 text-[15px] font-medium text-amber-700">
                    {t("downgradeScheduled")}
                  </span>
                  {dateStr && <p className={cn("m-0 text-center text-sm", dark ? "text-white/60" : "text-text-muted")}>{dateStr}</p>}
                  <button
                    onClick={handleCancelDowngrade}
                    className={cn("cursor-pointer py-1 text-sm font-medium underline-offset-4 hover:underline", dark ? "text-white/70" : "text-text-muted")}
                  >
                    {t("cancelDowngrade")}
                  </button>
                </div>
              );
            } else if (planKey === "free") {
              const href = !session?.user ? "/signin" : currentPlan !== "free" ? "/account" : "/";
              const label = session?.user && currentPlan !== "free" ? t("cancelSubscription") : plan.cta;
              cta = <Link href={href} className={ctaCls}>{label}{arrow}</Link>;
            } else {
              cta = (
                <button
                  onClick={() => handleCheckout(planKey)}
                  disabled={loading !== null}
                  className={cn(ctaCls, "cursor-pointer", loading === planKey && "cursor-wait opacity-60")}
                >
                  {loading === planKey ? "..." : plan.cta}{arrow}
                </button>
              );
            }

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-[26px] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1",
                  dark
                    ? "bg-ink text-white shadow-[0_40px_80px_-36px_rgba(15,42,46,.7)]"
                    : "border border-contrast/[0.07] bg-white shadow-[0_30px_60px_-40px_rgba(15,42,46,.4)] hover:shadow-[0_30px_60px_-30px_rgba(13,148,136,.45)]",
                )}
              >
                {dark && (
                  <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.35),transparent)]" />
                )}
                <div className="relative flex flex-1 flex-col">
                  {/* Name + badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[22px] font-medium tracking-[-0.035em]">{plan.name}</span>
                    {"badge" in plan && plan.badge && (
                      <span className="rounded-full bg-[#2dd4bf] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-ink">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-[clamp(40px,3.6vw,52px)] font-normal leading-none tracking-[-0.06em]">{plan.price}</span>
                    <span className={cn("text-[15px]", dark ? "text-white/60" : "text-text-muted")}>€ {plan.unit}</span>
                  </div>

                  {cta}

                  {plan.includes && (
                    <p className={cn("mb-3 mt-0 text-sm font-medium", dark ? "text-white/60" : "text-text-muted")}>{plan.includes}</p>
                  )}

                  {/* Features */}
                  <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 p-0">
                    {plan.features.map((f) => (
                      <li key={f} className={cn("flex items-start gap-2.5 text-[15px] leading-[1.35]", dark ? "text-white/85" : "text-text-secondary")}>
                        <span className={cn("mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full", dark ? "bg-white/10 text-[#2dd4bf]" : "bg-mint text-accent")}>
                          <Check size={11} strokeWidth={3.4} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Credits */}
                  <div className={cn("mt-5 border-t pt-4 text-[15px] font-semibold", dark ? "border-white/10" : "border-contrast/[0.07]")}>
                    {plan.credits}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mb-0 mt-6 text-center text-sm text-text-muted">{t("priceNote")}</p>
      </section>

      {/* How credits work */}
      <section className="px-[clamp(18px,4vw,48px)] pb-[clamp(56px,7vw,96px)]">
        <Reveal className="mx-auto max-w-[880px] rounded-[26px] border border-contrast/[0.07] bg-white p-[clamp(24px,4vw,44px)] shadow-[0_30px_60px_-40px_rgba(15,42,46,.4)]">
          <h2 className={H2}>{t("howCreditsWork")}</h2>

          <div className="mb-8 mt-6 flex flex-col">
            {CREDIT_COSTS.map((c) => (
              <div key={c.action} className="flex items-center justify-between gap-4 border-b border-contrast/[0.07] py-3.5">
                <span className="text-base text-text-secondary">{c.action}</span>
                <span className="shrink-0 rounded-full bg-mint px-3 py-1 text-sm font-semibold text-accent-dim">
                  {c.credits} {t("creditsUnit")}
                </span>
              </div>
            ))}
          </div>

          <h3 className="mb-4 mt-0 text-[13px] font-semibold uppercase tracking-[.08em] text-text-muted">{t("examples")}</h3>
          <div className="grid grid-cols-1 gap-[13px] sm:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <div key={ex.desc} className="flex flex-col gap-2 rounded-[21px] bg-surface-2 p-5">
                <p className="m-0 text-[15px] leading-[1.35] text-text-secondary">{ex.desc}</p>
                <p className="m-0 text-[22px] font-medium tracking-[-0.035em] text-accent">{ex.total}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* FAQs */}
      <section className="px-[clamp(18px,4vw,48px)] pb-[clamp(56px,7vw,96px)]">
        <div className="mx-auto max-w-[760px]">
          <Reveal className="mb-8 text-center">
            <h2 className={H2}>{t("faqTitle")}</h2>
          </Reveal>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-[clamp(12px,3vw,40px)] pb-[clamp(64px,8vw,110px)]">
        <Reveal className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 rounded-[26px] bg-[linear-gradient(135deg,#eef6f5,#e6f6f3_50%,#e3f1f7)] px-[clamp(24px,4vw,40px)] py-[clamp(20px,3vw,28px)]">
          <span className="text-[clamp(20px,2vw,26px)] font-normal tracking-[-0.04em]">{t("bottomCtaTitle")}</span>
          <div className="flex flex-wrap gap-2">
            <PillLink href="/examples" variant="outline" arrow={false} className="h-[52px] text-base">{t("viewDemos")}</PillLink>
            <PillLink href={session ? "/" : "/signin"} variant="teal" className="h-[52px] text-base">{t("startFree")}</PillLink>
          </div>
        </Reveal>
      </section>

    </PageShell>
  );
}
