"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/* ── Icons ─────────────────────────────────────────────────────── */

type IconProps = { size?: number; className?: string; strokeWidth?: number };

function Svg({ size = 16, className, strokeWidth = 2.4, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => <Svg {...p}><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></Svg>;
export const ArrowDown = (p: IconProps) => <Svg {...p}><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></Svg>;
export const Check = (p: IconProps) => <Svg strokeWidth={3.2} {...p}><path d="M20 6 9 17l-5-5" /></Svg>;
export const Paperclip = (p: IconProps) => <Svg strokeWidth={2} {...p}><path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></Svg>;
export const FileIcon = (p: IconProps) => <Svg strokeWidth={2.2} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></Svg>;
export const Close = (p: IconProps) => <Svg strokeWidth={3} {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const Gift = (p: IconProps) => <Svg strokeWidth={2.3} {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></Svg>;
export const Briefcase = (p: IconProps) => <Svg strokeWidth={2.2} {...p}><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>;
export const Download = (p: IconProps) => <Svg {...p}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></Svg>;

/** Play triangle, or two pause bars while playing. */
export function PlayPause({ playing, size }: { playing: boolean; size: number }) {
  if (playing) {
    return (
      <span className="flex" style={{ gap: size * 0.22 }} aria-hidden>
        <span style={{ width: size * 0.26, height: size, borderRadius: 2, background: "currentColor" }} />
        <span style={{ width: size * 0.26, height: size, borderRadius: 2, background: "currentColor" }} />
      </span>
    );
  }
  return (
    <svg width={size * 1.2} height={size * 1.2} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: size * 0.15 }} aria-hidden>
      <path d="M7 4v16l13-8Z" />
    </svg>
  );
}

/** Path data icon, for icon sets kept as data (cards, chips). */
export function PathIcon({ d, size = 16, strokeWidth = 2 }: { d: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: d }} />
  );
}

/* ── Headline keyword ──────────────────────────────────────────── */

export const KW_GRADIENTS = {
  teal: "linear-gradient(100deg,#0d9488 0%,#0e9aa3 40%,#0e7fa6 75%,#2f6fb0 100%)",
  deep: "linear-gradient(100deg,#0f766e 0%,#0d9488 60%,#14b8a6 100%)",
  mint: "linear-gradient(100deg,#0d9488 0%,#14b8a6 50%,#0e9aa3 100%)",
} as const;

/** Underline inks: the hero keeps the dark one, every other section gets its own. */
export const KW_LINES = {
  ink: "var(--color-ink)",
  aqua: "linear-gradient(90deg,#5eead4,#14b8a6)",
  amber: "linear-gradient(90deg,#fcd34d,#f59e0b)",
  coral: "linear-gradient(90deg,#fdba74,#f97362)",
  rose: "linear-gradient(90deg,#f9a8d4,#f43f5e)",
  violet: "linear-gradient(90deg,#a5b4fc,#c084fc,#f0abfc)",
} as const;

/**
 * Text gradient that goes with each coloured underline: the same hue, a step
 * deeper so the word still reads on white.
 */
const KW_LINE_TEXT: Record<Exclude<keyof typeof KW_LINES, "ink">, string> = {
  aqua: "linear-gradient(100deg,#0f766e 0%,#0d9488 55%,#14b8a6 100%)",
  amber: "linear-gradient(100deg,#c2410c 0%,#d97706 55%,#f59e0b 100%)",
  coral: "linear-gradient(100deg,#e8590c 0%,#f0603f 55%,#f97362 100%)",
  rose: "linear-gradient(100deg,#be185d 0%,#e11d48 55%,#f43f5e 100%)",
  violet: "linear-gradient(100deg,#4f46e5 0%,#7c3aed 50%,#c026d3 100%)",
};

/**
 * The highlighted word of a headline: display face, gradient ink and an
 * optional hand-drawn underline (flat and drawn in, or tilted). A coloured
 * underline brings its own text gradient; `gradient` applies otherwise.
 */
