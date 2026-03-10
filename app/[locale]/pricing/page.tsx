"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { LogoIcon } from "@/components/Logo";

/* ── Check icon ────────────────────────────────────────────────── */

function Check({ light }: { light?: boolean }) {
  return (
    <svg className={cn("w-4 h-4 flex-shrink-0", light ? "text-accent-bright" : "text-accent")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── FAQ Item ──────────────────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-contrast/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="text-body-lg font-semibold text-text-primary group-hover:text-accent transition-colors pr-4">
          {q}
        </span>
        <svg
          className={cn("w-4 h-4 flex-shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-body-md text-text-secondary leading-relaxed">
              {a}
            </p>
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

  const [hoveredPlan, setHoveredPlan] = useState<number>(2); // Pro active by default

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
      bg: "#0a0a0a",
      blobs: "radial-gradient(circle at 25% 30%, rgba(120,120,120,0.35) 0%, transparent 55%), radial-gradient(circle at 75% 70%, rgba(80,80,80,0.25) 0%, transparent 50%)",
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
      bg: "#0a0a0a",
      blobs: "radial-gradient(circle at 20% 25%, rgba(59,130,246,0.4) 0%, transparent 55%), radial-gradient(circle at 80% 75%, rgba(99,102,241,0.3) 0%, transparent 50%)",
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
      bg: "#0a0a0a",
      blobs: "radial-gradient(circle at 25% 20%, rgba(42,191,170,0.45) 0%, transparent 55%), radial-gradient(circle at 75% 80%, rgba(14,165,233,0.35) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(45,212,191,0.15) 0%, transparent 40%)",
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
      bg: "#0a0a0a",
      blobs: "radial-gradient(circle at 30% 25%, rgba(139,92,246,0.4) 0%, transparent 55%), radial-gradient(circle at 70% 75%, rgba(236,72,153,0.3) 0%, transparent 50%)",
    },
  ];

  const CREDIT_COSTS = t.raw("creditCosts") as Array<{ action: string; credits: number }>;
  const EXAMPLES = t.raw("creditExamples") as Array<{ desc: string; total: string }>;
  const FAQS = t.raw("faqs") as Array<{ q: string; a: string }>;

  return (
    <motion.main
      initial={{ backgroundColor: "#FFFFFF" }}
      animate={{ backgroundColor: "#F0F0F0" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen"
    >
      <Navbar />

      {/* Hero */}
      <section className="text-center pt-28 pb-10 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-display-sm md:text-display-md lg:text-display-lg font-logo tracking-tight text-text-primary mb-3"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-text-secondary text-body-lg"
        >
          {t("subtitle")}
        </motion.p>
      </section>

      {/* Plans grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLANS.map((plan, i) => {
            const active = hoveredPlan === i;
            return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
              onMouseEnter={() => setHoveredPlan(i)}
              onMouseLeave={() => setHoveredPlan(2)}
              className="rounded-2xl p-6 flex flex-col relative overflow-hidden cursor-default"
              style={{
                background: active ? plan.bg : "#ffffff",
                borderColor: active ? "rgba(255,255,255,0.08)" : "rgba(26,35,50,0.08)",
                borderWidth: 1,
                borderStyle: "solid",
                transition: "background 0.5s ease, border-color 0.4s ease",
              }}
            >
              {/* Color blobs */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  backgroundImage: plan.blobs,
                  opacity: active ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
              />
              {/* Grain */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.35'/%3E%3C/svg%3E\")",
                  opacity: active ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
              />
              {/* Card content — above blobs/grain */}
              <div className="relative z-10 flex flex-col flex-1">
              {/* Name + badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-heading-lg font-bold" style={{ color: active ? "#ffffff" : "#1A2332", transition: "color 0.4s ease" }}>{plan.name}</span>
                {"badge" in plan && plan.badge && (
                  <span className="text-caption-md font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: active ? "#ffffff" : "#1A2332", color: active ? "#1A2332" : "#ffffff", transition: "background 0.4s ease, color 0.4s ease" }}
                  >
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-display-sm font-extrabold tracking-tight leading-none" style={{ color: active ? "#ffffff" : "#1A2332", transition: "color 0.4s ease" }}>
                  {plan.price}
                </span>
                <span className="text-body-md" style={{ color: active ? "#ffffff" : "#6B7280", transition: "color 0.4s ease" }}>
                  € {plan.unit}
                </span>
              </div>

              {/* CTA */}
              {(() => {
                const planKey = plan.name.toLowerCase();
                const isCurrent = currentPlan === planKey;
                const isPending = pendingPlan === planKey;

                if (isCurrent) {
                  return (
                    <span className="block text-center py-2.5 rounded-xl text-body-md font-semibold mt-4 mb-4 cursor-default"
                      style={{
                        background: "transparent",
                        color: active ? "#ffffff" : "#1A2332",
                        border: active ? "1.5px solid #ffffff" : "1.5px solid #1A2332",
                        transition: "all 0.4s ease",
                      }}
                    >
                      {t("currentPlan")}
                    </span>
                  );
                }

                if (isPending) {
                  const dateStr = periodEnd
                    ? new Date(periodEnd).toLocaleDateString(locale, { day: "numeric", month: "long" })
                    : null;
                  return (
                    <div className="mt-4 mb-4 space-y-2">
                      <span className="block text-center py-2.5 rounded-xl text-body-md font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-default">
                        {t("downgradeScheduled")}
                      </span>
                      {dateStr && (
                        <p className="text-center text-label-sm text-text-muted">{dateStr}</p>
                      )}
                      <button
                        onClick={handleCancelDowngrade}
                        className="block w-full text-center py-1.5 rounded-lg text-label-md font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {t("cancelDowngrade")}
                      </button>
                    </div>
                  );
                }

                if (planKey === "free") {
                  if (!session?.user) {
                    return (
                      <Link
                        href="/signin"
                        className="block text-center py-2.5 rounded-xl text-body-md font-semibold mt-4 mb-4 cursor-pointer"
                        style={{
                          background: active ? "#ffffff" : "#1A2332",
                          color: active ? "#1A2332" : "#ffffff",
                          transition: "background 0.4s ease, color 0.4s ease",
                        }}
                      >
                        {plan.cta}
                      </Link>
                    );
                  }
                  if (currentPlan !== "free") {
                    return (
                      <Link
                        href="/account"
                        className="block text-center py-2.5 rounded-xl text-body-md font-semibold mt-4 mb-4 cursor-pointer"
                        style={{
                          background: active ? "#ffffff" : "#1A2332",
                          color: active ? "#1A2332" : "#ffffff",
                          transition: "background 0.4s ease, color 0.4s ease",
                        }}
                      >
                        {t("cancelSubscription")}
                      </Link>
                    );
                  }
                  return (
                    <Link
                      href="/"
                      className="block text-center py-2.5 rounded-xl text-body-md font-semibold mt-4 mb-4 cursor-pointer"
                      style={{
                        background: active ? "#ffffff" : "#1A2332",
                        color: active ? "#1A2332" : "#ffffff",
                        transition: "background 0.4s ease, color 0.4s ease",
                      }}
                    >
                      {plan.cta}
                    </Link>
                  );
                }

                return (
                  <button
                    onClick={() => handleCheckout(planKey)}
                    disabled={loading !== null}
                    className={cn(
                      "block w-full text-center py-2.5 rounded-xl text-body-md font-semibold mt-4 mb-4 cursor-pointer",
                      loading === planKey && "opacity-60 cursor-wait",
                    )}
                    style={{
                      background: active ? "#ffffff" : "#1A2332",
                      color: active ? "#1A2332" : "#ffffff",
                      transition: "background 0.4s ease, color 0.4s ease",
                    }}
                  >
                    {loading === planKey ? "..." : plan.cta}
                  </button>
                );
              })()}

              {/* Includes */}
              {plan.includes && (
                <p className="text-label-md font-medium mb-3" style={{ color: active ? "#ffffff" : "#6B7280", transition: "color 0.4s ease" }}>
                  {plan.includes}
                </p>
              )}

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm" style={{ color: active ? "#ffffff" : "#6B7280", transition: "color 0.4s ease" }}>
                    <Check light={active} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Credits */}
              <div className="mt-5 pt-4" style={{ borderTop: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(26,35,50,0.06)", transition: "border-color 0.4s ease" }}>
                <span className="text-body-sm font-bold" style={{ color: active ? "#ffffff" : "#1A2332", transition: "color 0.4s ease" }}>
                  {plan.credits}
                </span>
              </div>
              </div>{/* end card content wrapper */}
            </motion.div>
            );
          })}
        </div>

        <p className="text-center text-text-muted text-label-md mt-6">
          {t("priceNote")}
        </p>
      </section>

      {/* How credits work */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-contrast/[0.08] bg-white p-8"
        >
          <h2 className="text-heading-xl md:text-display-sm font-bold text-text-primary mb-6 tracking-tight">
            {t("howCreditsWork")}
          </h2>

          {/* Cost table */}
          <div className="space-y-3 mb-8">
            {CREDIT_COSTS.map((c) => (
              <div key={c.action} className="flex items-center justify-between py-2 border-b border-contrast/[0.06]">
                <span className="text-body-md text-text-secondary">{c.action}</span>
                <span className="text-body-md font-semibold text-text-primary font-mono">
                  {c.credits} {t("creditsUnit")}
                </span>
              </div>
            ))}
          </div>

          {/* Examples */}
          <h3 className="text-body-md font-semibold text-text-muted uppercase tracking-wider mb-4">
            {t("examples")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXAMPLES.map((ex) => (
              <div
                key={ex.desc}
                className="rounded-xl bg-[#F5F5F5] border border-contrast/[0.06] p-4"
              >
                <p className="text-body-sm text-text-secondary mb-2">{ex.desc}</p>
                <p className="text-heading-sm font-bold text-accent">{ex.total}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQs */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-display-sm md:text-display-md font-logo text-center text-text-primary mb-8 tracking-tight">
          {t("faqTitle")}
        </h2>
        <div>
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-contrast/[0.06] bg-surface-1/40 py-16 text-center px-4">
        <h2 className="text-heading-xl md:text-display-sm font-bold text-text-primary mb-6 tracking-tight">
          {t("bottomCtaTitle")}
        </h2>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl text-body-md font-semibold bg-contrast/[0.06] text-text-primary border border-contrast/[0.1] hover:bg-contrast/[0.1] transition-colors"
          >
            {t("viewDemos")}
          </Link>
          <Link
            href={session ? "/" : "/signin"}
            className="px-6 py-2.5 rounded-xl text-body-md font-semibold bg-contrast text-surface-0 hover:bg-contrast/90 transition-all duration-200"
          >
            {t("startFree")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-contrast/[0.06] py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-6 w-auto text-contrast" />
            <span className="text-heading-sm font-body tracking-normal"><span className="text-contrast font-bold">sonifica</span><span className="text-contrast font-light">labs</span><sup className="text-label-md text-contrast/50 ml-0.5">™</sup></span>
          </div>
        </div>
      </footer>

    </motion.main>
  );
}
