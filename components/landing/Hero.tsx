"use client";
import { useState, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PromptForm, type PromptFormHandle, type Suggestion } from "@/components/PromptForm";
import { AudioBubble } from "@/components/site/AudioBubble";
import { HeroWave } from "@/components/site/HeroWave";
import { useDemoAudio } from "@/components/site/demo-audio";
import { ArrowDown, Keyword, PathIcon } from "@/components/site/ui";
import { demoSrc, findDemo } from "@/lib/demos";

/** Hero bubbles, in the design's order and positions (x, y, size). */
const HERO_BUBBLES: [id: string, x: string, y: string, size: number][] = [
  ["pizzeria", "9%", "25%", 124],
  ["audiocuento", "18%", "55%", 84],
  ["documental", "8%", "78%", 110],
  ["thriller", "90%", "23%", 108],
  ["meditacion", "81%", "50%", 78],
  ["informativo", "91%", "75%", 126],
  ["trailer", "70%", "86%", 90],
];

const SUGGESTION_ICONS = [
  '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>',
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path>',
  '<path d="m3 11 18-5v12L3 14v-3Z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>',
];

export function Hero({
  formRef,
  onSubmit,
}: {
  formRef: RefObject<PromptFormHandle | null>;
  onSubmit: (prompt: string) => Promise<void>;
}) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const { playingId } = useDemoAudio();
  const [typing, setTyping] = useState(false);

  const suggestions: Suggestion[] = (t.raw("heroSuggestions") as { label: string; prompt: string }[]).map((s, i) => ({
    ...s,
    icon: <PathIcon d={SUGGESTION_ICONS[i]} size={13} strokeWidth={2.4} />,
  }));

  const bubble = (id: string, size: number, labelVariant: "pill" | "plain") => {
    const d = findDemo(id);
    const label = t(`bubbles.${id}.label` as Parameters<typeof t>[0]);
    return (
      <AudioBubble
        id={d.id}
        src={demoSrc(locale, d.filename)}
        texture={d.texture}
        size={size}
        label={label}
        color="#0f766e"
        labelVariant={labelVariant}
        // Playing a demo drops its idea in the box: the quickest way to riff on it.
        onPlay={() => formRef.current?.setPrompt(t(`bubbles.${id}.prompt` as Parameters<typeof t>[0]))}
      />
    );
  };

  return (
    <section className="relative flex h-[100svh] min-h-[640px] flex-col items-center overflow-x-clip px-[clamp(18px,4vw,48px)]">
      <HeroWave active={typing || playingId !== null} />

      {/* Floating bubbles on wide screens */}
      <div className="pointer-events-none absolute inset-0 z-[1] hidden min-[1120px]:block">
        {HERO_BUBBLES.map(([id, x, y, size], k) => (
          <div key={id} className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y, animation: `fadein .9s ${1 + k * 0.14}s both` }}>
            <div data-bob style={{ animation: `bob ${9 + (k % 3) * 1.5}s ease-in-out ${-k * 1.3}s infinite` }}>
              {bubble(id, size, "pill")}
            </div>
          </div>
        ))}
      </div>

      {/* Above the "discover" link: the customize popover opens downwards over it. */}
      <div className="relative z-[4] mt-[110px] flex w-full max-w-[980px] flex-col items-center text-center md:mt-[clamp(120px,20vh,230px)]">
        <h1 className="m-0 text-balance text-[clamp(44px,7vw,89px)] font-normal leading-[1.04] tracking-[-0.07em] anim-rise" style={{ animationDelay: ".1s" }}>
          {t("heroTitle")} <Keyword underline="draw">{t("heroKeyword")}</Keyword>
        </h1>

        <div className="mt-[clamp(28px,5vh,52px)] w-full max-w-[720px] anim-rise" style={{ animationDelay: ".3s" }}>
          <PromptForm ref={formRef} onSubmit={onSubmit} suggestions={suggestions} onActivityChange={setTyping} />

          {/* Bubbles in a scrollable row on narrow screens */}
          <div className="no-scrollbar -mx-[18px] mt-[26px] flex gap-[13px] overflow-x-auto px-[18px] pb-3.5 pt-2 min-[1120px]:hidden">
            {HERO_BUBBLES.map(([id], k) => (
              <div key={id} className="shrink-0" style={{ animation: `fadein .9s ${1 + k * 0.14}s both` }}>
                {bubble(id, 76, "plain")}
              </div>
            ))}
          </div>
        </div>
      </div>

      <a
        href="#cap-problema"
        onClick={(e) => { e.preventDefault(); document.getElementById("cap-problema")?.scrollIntoView({ behavior: "smooth" }); }}
        className="absolute bottom-[clamp(20px,4vh,40px)] left-1/2 z-[3] hidden -translate-x-1/2 flex-col items-center gap-[5px] whitespace-nowrap text-sm font-medium text-text-muted hover:text-accent sm:flex"
        style={{ animation: "fadein 1s 2s both" }}
      >
        {t("discover")}
        <span data-bob className="flex h-8 w-8 items-center justify-center rounded-full border border-contrast/15" style={{ animation: "bob 2.4s ease-in-out infinite" }}>
          <ArrowDown size={14} />
        </span>
      </a>
    </section>
  );
}
