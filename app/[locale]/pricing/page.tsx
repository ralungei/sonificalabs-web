"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";

/* ── Check icon ────────────────────────────────────────────────── */

function Check() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── FAQ Item ──────────────────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="text-[15px] font-semibold text-text-primary group-hover:text-accent transition-colors pr-4">
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
            <p className="pb-5 text-sm text-text-secondary leading-relaxed">
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
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  useEffect(() => {
    apiFetch("/user/quota")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.plan) setCurrentPlan(data.plan); })
      .catch(() => {});
  }, [session]);

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
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error");
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  }

  const PLANS = [
    {
      name: "Free",
      price: "0",
      unit: "",
      credits: t("plans.free.credits"),
      cta: t("plans.free.cta"),
      ctaStyle: "light" as const,
      highlighted: false,
      includes: null,
      features: t.raw("plans.free.features") as string[],
    },
    {
      name: "Pro",
      price: "29.99",
      unit: t("perMonth"),
      credits: t("plans.pro.credits"),
      cta: t("plans.pro.cta"),
      ctaStyle: "accent" as const,
      highlighted: true,
      badge: t("plans.pro.badge"),
      includes: t("plans.pro.includes"),
      features: t.raw("plans.pro.features") as string[],
    },
    {
      name: "Studio",
      price: "59.99",
      unit: t("perMonth"),
      credits: t("plans.studio.credits"),
      cta: t("plans.studio.cta"),
      ctaStyle: "light" as const,
      highlighted: false,
      includes: t("plans.studio.includes"),
      features: t.raw("plans.studio.features") as string[],
    },
  ];

  const CREDIT_COSTS = t.raw("creditCosts") as Array<{ action: string; credits: number }>;
  const EXAMPLES = t.raw("creditExamples") as Array<{ desc: string; total: string }>;
  const FAQS = t.raw("faqs") as Array<{ q: string; a: string }>;

  return (
    <main className="min-h-screen bg-surface-0">
      <Navbar />

      {/* Hero */}
      <section className="text-center pt-28 pb-10 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl font-logo tracking-[0.02em] text-text-primary mb-3"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-text-secondary text-base"
        >
          {t("subtitle")}
        </motion.p>
      </section>

      {/* Plans grid */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
              className={cn(
                "rounded-2xl border p-6 flex flex-col",
                plan.highlighted
                  ? "border-accent/50 bg-surface-1 shadow-[0_0_40px_rgba(232,168,56,0.08)]"
                  : "border-white/[0.08] bg-surface-1/60",
              )}
            >
              {/* Name + badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[17px] font-bold text-text-primary">{plan.name}</span>
                {"badge" in plan && plan.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-surface-0 uppercase tracking-wide">
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-[36px] font-extrabold tracking-tight text-text-primary leading-none">
                  {plan.price}
                </span>
                <span className="text-sm text-text-secondary">
                  € {plan.unit}
                </span>
              </div>

              {/* CTA */}
              {(() => {
                const planKey = plan.name.toLowerCase();
                const isCurrent = currentPlan === planKey;

                if (isCurrent) {
                  return (
                    <span className="block text-center py-2.5 rounded-xl text-sm font-semibold mt-4 mb-4 bg-accent/10 text-accent border border-accent/30 cursor-default">
                      {t("currentPlan")}
                    </span>
                  );
                }

                if (planKey === "free") {
                  return session?.user ? (
                    <Link
                      href="/"
                      className="block text-center py-2.5 rounded-xl text-sm font-semibold mt-4 mb-4 transition-all duration-200 bg-white/[0.06] text-text-primary border border-white/[0.1] hover:bg-white/[0.1]"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <Link
                      href="/signin"
                      className="block text-center py-2.5 rounded-xl text-sm font-semibold mt-4 mb-4 transition-all duration-200 bg-white/[0.06] text-text-primary border border-white/[0.1] hover:bg-white/[0.1]"
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
                      "block w-full text-center py-2.5 rounded-xl text-sm font-semibold mt-4 mb-4 transition-all duration-200 cursor-pointer",
                      plan.highlighted
                        ? "bg-accent text-surface-0 hover:bg-accent-bright hover:shadow-[0_0_24px_rgba(232,168,56,0.25)]"
                        : "bg-white/[0.06] text-text-primary border border-white/[0.1] hover:bg-white/[0.1]",
                      loading === planKey && "opacity-60 cursor-wait",
                    )}
                  >
                    {loading === planKey ? "..." : plan.cta}
                  </button>
                );
              })()}

              {/* Includes */}
              {plan.includes && (
                <p className="text-xs text-text-secondary font-medium mb-3">
                  {plan.includes}
                </p>
              )}

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-text-secondary">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Credits pill */}
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <span className="inline-block px-3 py-1.5 rounded-lg bg-white/[0.04] text-[13px] font-semibold text-text-secondary">
                  {plan.credits}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          {t("priceNote")}
        </p>
      </section>

      {/* How credits work */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/[0.08] bg-surface-1/60 p-8"
        >
          <h2 className="text-xl font-bold text-text-primary mb-6 tracking-tight">
            {t("howCreditsWork")}
          </h2>

          {/* Cost table */}
          <div className="space-y-3 mb-8">
            {CREDIT_COSTS.map((c) => (
              <div key={c.action} className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm text-text-secondary">{c.action}</span>
                <span className="text-sm font-semibold text-text-primary font-mono">
                  {c.credits} créditos
                </span>
              </div>
            ))}
          </div>

          {/* Examples */}
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            {t("examples")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXAMPLES.map((ex) => (
              <div
                key={ex.desc}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
              >
                <p className="text-[13px] text-text-secondary mb-2">{ex.desc}</p>
                <p className="text-lg font-bold text-accent">{ex.total}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQs */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-logo text-center text-text-primary mb-8 tracking-wide">
          {t("faqTitle")}
        </h2>
        <div>
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06] bg-surface-1/40 py-16 text-center px-4">
        <h2 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">
          {t("bottomCtaTitle")}
        </h2>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.06] text-text-primary border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
          >
            {t("viewDemos")}
          </Link>
          <Link
            href="/signin"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent text-surface-0 hover:bg-accent-bright hover:shadow-[0_0_24px_rgba(232,168,56,0.25)] transition-all duration-200"
          >
            {t("startFree")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
              <path d="m20.713 7.128-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M7 6a5 5 0 0 1 7.697-4.21l-1.08 1.682A3 3 0 0 0 9 6v6a3 3 0 1 0 6 0V7h2v5a5 5 0 0 1-10 0zm-4.808 7.962 1.962-.393a8.003 8.003 0 0 0 15.692 0l1.962.393C20.896 18.545 16.852 22 12 22s-8.896-3.455-9.808-8.038" />
            </svg>
            <span className="text-base font-brand tracking-[0.04em]"><span className="text-white">sonifica</span><span className="text-accent">labs</span></span>
          </div>
          <p className="text-[11px] text-white/40">© 2026 SonificaLabs</p>
        </div>
      </footer>
    </main>
  );
}
