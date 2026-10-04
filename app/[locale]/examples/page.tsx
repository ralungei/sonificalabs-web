"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AudioBubble } from "@/components/site/AudioBubble";
import { stopDemo } from "@/components/site/demo-audio";
import { Keyword } from "@/components/site/ui";
import { HeroWave } from "@/components/site/HeroWave";
import { DEMO_CATEGORIES, DEMOS, demoSrc, type DemoCategory } from "@/lib/demos";
import { cn } from "@/lib/cn";

/** Two soft orange and coral pools behind the page, the tones of its title. */
const GLOWS: [side: "left" | "right", offset: string, top: string, size: number, color: string][] = [
  ["left", "-16%", "-12vh", 820, "rgba(249,115,22,.09)"],
  ["right", "-16%", "22vh", 760, "rgba(244,63,94,.06)"],
];

/** Bubble sizes cycle through this list so each group looks hand-placed. */
const SIZES = [118, 92, 104, 86, 124, 96];

export default function ExamplesPage() {
  const t = useTranslations("examples");
  const tDemos = useTranslations("home.demos");
  const locale = useLocale();
  const [cat, setCat] = useState<DemoCategory | "all">("all");
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const fit = () => setNarrow(window.innerWidth < 720);
    fit();
    window.addEventListener("resize", fit);
    return () => { window.removeEventListener("resize", fit); stopDemo(); };
  }, []);

  const groups = DEMO_CATEGORIES.filter((c) => cat === "all" || c.id === cat);

  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-white text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {GLOWS.map(([side, offset, top, size, color], i) => (
          <span key={i} className="absolute rounded-full"
            style={{ [side]: offset, top, width: size, height: size, background: `radial-gradient(closest-side,${color},transparent)` }} />
        ))}
      </div>
      <Navbar />

      <section className="relative px-[clamp(18px,4vw,48px)] pt-[clamp(48px,7vw,96px)] text-center">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-[clamp(40px,5vw,80px)] top-0 -z-10">
          <HeroWave active={false} tone="coral" />
        </div>
        <h1 className="m-0 text-[clamp(42px,6vw,96px)] font-normal leading-[1.02] tracking-[-0.07em]">
          {t("titleStart")} <Keyword underline="tilt" line="coral">{t("titleKeyword")}</Keyword>
        </h1>
        <p className="mb-0 mt-[clamp(26px,3vw,36px)] text-[clamp(17px,1.5vw,20px)] text-text-secondary">{t("hint")}</p>
        <div className="no-scrollbar mx-auto mt-[clamp(28px,4vw,44px)] flex max-w-[1000px] gap-2 overflow-x-auto p-0.5 min-[900px]:justify-center">
          {(["all", ...DEMO_CATEGORIES.map((c) => c.id)] as const).map((id) => (
            <button key={id} type="button" onClick={() => setCat(id)} aria-pressed={cat === id}
              className={cn(
                "h-[42px] shrink-0 rounded-full border px-[18px] text-[15px] font-medium transition-all duration-200",
                cat === id ? "border-[#ea580c] bg-[#ea580c] text-white" : "border-contrast/[0.12] bg-white text-ink hover:border-[#ea580c] hover:text-[#ea580c]",
              )}>
              {t(`categories.${id}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto flex max-w-[1180px] flex-col px-[clamp(18px,4vw,48px)] pb-[clamp(80px,10vw,140px)]">
        {groups.map((c) => {
          const items = DEMOS.filter((d) => d.category === c.id);
          return (
            <section key={c.id} className="flex flex-col items-center gap-[clamp(24px,3vw,36px)] pt-[clamp(56px,7vw,96px)]"
              style={{ animation: "rise .8s cubic-bezier(.16,1,.3,1) both" }}>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <h2 className="m-0 text-[clamp(28px,3.2vw,44px)] font-normal tracking-[-0.05em]">
                  {t(`categories.${c.id}` as Parameters<typeof t>[0])}
                </h2>
                <span className="text-[15px] text-text-muted">{t("count", { count: items.length })}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-[clamp(14px,2.6vw,36px)] gap-y-[clamp(18px,3vw,40px)]">
                {items.map((d, i) => {
                  const size = Math.round(SIZES[(i + c.id.length) % SIZES.length] * (narrow ? 0.78 : 1));
                  const name = tDemos(d.key as Parameters<typeof tDemos>[0]);
                  return (
                    <div key={d.id} data-bob className="flex flex-col items-center"
                      style={{ width: Math.max(size, 110), animation: `bob ${8 + (i % 3) * 1.5}s ease-in-out ${-i * 1.1}s infinite` }}>
                      <AudioBubble id={d.id} src={demoSrc(locale, d.filename)} texture={d.texture} size={size}
                        label={name} color={c.color} labelVariant="plain" />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Footer />
    </main>
  );
}
