"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AudioBubble } from "@/components/site/AudioBubble";
import { toggleDemo, useDemoAudio } from "@/components/site/demo-audio";
import {
  ArrowDot, ArrowDown, ArrowRight, Bars, Briefcase, Check, Gift as GiftIcon, Keyword, PathIcon, PillLink, PlayPause, Reveal, Download,
} from "@/components/site/ui";
import { DEMOS, demoSrc, findDemo } from "@/lib/demos";

/** Sends an idea to the prompt box at the top of the page. */
export type PickPrompt = (prompt: string) => void;

const SECTION = "relative px-[clamp(18px,4vw,48px)] pt-[clamp(89px,11vw,144px)]";
const H2_BIG = "m-0 text-balance text-[clamp(34px,5.4vw,89px)] font-normal leading-none tracking-[-0.065em]";
const H2 = "m-0 text-balance text-[clamp(34px,4.4vw,55px)] font-normal leading-[1.02] tracking-[-0.06em]";

/* ── Antes / Con Sonifica ──────────────────────────────────────── */

export function Problem() {
  const t = useTranslations("landing");
  return (
    <>
      <div id="cap-problema" className={`${SECTION} text-center`}>
        <Reveal className="mx-auto max-w-[980px]">
          <h2 className={H2_BIG}>{t("problemTitle")} <Keyword gradient="deep">{t("problemKeyword")}</Keyword></h2>
        </Reveal>
      </div>
      <section className="relative px-[clamp(18px,4vw,48px)] pt-[clamp(34px,4vw,55px)]">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-stretch justify-center gap-[clamp(16px,3vw,40px)]">
          <Reveal className="flex flex-[1_1_300px] flex-col items-center gap-[21px] px-5 py-[clamp(21px,3vw,34px)] text-center">
            <span className="text-sm font-semibold uppercase tracking-[.1em] text-text-muted">{t("before")}</span>
            <span className="text-[clamp(55px,8vw,89px)] font-normal leading-[.9] tracking-[-0.07em] text-[#b9c4c5] line-through decoration-[rgba(15,42,46,.35)] decoration-4">
              {t("beforeValue")}
            </span>
            <div className="flex max-w-[320px] flex-wrap justify-center gap-[5px]">
              {(t.raw("beforeSteps") as string[]).map((s) => (
                <span key={s} className="rounded-full bg-[#eef1f1] px-3.5 py-[7px] text-sm font-medium text-text-muted">{s}</span>
              ))}
            </div>
          </Reveal>
          <div aria-hidden className="flex shrink-0 items-center justify-center text-accent">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white shadow-[0_14px_30px_-14px_rgba(15,42,46,.4)]">
              <ArrowRight size={20} />
            </span>
          </div>
          <Reveal delay={0.11} className="flex flex-[1_1_300px] flex-col items-center gap-[21px] rounded-[34px] bg-white px-5 py-[clamp(21px,3vw,34px)] text-center shadow-[0_40px_90px_-56px_rgba(13,148,136,.6)]">
            <span className="text-sm font-semibold uppercase tracking-[.1em] text-accent">{t("after")}</span>
            <span className="bg-[linear-gradient(100deg,#0d9488,#2f8fb8)] bg-clip-text text-[clamp(55px,8vw,89px)] font-normal leading-[.9] tracking-[-0.07em] text-transparent">
              {t("afterValue")}
            </span>
            <span className="rounded-full bg-ink px-4 py-[7px] text-sm font-medium text-white">{t("afterTag")}</span>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ── Una frase → voz, música, efectos, duración ────────────────── */

const ANALYSIS_TONES = [
  ["#2dd4bf", "#0d9488", "rgba(45,212,191,.28)"],
  ["#5fb4dc", "#2f7fae", "rgba(95,180,220,.3)"],
  ["#22b8c9", "#0e7490", "rgba(34,184,201,.28)"],
  ["#3fbf9f", "#147a72", "rgba(63,191,159,.28)"],
];
const NOISE = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Solution() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const { playingId } = useDemoAudio();
  const [step, setStep] = useState(0);
  const words = t.raw("examplePrompt") as string[];
  const cards = t.raw("analysis") as { k: string; v: string }[];
  const pizzeria = findDemo("pizzeria");
  const on = playingId === pizzeria.id;

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className={`${SECTION} text-center`}>
        <Reveal className="mx-auto max-w-[980px]">
          <h2 className={H2_BIG}>{t("solutionTitle")} <Keyword gradient="mint">{t("solutionKeyword")}</Keyword></h2>
        </Reveal>
      </div>
      <section className="relative px-[clamp(18px,4vw,48px)] pt-[clamp(34px,4vw,55px)]">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-[21px]">
          <Reveal className="rounded-[21px] border border-contrast/[0.07] bg-white p-[clamp(21px,3.4vw,34px)] shadow-[0_40px_90px_-50px_rgba(13,148,136,.55)]">
            <div className="flex items-center gap-[13px]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                <PathIcon size={18} d='<path d="M3 9h18l-1.5 11a1 1 0 0 1-1 .9h-13a1 1 0 0 1-1-.9z"></path><path d="M8 9V6a4 4 0 0 1 8 0v3"></path>' />
              </span>
              <span className="flex flex-col gap-px">
                <span className="text-base font-medium tracking-[-0.02em]">{t("exampleWho")}</span>
                <span className="text-sm text-text-muted">{t("exampleWhere")}</span>
              </span>
            </div>
            <p className="mb-0 mt-3.5 text-[clamp(21px,3vw,34px)] font-normal leading-[1.3] tracking-[-0.045em]">
              {words.map((w, i) =>
                i % 2 === 0 ? <span key={i}>{w}</span> : (
                  <span key={i} className="rounded-[.2em] px-[.1em] transition-[background] duration-[600ms]"
                    style={{ background: step === (i - 1) / 2 ? ANALYSIS_TONES[(i - 1) / 2][2] : "transparent" }}>{w}</span>
                ))}
            </p>
          </Reveal>
          <div className="flex justify-center text-accent"><ArrowDown size={28} strokeWidth={2.2} /></div>
          <div className="grid grid-cols-2 gap-[13px] min-[900px]:grid-cols-4">
            {cards.map((c, i) => {
              const active = i === step;
              const [a, b] = ANALYSIS_TONES[i];
              return (
                <div key={c.k} className="relative flex flex-col gap-[5px] overflow-hidden rounded-[21px] px-5 pb-[22px] pt-[18px]"
                  style={{
                    background: `${NOISE}, radial-gradient(120% 90% at 0% 0%, ${a}, ${b})`,
                    backgroundBlendMode: "soft-light,normal",
                    boxShadow: active ? `0 26px 50px -24px ${b}` : `0 10px 24px -20px ${b}`,
                    transform: active ? "translateY(-6px) scale(1.02)" : "none",
                    opacity: active ? 1 : 0.62,
                    transition: "opacity .7s ease, box-shadow .7s ease, transform .7s cubic-bezier(.2,.7,.2,1)",
                  }}>
                  <span className="flex items-center gap-2 text-sm font-medium text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />{c.k}
                  </span>
                  <span className="truncate text-[21px] font-medium leading-[1.1] tracking-[-0.035em] text-white">{c.v}</span>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => toggleDemo(pizzeria.id, demoSrc(locale, pizzeria.filename))}
            aria-label={on ? t("resultPlaying") : t("resultLabel")}
            className="flex w-full items-center gap-[clamp(12px,2vw,20px)] rounded-full border border-contrast/10 bg-white py-2.5 pl-2.5 pr-[clamp(14px,2vw,22px)] text-left text-ink shadow-[0_24px_50px_-30px_rgba(15,42,46,.35)] transition-transform hover:-translate-y-0.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-white"><PlayPause playing={on} size={12} /></span>
            <span className="flex shrink-0 flex-col gap-px">
              <span className="text-base font-medium tracking-[-0.02em]">{on ? t("resultPlaying") : t("resultLabel")}</span>
              <span className="text-[13px] text-text-muted">{t("resultFile")}</span>
            </span>
            <span className="h-[34px] min-w-0 flex-1 overflow-hidden"><Bars n={36} live={on} color={on ? "#0F2A2E" : "#c9d3d4"} /></span>
            <span className="shrink-0 text-sm tabular-nums text-text-muted">0:20</span>
          </button>
        </div>
      </section>
    </>
  );
}

/* ── Ideas para tu día a día ───────────────────────────────────── */

const IDEA_ICONS = [
  '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V11"></path><path d="M10 6h8M10 10h8M10 14h5"></path>',
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M8 13h8M8 17h5"></path>',
  '<path d="M22 10 12 5 2 10l10 5 10-5Z"></path><path d="M6 12v5c3 2 9 2 12 0v-5"></path>',
  '<rect x="3" y="8" width="18" height="13" rx="2"></rect><path d="M12 8v13M3 12h18"></path><path d="M12 8c-2-4-6-4-6-1.5S9 8 12 8Zm0 0c2-4 6-4 6-1.5S15 8 12 8Z"></path>',
  '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5a2.5 2.5 0 0 0 0 5H20"></path>',
  '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>',
];

/** Demos an idea can play: the catalogue plus one that only lives here. */
function ideaDemo(id: string, locale: string): { id: string; src: string } | null {
  if (id === "cumple") return { id: "cumple", src: "/demos/es/demo-cumple-epico.mp3" };
  const d = DEMOS.find((x) => x.id === id);
  return d ? { id: d.id, src: demoSrc(locale, d.filename) } : null;
}

export function Ideas({ onPick }: { onPick: PickPrompt }) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const { playingId } = useDemoAudio();
  const ideas = t.raw("ideas") as { moment: string; title: string; prompt: string; demo?: string }[];

  return (
    <section id="ideas" className={`${SECTION} scroll-mt-10`}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[clamp(24px,3.5vw,44px)]">
        <Reveal>
          <h2 className={H2}>{t("ideasTitle")} <Keyword underline="tilt" line="amber">{t("ideasKeyword")}</Keyword></h2>
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] gap-[13px]">
          {ideas.map((idea, i) => {
            const demo = idea.demo ? ideaDemo(idea.demo, locale) : null;
            const on = demo !== null && playingId === demo.id;
            return (
              <Reveal key={idea.title} delay={Math.min(i, 6) * 0.06}
                className="relative flex h-full flex-col gap-[21px] overflow-hidden rounded-[21px] border border-contrast/[0.06] bg-white p-6 shadow-[0_20px_50px_-34px_rgba(15,42,46,.4)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,.35)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink"><PathIcon d={IDEA_ICONS[i]} size={38} strokeWidth={1.7} /></span>
                  <span className="rounded-full bg-[#f2f2f2] px-3 py-1.5 text-[13px] font-medium text-[#111]">{idea.moment}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-balance text-[26px] font-medium leading-[1.05] tracking-[-0.045em]">{idea.title}</span>
                  <p className="m-0 text-base leading-[1.45] text-text-secondary">“{idea.prompt}”</p>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <button type="button" onClick={() => onPick(idea.prompt)}
                    className="flex h-[46px] items-center gap-2 rounded-full bg-ink pl-[18px] pr-1.5 text-[15px] font-medium text-white hover:bg-black">
                    {t("try")}<ArrowDot size={34} />
                  </button>
                  {demo && (
                    <button type="button" onClick={() => toggleDemo(demo.id, demo.src)}
                      className="flex h-[46px] items-center gap-2 rounded-full border border-contrast/15 bg-white px-4 text-[15px] font-medium text-ink hover:border-ink">
                      <PlayPause playing={on} size={11} />{on ? t("pause") : t("play")}
                    </button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Escucha lo que puedes crear ───────────────────────────────── */

const ROW: [id: string, size: number][] = [
  ["pizzeria", 132], ["audiocuento", 92], ["thriller", 150], ["meditacion", 84],
  ["informativo", 118], ["trailer", 100], ["documental", 126],
];

export function DemoRow() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const { playingId } = useDemoAudio();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(window.innerWidth < 820 ? 0.7 : window.innerWidth < 1200 ? 0.78 : 1);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const now = ROW.find(([id]) => id === playingId);

  return (
    <section id="ejemplos" className={`${SECTION} scroll-mt-10`}>
      <Reveal className="mb-[clamp(34px,3.5vw,55px)] text-center">
        <h2 className={H2}>{t("demosTitle")}</h2>
      </Reveal>
      <div className="no-scrollbar mx-auto flex max-w-[1180px] items-center gap-[clamp(10px,1.8vw,28px)] overflow-x-auto px-1 pb-[18px] pt-3"
        style={{ justifyContent: "safe center" }}>
        {ROW.map(([id, size]) => {
          const d = findDemo(id);
          return (
            <AudioBubble key={id} id={d.id} src={demoSrc(locale, d.filename)} texture={d.texture}
              size={Math.round(size * scale)} label={t(`bubbles.${id}.label` as Parameters<typeof t>[0])} labelVariant="caps" />
          );
        })}
      </div>
      <div className="mx-auto mt-[18px] flex min-h-16 max-w-[680px] items-center justify-center text-center">
        {now && (
          <p key={now[0]} className="m-0 text-[clamp(18px,1.8vw,21px)] leading-[1.35] tracking-[-0.03em] anim-rise">
            “{t(`bubbles.${now[0]}.prompt` as Parameters<typeof t>[0])}”
          </p>
        )}
      </div>
      <div className="mt-2 flex justify-center">
        <PillLink href="/examples" variant="outline">{t("seeAll", { count: DEMOS.length })}</PillLink>
      </div>
    </section>
  );
}

/* ── Tu audio viene con todo ───────────────────────────────────── */

const FEATURE_IMAGES = [
  "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=700&q=70&auto=format&fit=crop",
];

export function Features() {
  const t = useTranslations("landing");
  const features = t.raw("features") as { title: string; desc: string }[];
  return (
    <section className={SECTION}>
      <Reveal className="mb-[clamp(34px,3.5vw,55px)] text-center">
        <h2 className={H2}>{t("featuresTitle")}</h2>
      </Reveal>
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-[13px] min-[900px]:grid-cols-4">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}
            className="flex h-full flex-col overflow-hidden rounded-[21px] bg-white shadow-[0_20px_50px_-34px_rgba(0,0,0,.35)] transition-transform duration-300 hover:-translate-y-1">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
              <img src={FEATURE_IMAGES[i]} alt="" loading="lazy" className="block h-full w-full object-cover" style={{ filter: "grayscale(1) contrast(1.08)" }} />
            </div>
            <div className="flex flex-col gap-[5px] px-[22px] pb-6 pt-5">
              <span className="text-[clamp(19px,2vw,24px)] font-medium tracking-[-0.02em] text-[#111]">{f.title}</span>
              <span className="text-base text-[#444]">{f.desc}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Dentro de una frase ───────────────────────────────────────── */

const LANE_TONES = [
  { from: "#7ff0d6", to: "#1fb5a3", ink: "#0b5f57", word: "#0d9488", bg: "rgba(45,212,191,.16)" },
  { from: "#a9d8f2", to: "#4f9fc7", ink: "#174e6b", word: "#2f7fae", bg: "rgba(95,180,220,.18)" },
  { from: "#9fd9e6", to: "#3a8fa6", ink: "#123f4a", word: "#1f6f80", bg: "rgba(58,143,166,.16)" },
];
const LANE_NOISE = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

type Scene = { name: string; words: string[]; what: string[]; marks: [number, string][] };

function laneBars(lane: number, seed: number, marks: [number, string][], n: number): number[] {
  const rnd = (k: number) => { const x = Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); };
  return Array.from({ length: n }, (_, j) => {
    const t = j / n;
    let v: number;
    if (lane === 0) v = 12 + Math.pow(Math.max(0, Math.sin(t * 6.3 + seed)), 0.7) * (62 + rnd(j) * 18);
    else if (lane === 1) v = 34 + 22 * Math.sin(t * 5 + seed * 2) + 6 * Math.sin(t * 13);
    else {
      v = 10;
      marks.forEach(([x]) => { const d = Math.abs(t * 100 - x); if (d < 8) v = Math.max(v, 90 * Math.cos((d / 8) * Math.PI / 2)); });
    }
    return Math.max(5, Math.min(100, v));
  });
}

export function Inside({ onPick }: { onPick: PickPrompt }) {
  const t = useTranslations("landing");
  const scenes = t.raw("scenes") as Scene[];
  const lanes = t.raw("lanes") as string[];
  const [i, setI] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const sc = scenes[i];

  useEffect(() => {
    const fit = () => setNarrow(window.innerWidth < 820);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const n = narrow ? 22 : 44;
  const bars = useMemo(() => lanes.map((_, k) => laneBars(k, i + 1, sc.marks, n)), [lanes, i, sc.marks, n]);

  return (
    <section id="dentro" className="relative px-[clamp(12px,3vw,40px)] pt-[clamp(89px,11vw,144px)]">
      <div className="relative mx-auto max-w-[1180px] px-[clamp(6px,2vw,24px)]">
        <Reveal className="flex flex-col gap-[clamp(22px,3vw,36px)]">
          <div className="flex flex-wrap items-end justify-between gap-[21px]">
            <h2 className={`${H2} max-w-[640px]`}>{t("insideTitle")}</h2>
            <div role="tablist" className="flex gap-[5px] rounded-full bg-[#f1f4f4] p-[5px]">
              {scenes.map((s, k) => (
                <button key={s.name} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}
                  className="h-10 rounded-full px-[18px] text-[15px] font-medium transition-[background,color] duration-300"
                  style={{ background: k === i ? "#0F2A2E" : "transparent", color: k === i ? "#fff" : "#33494d" }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <p className="m-0 max-w-[900px] text-pretty text-[clamp(21px,2.7vw,34px)] leading-[1.3] tracking-[-0.035em] text-text-muted">
            “{sc.words.map((w, k) => k % 2 === 0
              ? <span key={k}>{w}</span>
              : <span key={k} className="rounded-lg px-1.5 transition-[color,background] duration-[400ms]"
                  style={{ color: LANE_TONES[(k - 1) / 2].word, background: LANE_TONES[(k - 1) / 2].bg }}>{w}</span>)}”
          </p>
          <div className="grid gap-x-[clamp(12px,2vw,24px)] gap-y-[13px] border-y border-contrast/[0.08] py-[clamp(13px,2.4vw,21px)]"
            style={{ gridTemplateColumns: narrow ? "96px minmax(0,1fr)" : "190px minmax(0,1fr)" }}>
            <div className="flex flex-col gap-[13px]">
              {lanes.map((name, k) => (
                <div key={name} className="flex h-[76px] min-w-0 flex-col justify-center gap-2">
                  <span className="flex h-[30px] items-center self-start rounded-full px-[13px] text-sm font-semibold tracking-[-0.01em]"
                    style={{ background: `${LANE_NOISE}, linear-gradient(120deg,${LANE_TONES[k].from},${LANE_TONES[k].to})`, backgroundBlendMode: "soft-light,normal", color: LANE_TONES[k].ink }}>
                    {name}
                  </span>
                  <span className="truncate pl-0.5 text-sm text-text-muted">{sc.what[k]}</span>
                </div>
              ))}
            </div>
            <div className="relative flex min-w-0 flex-col gap-[13px]">
              {lanes.map((name, k) => (
                <div key={name} className="relative flex h-[76px] items-center justify-between">
                  {bars[k].map((h, j) => (
                    <span key={j} className="shrink-0 rounded-full"
                      style={{
                        width: narrow ? 9 : 11, minHeight: narrow ? 9 : 11, height: `${h.toFixed(1)}%`,
                        background: `linear-gradient(180deg,${LANE_TONES[k].from},${LANE_TONES[k].to})`,
                        transition: `height 1s cubic-bezier(.34,1.4,.5,1) ${(j / n * 0.4).toFixed(2)}s`,
                      }} />
                  ))}
                  {k === 2 && sc.marks.map(([x, label]) => (
                    <span key={`${i}-${label}`} className="absolute -top-2.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-[3px] text-xs font-semibold text-white shadow-[0_6px_16px_-8px_rgba(15,42,46,.6)] anim-rise"
                      style={{ left: `${x}%`, animationDuration: ".6s" }}>{label}</span>
                  ))}
                </div>
              ))}
              <span aria-hidden className="absolute -bottom-1.5 -top-1.5 -ml-px w-0.5 rounded-sm bg-ink shadow-[0_0_12px_1px_rgba(13,148,136,.45)]"
                style={{ animation: "scan 9s linear infinite" }} />
            </div>
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={() => onPick(sc.words.join(""))}
              className="flex h-[52px] items-center gap-[13px] rounded-full bg-ink pl-[22px] pr-1.5 text-base font-medium text-white transition-transform hover:-translate-y-0.5">
              {t("tryPhrase")}<ArrowDot size={40} tone="gradient" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Para empresas ─────────────────────────────────────────────── */

const BUSINESS_ICONS = [
  '<path d="m3 11 18-5v12L3 14v-3Z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>',
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M8 13h8M8 17h5"></path>',
  '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"></path>',
  '<rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><path d="M12 17v5"></path>',
  '<rect x="2" y="5" width="15" height="14" rx="2"></rect><path d="m22 8-5 4 5 4V8Z"></path>',
  '<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path>',
];

export function Business({ onPick }: { onPick: PickPrompt }) {
  const t = useTranslations("landing");
  const cases = t.raw("businessCases") as { title: string; desc: string; prompt: string }[];
  const mail = `mailto:contact@sonificalabs.com?subject=${encodeURIComponent(t("salesSubject"))}`;
  return (
    <section id="empresas" className="relative mx-[clamp(8px,1.5vw,20px)] scroll-mt-10 px-[clamp(18px,4vw,56px)] pt-[clamp(89px,11vw,144px)]">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[45%] -z-10 h-[130%] min-h-[700px] w-[min(1500px,160vw)] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(closest-side at 35% 50%,rgba(79,99,184,.22),transparent),radial-gradient(closest-side at 70% 55%,rgba(109,91,196,.20),transparent)" }} />
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[clamp(24px,3.5vw,44px)]">
        <Reveal className="flex flex-wrap items-end justify-between gap-[21px]">
          <div className="flex max-w-[760px] flex-col gap-[13px]">
            <span className="flex items-center gap-2 self-start rounded-full bg-ink px-3.5 py-[7px] text-[13px] font-semibold uppercase tracking-[.08em] text-white">
              <Briefcase size={15} />{t("businessTag")}
            </span>
            <h2 className={H2}>{t("businessTitle")} <Keyword underline="tilt" line="aqua">{t("businessKeyword")}</Keyword></h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={mail} className="flex h-14 items-center gap-[13px] rounded-full bg-ink pl-6 pr-2 text-base font-medium text-white hover:bg-accent">
              {t("talkSales")}<ArrowDot size={40} />
            </a>
            <PillLink href="/pricing" variant="outline" arrow={false} className="h-[54px] border-[1.5px] border-ink px-[22px] text-base hover:text-ink">
              {t("seePlans")}
            </PillLink>
          </div>
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-[13px]">
          {cases.map((c, i) => (
            <Reveal key={c.title} delay={Math.min(i, 6) * 0.06} className="h-full">
              <button type="button" onClick={() => onPick(c.prompt)}
                className="flex h-full w-full flex-col gap-[13px] rounded-[21px] border border-contrast/[0.06] bg-white p-6 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(13,148,136,.45)]">
                <span className={`flex h-14 w-14 items-center justify-center rounded-[21px] ${i === 5 ? "bg-surface-2 text-ink" : "bg-sky text-sky-ink"}`}>
                  <PathIcon d={BUSINESS_ICONS[i]} size={26} />
                </span>
                <span className="text-[22px] font-medium tracking-[-0.035em]">{c.title}</span>
                <span className="text-base leading-[1.4] text-text-secondary">{c.desc}</span>
              </button>
            </Reveal>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-[clamp(12px,3vw,40px)] pt-2">
          {(t.raw("businessPerks") as string[]).map((p) => (
            <span key={p} className="flex items-center gap-2 text-base font-medium">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent text-white"><Check size={13} /></span>{p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Tu primer audio es gratis ─────────────────────────────────── */

export function Gift({ onCreate }: { onCreate: (prompt: string) => void }) {
  const t = useTranslations("landing");
  const { playingId } = useDemoAudio();
  const [value, setValue] = useState("");
  const go = () => { onCreate(value.trim()); setValue(""); };

  return (
    <section className="relative px-[clamp(12px,3vw,40px)] pb-[clamp(72px,9vw,128px)] pt-[clamp(89px,11vw,144px)]">
      <Reveal className="relative mx-auto grid max-w-[1180px] items-center gap-[clamp(32px,5vw,64px)] overflow-hidden rounded-[21px] border border-accent/[0.12] bg-[linear-gradient(135deg,#eef6f5_0%,#e6f6f3_45%,#ffffff_100%)] p-[clamp(34px,5vw,55px)] min-[820px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-[120px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.28),transparent)]" />
        <div className="relative flex flex-col items-center gap-[13px] text-center min-[820px]:items-start min-[820px]:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-[7px] text-sm font-medium text-accent-dim">
            <GiftIcon size={15} />{t("giftTag")}
          </span>
          <h2 className="m-0 text-balance text-[clamp(34px,5vw,55px)] font-normal leading-[1.02] tracking-[-0.065em]">
            {t("giftTitle")} <Keyword underline="tilt" line="rose">{t("giftKeyword")}</Keyword>
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); go(); }}
            className="mt-2 flex w-full max-w-[520px] items-center gap-2 rounded-full bg-white py-1.5 pl-[22px] pr-1.5 shadow-[0_1px_2px_rgba(15,42,46,.06),0_20px_44px_-28px_rgba(15,42,46,.4)]">
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t("giftPlaceholder")} aria-label={t("giftPlaceholder")}
              className="h-[50px] min-w-0 flex-1 border-0 bg-transparent text-[17px] tracking-[-0.02em] text-ink outline-none placeholder:text-text-muted" />
            <button type="submit" aria-label={t("giftAria")}
              className="flex h-[52px] shrink-0 items-center gap-2 rounded-full bg-accent pl-2 pr-1.5 text-base font-medium text-white transition-colors hover:bg-ink sm:pl-6">
              <span className="hidden sm:inline">{t("giftButton")}</span><ArrowDot size={40} tone="teal" />
            </button>
          </form>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 min-[820px]:justify-start">
            {(t.raw("giftPerks") as string[]).map((p) => (
              <span key={p} className="flex items-center gap-2 text-[15px] font-medium text-text-secondary">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-accent"><Check size={11} strokeWidth={3.4} /></span>{p}
              </span>
            ))}
          </div>
        </div>
        <div aria-hidden className="relative flex justify-center px-3 py-7">
          <div className="absolute left-1/2 top-1/2 h-[150px] w-[min(300px,78%)] rounded-[21px] bg-white/60" style={{ transform: "translate(-50%,-50%) rotate(-7deg) translateY(16px)" }} />
          <div className="relative flex w-[min(320px,100%)] flex-col gap-[13px] rounded-[21px] bg-white p-[18px] shadow-[0_40px_80px_-36px_rgba(15,42,46,.45)]" style={{ rotate: "3deg" }}>
            <span className="absolute -right-3 -top-4 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-ink text-[#2dd4bf] shadow-[0_14px_28px_-12px_rgba(15,42,46,.6)]" style={{ rotate: "4deg" }}>
              <GiftIcon size={15} />
            </span>
            <div className="flex items-center gap-[13px]">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-accent text-white"><PlayPause playing={false} size={13} /></span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-medium">{t("giftFile")}</span>
                <span className="text-[13px] text-text-muted">{t("giftMeta")}</span>
              </span>
            </div>
            <div className="h-9"><Bars n={30} live={playingId !== null} /></div>
            <div className="flex items-center justify-between text-[13px] text-text-muted">
              <span className="tabular-nums">0:00 / 0:30</span>
              <span className="flex items-center gap-[5px] font-medium text-ink"><Download size={13} />MP3</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
