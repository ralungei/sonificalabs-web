"use client";
import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { GalaxyButton } from "@/components/GalaxyButton";

/* ── Sound Wave — oscilloscope line that draws itself ──────────── */

function SoundWave() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  // Generate a natural-looking audio waveform path
  const { path, length } = useMemo(() => {
    const W = 400;
    const H = 60;
    const mid = H / 2;
    const points: string[] = [`M 0 ${mid}`];
    const segments = 80;

    for (let i = 1; i <= segments; i++) {
      const x = (i / segments) * W;
      const t = i / segments;
      // Envelope: silence → burst → silence, like a real audio clip
      const env =
        Math.sin(t * Math.PI) *
        (0.4 + 0.6 * Math.sin(t * Math.PI * 3.2)) *
        (1 - 0.3 * Math.cos(t * Math.PI * 7));
      // Pseudo-random oscillation
      const noise = Math.sin(i * 13.7) * 0.5 + Math.sin(i * 7.3) * 0.3 + Math.sin(i * 23.1) * 0.2;
      const y = mid + noise * env * (mid - 4);
      points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    const d = points.join(" ");
    // Approximate path length
    const approxLen = W * 1.4;
    return { path: d, length: approxLen };
  }, []);

  return (
    <div ref={ref} className="relative w-full flex justify-center py-4" aria-hidden>
      <svg
        viewBox="0 0 400 60"
        className="w-full max-w-lg h-16"
        fill="none"
        preserveAspectRatio="none"
      >
        {/* Ghost trace — faint background line */}
        <motion.path
          d={path}
          stroke="var(--color-accent)"
          strokeWidth="1"
          strokeOpacity={0.08}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
        {/* Main signal line */}
        <motion.path
          d={path}
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            inView
              ? { pathLength: 1, opacity: [0, 0.6, 0.5] }
              : { pathLength: 0, opacity: 0 }
          }
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Bright leading edge glow */}
        <motion.path
          d={path}
          stroke="var(--color-accent-bright)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          style={{ filter: "blur(3px)" }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            inView
              ? { pathLength: 1, opacity: [0, 0.3, 0] }
              : { pathLength: 0, opacity: 0 }
          }
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}

/* ── Speaker Rings — concentric pulses from center ─────────────── */

function SpeakerRings() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const RING_COUNT = 4;

  return (
    <div ref={ref} className="relative flex items-center justify-center h-24" aria-hidden>
      {/* Center dot */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.1, type: "spring", bounce: 0.5 }}
        className="absolute w-2.5 h-2.5 rounded-full bg-accent/50"
      />
      {/* Expanding rings */}
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-accent/[var(--ring-opacity)]"
          style={{
            "--ring-opacity": `${0.3 - i * 0.06}`,
            width: `${24 + i * 28}px`,
            height: `${24 + i * 28}px`,
          } as React.CSSProperties}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            inView
              ? { scale: [0, 1.1, 1], opacity: [0, 1, 0.8 - i * 0.15] }
              : { scale: 0, opacity: 0 }
          }
          transition={{
            duration: 0.8,
            delay: 0.2 + i * 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
      {/* Soft glow behind */}
      <motion.div
        className="absolute w-28 h-28 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={inView ? { opacity: 0.06, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />
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
        <div className="max-w-2xl mx-auto space-y-24 md:space-y-32">
          <Reveal>
            <p className="text-heading-md md:text-heading-lg font-body leading-relaxed text-contrast/70">
              {t("rasBio1")}
            </p>
          </Reveal>

          <SoundWave />

          <Reveal delay={0.05}>
            <p className="text-heading-md md:text-heading-lg font-body leading-relaxed text-contrast/55">
              {t("rasBio2")}
            </p>
          </Reveal>

          <SpeakerRings />

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
