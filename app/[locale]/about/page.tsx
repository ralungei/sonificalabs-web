"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";

/* ── Reveal ───────────────────────────────────────────────────── */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Icons (forWho) — large ────────────────────────────────────── */

const ICON_SIZE = "w-14 h-14";

const FOR_WHO_ICONS: Record<string, React.ReactNode> = {
  video: (
    <svg viewBox="0 0 24 24" className={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" className={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  ),
  film: (
    <svg viewBox="0 0 24 24" className={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 19 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125" />
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 24 24" className={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75a2.25 2.25 0 0 1 2.25-2.25h1.5c.704 0 1.402-.03 2.09-.09m0 12.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a1.03 1.03 0 0 1-1.378-.392 19.19 19.19 0 0 1-1.108-2.545m2.621-13.927c5.024.497 9.41 3.391 11.41 7.327-2 3.936-6.386 6.83-11.41 7.327" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" className={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
};

/* ── Card gradients per use case ──────────────────────────────── */

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #1a3a5c 0%, #0d1f33 100%)",  // blue — creators
  "linear-gradient(135deg, #2d1b4e 0%, #170e2a 100%)",  // purple — podcasters
  "linear-gradient(135deg, #3b1c1c 0%, #1a0d0d 100%)",  // red — film
  "linear-gradient(135deg, #1a3326 0%, #0d1a14 100%)",  // green — agencies
  "linear-gradient(135deg, #3a2e1a 0%, #1a1508 100%)",  // amber — education
  "linear-gradient(135deg, #2a2a2a 0%, #111111 100%)",  // neutral — anyone
];

/* ── Page ──────────────────────────────────────────────────────── */

export default function AboutPage() {
  const t = useTranslations("about");

  const whatCards = t.raw("whatCards") as { icon: string; title: string; desc: string }[];
  const forWhoItems = t.raw("forWhoItems") as { icon: string; label: string; desc: string }[];
  const howSteps = t.raw("howSteps") as { num: string; title: string; desc: string }[];

  return (
    <main className="min-h-screen bg-surface-0 text-contrast overflow-x-hidden">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 max-w-5xl mx-auto text-center overflow-hidden">
        {/* Large ambient glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/[0.05] rounded-full blur-[160px] pointer-events-none" />

        {/* Sound wave arcs — left side */}
        <div className="absolute left-1/2 top-[42%] -translate-y-1/2 pointer-events-none">
          {[80, 125, 170, 215].map((size, i) => (
            <motion.div
              key={`l${i}`}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                top: -size / 2,
                left: -size / 2 - 140,
                clipPath: "inset(0 50% 0 0)",
                border: "none",
                background: `conic-gradient(from 90deg, transparent 20%, var(--color-accent) 50%, transparent 80%)`,
                mask: `radial-gradient(farthest-side, transparent calc(100% - ${i < 3 ? 1.5 : 1}px), #fff calc(100% - ${i < 3 ? 1.5 : 1}px))`,
                WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${i < 3 ? 1.5 : 1}px), #fff calc(100% - ${i < 3 ? 1.5 : 1}px))`,
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: [0, 0.5 + (3 - i) * 0.1, 0],
                scale: [0.9, 1, 1.03],
              }}
              transition={{
                duration: 2.8 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.35,
              }}
            />
          ))}
        </div>

        {/* Sound wave arcs — right side */}
        <div className="absolute left-1/2 top-[42%] -translate-y-1/2 pointer-events-none">
          {[80, 125, 170, 215].map((size, i) => (
            <motion.div
              key={`r${i}`}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                top: -size / 2,
                left: -size / 2 + 140,
                clipPath: "inset(0 0 0 50%)",
                border: "none",
                background: `conic-gradient(from 270deg, transparent 20%, var(--color-accent) 50%, transparent 80%)`,
                mask: `radial-gradient(farthest-side, transparent calc(100% - ${i < 3 ? 1.5 : 1}px), #fff calc(100% - ${i < 3 ? 1.5 : 1}px))`,
                WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${i < 3 ? 1.5 : 1}px), #fff calc(100% - ${i < 3 ? 1.5 : 1}px))`,
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: [0, 0.5 + (3 - i) * 0.1, 0],
                scale: [0.9, 1, 1.03],
              }}
              transition={{
                duration: 2.8 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.35,
              }}
            />
          ))}
        </div>

        {/* Warm glow at wave origin points */}
        <div className="absolute left-1/2 top-[42%] -translate-y-1/2 pointer-events-none">
          <div className="absolute w-16 h-32 -left-[148px] -top-16 bg-accent/[0.06] rounded-full blur-2xl" />
          <div className="absolute w-16 h-32 left-[132px] -top-16 bg-accent/[0.06] rounded-full blur-2xl" />
        </div>


        <Reveal>
          <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-logo tracking-[0.04em] leading-[1.05] whitespace-pre-line">
            {t("heroTitle")}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="relative mt-8 text-lg md:text-xl text-contrast/40 max-w-2xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
        </Reveal>
      </section>

      {/* ── What: 3 steps ─────────────────────────────────────── */}
      <section className="pb-36 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-0">
          {whatCards.map((card, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="relative group py-10 px-8 md:px-12 h-full">
                {/* Vertical divider (desktop) */}
                {i > 0 && (
                  <div className="hidden md:block absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-contrast/[0.07] to-transparent" />
                )}
                {/* Horizontal divider (mobile) */}
                {i > 0 && (
                  <div className="md:hidden absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-contrast/[0.07] to-transparent" />
                )}

                {/* Big step number */}
                <span className="block text-7xl md:text-8xl font-mono font-black text-accent/80 leading-none select-none tracking-tighter">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="text-2xl md:text-3xl font-brand text-contrast mt-6 mb-4">{card.title}</h3>
                <p className="text-base md:text-lg text-contrast/40 leading-relaxed">{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────── */}
      <section className="pb-36 px-6 max-w-6xl mx-auto">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-brand text-center mb-5">
            {t("forWhoTitle")}
          </h2>
          <p className="text-base text-contrast/30 text-center mb-16 max-w-lg mx-auto leading-relaxed">
            {t("forWhoSubtitle")}
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {forWhoItems.map((item, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="group relative p-8 rounded-2xl border border-contrast/[0.08] hover:border-contrast/[0.15] transition-all duration-300 cursor-default h-full overflow-hidden"
                style={{ background: CARD_GRADIENTS[i] || CARD_GRADIENTS[5] }}
              >
                {/* Grain overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl mix-blend-soft-light opacity-60" aria-hidden>
                  <filter id={`grain-${i}`}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                  <rect width="100%" height="100%" filter={`url(#grain-${i})`} />
                </svg>
                {/* Subtle inner glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-contrast/[0.04] rounded-full blur-3xl pointer-events-none" />

                <span className="relative block mb-6 text-contrast/80 group-hover:text-accent/80 transition-colors duration-300">
                  {FOR_WHO_ICONS[item.icon]}
                </span>
                <p className="relative text-xl font-semibold text-contrast mb-3">{item.label}</p>
                <p className="relative text-base text-contrast/50 leading-relaxed group-hover:text-contrast/65 transition-colors duration-300">{item.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="pb-36 px-6 max-w-5xl mx-auto">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-brand text-center mb-24">
            {t("howTitle")}
          </h2>
        </Reveal>

        <div className="relative">
          {/* Connecting line — thick accent gradient */}
          <div className="absolute left-[52px] md:left-[72px] top-20 bottom-20 w-[2px] bg-gradient-to-b from-accent/30 via-accent/10 to-transparent" />

          <div className="space-y-20 md:space-y-24">
            {howSteps.map((step, i) => (
              <Reveal key={i} delay={i * 0.14}>
                <div className="flex items-start gap-8 md:gap-14">
                  {/* Number — oversized, bold presence */}
                  <div className="relative flex-shrink-0">
                    <div className="w-[104px] h-[104px] md:w-36 md:h-36 rounded-3xl border border-accent/15 bg-surface-1/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-5xl md:text-7xl font-mono font-black text-accent/70 tracking-tighter">{step.num}</span>
                    </div>
                    {/* Glow behind */}
                    <div className="absolute -inset-3 rounded-3xl bg-accent/[0.06] blur-2xl pointer-events-none" />
                    {/* Corner accent dot */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent/40" />
                  </div>
                  <div className="pt-4 md:pt-10">
                    <h3 className="text-2xl md:text-3xl font-brand text-contrast mb-4">{step.title}</h3>
                    <p className="text-base md:text-lg text-contrast/40 leading-relaxed max-w-lg">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ras ───────────────────────────────────────────────── */}
      <section className="pb-36 px-6 max-w-5xl mx-auto">
        <Reveal>
          <div className="relative">
            {/* Outer glow — dramatic */}
            <div className="absolute -inset-8 rounded-4xl bg-gradient-to-br from-accent/[0.1] via-transparent to-accent/[0.06] blur-3xl pointer-events-none" />

            <div className="relative rounded-4xl border border-contrast/[0.08] overflow-hidden"
              style={{ background: "linear-gradient(160deg, #161620 0%, #0e0e14 40%, #12111a 100%)" }}>
              {/* Top accent bar — thicker */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

              {/* Grain texture */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-soft-light opacity-40" aria-hidden>
                <filter id="grain-ras">
                  <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grain-ras)" />
              </svg>

              <div className="relative p-8 md:p-14 lg:p-16">
                {/* Layout: stacked on mobile, side-by-side on desktop */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

                  {/* Left column: photo + name + social */}
                  <div className="flex flex-col items-center lg:items-start flex-shrink-0 lg:w-64">
                    {/* Photo — large with accent glow */}
                    <div className="relative mb-8">
                      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-accent/25 via-accent/5 to-transparent blur-lg" />
                      <img
                        src="/team/ras.jpg"
                        alt="Ras Alungei"
                        className="relative w-40 h-40 md:w-48 md:h-48 rounded-3xl object-cover ring-1 ring-contrast/[0.1] shadow-2xl"
                      />
                      {/* Floating accent dot */}
                      <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-accent/60 blur-[1px]" />
                    </div>

                    {/* Name + role */}
                    <h2 className="text-3xl md:text-4xl font-brand text-contrast leading-tight text-center lg:text-left">{t("rasTitle")}</h2>
                    <p className="text-base text-accent/50 mt-2 font-body tracking-widest uppercase text-center lg:text-left">{t("rasRole")}</p>

                    {/* LinkedIn — prominent */}
                    <a
                      href="https://www.linkedin.com/in/ras-alungei/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-contrast/[0.08] bg-contrast/[0.03] hover:border-accent/30 hover:bg-accent/[0.05] text-contrast/50 hover:text-accent transition-all duration-300"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      <span className="text-sm font-medium">{t("linkedIn")}</span>
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </a>
                  </div>

                  {/* Right column: bio — large, spacious, easy to read */}
                  <div className="flex-1 lg:pt-4">
                    {/* Vertical accent line on desktop */}
                    <div className="hidden lg:block absolute left-[calc(16rem+3.5rem)] top-16 bottom-16 w-px bg-gradient-to-b from-accent/20 via-accent/5 to-transparent" />

                    <div className="space-y-7">
                      <p className="text-lg md:text-xl text-contrast/60 leading-[1.9] font-body">
                        {t("rasBio1")}
                      </p>
                      <p className="text-lg md:text-xl text-contrast/55 leading-[1.9] font-body">
                        {t("rasBio2")}
                      </p>
                      <p className="text-lg md:text-xl text-contrast/45 leading-[1.9] font-body italic">
                        {t("rasBio3")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="pb-40 px-6 max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="text-contrast/30 text-lg mb-10">{t("ctaLine")}</p>
          <Link
            href="/"
            className="group relative inline-block"
          >
            <div className="absolute -inset-2 rounded-2xl bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative inline-block px-12 py-5 rounded-xl bg-accent text-surface-0 text-lg font-brand tracking-wide hover:bg-accent-bright hover:shadow-[0_8px_40px_rgba(232,168,56,0.3)] transition-all duration-300 active:scale-[0.98]">
              {t("ctaButton")}
            </span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