export function Keyword({
  children,
  gradient = "teal",
  underline,
  line = "ink",
}: {
  children: ReactNode;
  gradient?: keyof typeof KW_GRADIENTS;
  underline?: "draw" | "tilt";
  line?: keyof typeof KW_LINES;
}) {
  const background = KW_LINES[line];
  const text = line === "ink" ? KW_GRADIENTS[gradient] : KW_LINE_TEXT[line];
  return (
    <span className="kw" style={{ backgroundImage: text }}>
      {children}
      {underline === "draw" && (
        <span className="kw-line" style={{ background, animation: "draw .9s .9s cubic-bezier(.6,0,.2,1) both" }} />
      )}
      {underline === "tilt" && <span className="kw-line" style={{ background, transform: "rotate(-3deg)" }} />}
    </span>
  );
}

/* ── Buttons ───────────────────────────────────────────────────── */

/** Small round "→" that sits at the end of every primary button. */
export function ArrowDot({ size = 40, tone = "light" }: { size?: number; tone?: "light" | "dark" | "teal" | "violet" | "gradient" }) {
  const styles: Record<string, CSSProperties> = {
    light: { background: "#fff", color: "var(--color-ink)" },
    dark: { background: "var(--color-ink)", color: "#fff" },
    teal: { background: "#fff", color: "var(--color-accent)" },
    violet: { background: "#fff", color: "#7c3aed" },
    gradient: { background: "linear-gradient(120deg,#0d9488,#2f8fb8)", color: "#fff" },
  };
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, ...styles[tone] }}>
      <ArrowRight size={Math.round(size * 0.38)} strokeWidth={2.6} />
    </span>
  );
}

type PillVariant = "dark" | "teal" | "violet" | "outline";

const PILL: Record<PillVariant, string> = {
  dark: "bg-ink text-white hover:bg-accent",
  teal: "bg-accent text-white hover:bg-ink",
  violet: "bg-[#7c3aed] text-white hover:bg-ink",
  outline: "border border-contrast/15 bg-white text-ink hover:border-accent hover:text-accent",
};

export function PillLink({
  href,
  children,
  variant = "dark",
  arrow = true,
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: PillVariant;
  arrow?: boolean;
  external?: boolean;
  className?: string;
}) {
  const cls = cn(
    "inline-flex h-12 items-center gap-2.5 rounded-full text-[15px] font-medium tracking-[-0.02em] transition-colors",
    arrow ? "pl-5 pr-1.5" : "px-5",
    PILL[variant],
    className,
  );
  const dot = arrow ? <ArrowDot size={36} tone={variant === "outline" ? "dark" : variant === "teal" ? "teal" : variant === "violet" ? "violet" : "light"} /> : null;
  if (external || href.startsWith("mailto:") || href.startsWith("#")) {
    return <a href={href} className={cls}>{children}{dot}</a>;
  }
  return <Link href={href} className={cls}>{children}{dot}</Link>;
}

/* ── Scroll reveal ─────────────────────────────────────────────── */

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Looping texture video, loaded only when on screen ─────────── */

export function TextureVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.getAttribute("src")) { v.src = src; v.load(); }
        if (!reduce) v.play().catch(() => {});
      } else if (v.getAttribute("src")) {
        v.pause();
      }
    }, { rootMargin: "150px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, [src]);
  return (
    <video ref={ref} muted loop playsInline preload="none" aria-hidden
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      style={{ filter: "saturate(1.35) contrast(1.12)" }} />
  );
}

/* ── Mini waveform (decorative, optionally live) ──────────────── */

export function Bars({ n, pct, live, color = "#0d9488", dim = "#d9e6e4" }: { n: number; pct?: number | null; live?: boolean; color?: string; dim?: string }) {
  return (
    <div className="flex h-full items-center gap-[3px]" aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const h = 0.18 + 0.82 * Math.abs(Math.sin(i * 0.5 + 1) * Math.cos(i * 0.16 + 2));
        const lit = pct == null || (i / n) * 100 < pct;
        return (
          <span key={i} data-eq className="flex-1 rounded-[3px]"
            style={{
              minWidth: 2,
              height: `${Math.round(h * 100)}%`,
              background: lit ? color : dim,
              transformOrigin: "center",
              transition: "height .4s",
              animation: live ? `eq ${1.1 + (i % 5) * 0.18}s ease-in-out ${-(i * 0.11).toFixed(2)}s infinite` : "none",
            }} />
        );
      })}
    </div>
  );
}
