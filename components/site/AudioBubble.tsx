"use client";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { PlayPause, TextureVideo } from "./ui";
import { toggleDemo, useDemoAudio } from "./demo-audio";

/**
 * A round play button for one demo: the ring fills as it plays, a looping
 * texture video (or a tinted gradient) sits behind the icon.
 */
export function AudioBubble({
  id,
  src,
  label,
  size,
  texture,
  color = "#0d9488",
  fallbackFill,
  labelVariant = "pill",
  onPlay,
  className,
  style,
}: {
  id: string;
  src: string;
  label: string;
  size: number;
  texture?: string;
  /** Ring and accent colour. */
  color?: string;
  /** Background when there is no texture video. */
  fallbackFill?: string;
  /** pill: small label in a white pill; caps: uppercase tag; plain: text only. */
  labelVariant?: "pill" | "caps" | "plain";
  onPlay?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const t = useTranslations("landing");
  const { playingId, progress } = useDemoAudio();
  const on = playingId === id;
  const rgb = color;
  const inset = Math.round(size * 0.065);
  const icon = Math.round(size * 0.34);

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ""}`} style={style}>
      <button
        type="button"
        aria-label={t("listen", { name: label })}
        aria-pressed={on}
        onClick={() => { toggleDemo(id, src); if (!on) onPlay?.(); }}
        className="relative isolate shrink-0 cursor-pointer rounded-full border-0 p-0 transition-[box-shadow,transform] duration-300 hover:scale-[1.06]"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${rgb} ${on ? progress : 0}%, ${on ? `${rgb}40` : "#fff"} 0)`,
          boxShadow: on
            ? `0 0 0 2px ${rgb}, 0 12px 28px -14px rgba(15,42,46,.45)`
            : "0 0 0 1px rgba(15,42,46,.1), 0 12px 28px -14px rgba(15,42,46,.45)",
          transform: on ? "scale(1.06)" : undefined,
        }}
      >
        <span aria-hidden className="pointer-events-none absolute -z-10 rounded-full"
          style={{ left: "10%", right: "10%", top: "20%", bottom: "-10%", background: "radial-gradient(closest-side,rgba(13,148,136,.35),transparent)", filter: "blur(10px)" }} />
        <span className="absolute flex items-center justify-center overflow-hidden rounded-full"
          style={{ inset, background: texture ? "#0F2A2E" : fallbackFill ?? `radial-gradient(circle at 30% 25%, #ffffff55, transparent 55%), linear-gradient(140deg, ${rgb}, #0F2A2E)` }}>
          {texture && <TextureVideo src={texture} />}
          <span className="relative flex items-center justify-center rounded-full text-ink"
            style={{ width: icon, height: icon, background: "rgba(255,255,255,.94)" }}>
            <PlayPause playing={on} size={Math.max(8, Math.round(size * 0.1))} />
          </span>
        </span>
      </button>
      {labelVariant === "pill" && (
        <span className="whitespace-nowrap rounded-full border bg-white px-2.5 py-[3px] text-xs font-medium"
          style={{ borderColor: on ? color : "rgba(15,42,46,.08)", color: "#0f766e" }}>
          {label}
        </span>
      )}
      {labelVariant === "caps" && (
        <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[.08em]"
          style={{ background: on ? color : "rgba(246,251,250,.8)", color: on ? "#fff" : "#0F2A2E" }}>
          {label}
        </span>
      )}
      {labelVariant === "plain" && (
        <span className="max-w-[9rem] text-center text-sm font-medium tracking-[-0.01em]" style={{ color: on ? color : "#0F2A2E" }}>
          {label}
        </span>
      )}
    </div>
  );
}
