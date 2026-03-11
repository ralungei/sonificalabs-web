"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { GalaxyButton } from "@/components/GalaxyButton";

/* ── Separator 1 — Filmstrip (editing/video since kid) ────────── */

function FilmstripIcon() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="flex justify-center" aria-hidden>
      <motion.svg
        viewBox="0 0 16 16"
        className="w-24 h-24 text-contrast/50"
        fill="currentColor"
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <path fillRule="evenodd" d="M11.5 3.5h.5A1.5 1.5 0 0 1 13.5 5v.5h-2zm0 3.5v2h2V7zM15 7v4a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3zm-1.5 3.5h-2v2h.5a1.5 1.5 0 0 0 1.5-1.5zm-3.5-7H6v9h4zm-5.5 9v-2h-2v.5A1.5 1.5 0 0 0 4 12.5zm0-5.5v2h-2V7zm0-1.5h-2V5A1.5 1.5 0 0 1 4 3.5h.5z" clipRule="evenodd" />
      </motion.svg>
    </div>
  );
}

/* ── Separator 2 — Lightbulb (the idea moment) ───────────────── */

function LightbulbIcon() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="flex justify-center" aria-hidden>
      <motion.svg
        viewBox="0 0 16 16"
        className="w-24 h-24 text-accent/60"
        fill="currentColor"
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <g>
          <path fillRule="evenodd" d="M6.26 15.109a4 4 0 0 0 3.48 0l.13-.063a2 2 0 0 0 1.13-1.8v-.468c0-1.352.776-2.557 1.54-3.673a5.5 5.5 0 1 0-9.08 0C4.224 10.221 5 11.426 5 12.779v.467a2 2 0 0 0 1.13 1.801zm2.828-1.35l.13-.064a.5.5 0 0 0 .282-.45v-.467q0-.255.025-.5a5.33 5.33 0 0 1-3.05 0q.024.245.025.5v.467a.5.5 0 0 0 .282.45l.13.063a2.5 2.5 0 0 0 2.176 0m-4.39-5.501c.394.576.891 1.302 1.263 2.148a3.79 3.79 0 0 0 4.078 0c.372-.846.869-1.572 1.264-2.148a4 4 0 1 0-6.605 0" clipRule="evenodd" />
          <path d="M8 3.5A.75.75 0 0 0 8 5a1 1 0 0 1 1 1a.75.75 0 0 0 1.5 0A2.5 2.5 0 0 0 8 3.5" />
        </g>
      </motion.svg>
    </div>
  );
}

/* ── Fade-in on scroll ─────────────────────────────────────────── */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function AboutPage() {
  const t = useTranslations("about");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <main className="min-h-screen bg-surface-0 text-contrast overflow-x-hidden">
      <Navbar />

      {/* ── Hero: Full-bleed photo + name ───────────────────── */}
      <section ref={heroRef} className="relative h-[85vh] md:h-[90vh] overflow-hidden">
        {/* Photo background with parallax */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ y: heroY, scale: imgScale }}
          className="absolute inset-0"
        >
          <img
            src="/team/ras.jpg"
            alt="Ras"
            className="w-full h-full object-cover object-[center_10%]"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/30 to-transparent" />
        </motion.div>

        {/* Name + role pinned at bottom */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-0 left-0 right-0 px-6 pb-14 md:pb-20"
        >
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-[clamp(2.5rem,7vw,5rem)] font-body font-black leading-[0.95] tracking-tight"
            >
              {t("rasTitle")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-3 text-body-lg md:text-heading-sm text-contrast/50 font-body tracking-wide"
            >
              {t("rasRole")}
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* ── Bio sections — each paragraph gets its own block ── */}
      <section className="relative px-6 py-28 md:py-40">
        <div className="max-w-2xl mx-auto space-y-10 md:space-y-12">
          <Reveal>
            <p className="text-heading-md md:text-heading-lg font-body leading-relaxed text-contrast/70">
              {t("rasBio1")}
            </p>
          </Reveal>

          <FilmstripIcon />

          <Reveal delay={0.05}>
            <p className="text-heading-md md:text-heading-lg font-body leading-relaxed text-contrast/55">
              {t("rasBio2")}
            </p>
          </Reveal>

          <LightbulbIcon />

          <Reveal delay={0.05}>
            <p className="text-heading-md md:text-heading-lg font-body leading-relaxed text-contrast/70">
              {t("rasBio3")}
            </p>
          </Reveal>

          {/* LinkedIn */}
          <Reveal delay={0.05}>
            <a
              href="https://www.linkedin.com/in/ras-alungei/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-heading-sm text-contrast/40 hover:text-[#0A66C2] transition-colors duration-300 group"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>{t("linkedIn")}</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="pb-40 px-6 text-center">
        <Reveal>
          <p className="text-contrast/30 text-heading-sm mb-10">{t("ctaLine")}</p>
          <Link href="/">
            <GalaxyButton>
              {t("ctaButton")}
            </GalaxyButton>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
