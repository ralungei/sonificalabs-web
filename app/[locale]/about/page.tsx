"use client";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Keyword, PillLink, Reveal } from "@/components/site/ui";
import { HeroWave } from "@/components/site/HeroWave";

/** Soft violet and pink pools behind the page, the tones of its title. */
const GLOWS: [side: "left" | "right", offset: string, top: string, size: number, color: string][] = [
  ["left", "-14%", "-6vh", 900, "rgba(139,92,246,.18)"],
  ["right", "-12%", "18vh", 820, "rgba(236,72,153,.13)"],
  ["left", "-10%", "95vh", 900, "rgba(168,85,247,.12)"],
  ["right", "-14%", "130vh", 950, "rgba(99,102,241,.10)"],
];

function Member({
  photo, name, role, bio, ring, pill, actions, delay,
}: {
  photo: string;
  name: string;
  role: string;
  bio: string[];
  ring: string;
  pill: string;
  actions: React.ReactNode;
  delay: number;
}) {
  return (
    <div className="flex h-full flex-col gap-5 rounded-[26px] border border-[#7c3aed]/[0.08] bg-white/90 p-[clamp(24px,3vw,36px)] shadow-[0_30px_60px_-40px_rgba(76,29,149,.38)] backdrop-blur-sm"
      style={{ animation: `rise 1s ${delay}s cubic-bezier(.16,1,.3,1) both` }}>
      <div className="flex items-center gap-[18px]">
        <span className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#f1ecff]" style={{ boxShadow: `0 0 0 4px #fff, 0 0 0 5px ${ring}` }}>
          <img src={photo} alt={name} className="block h-full w-full object-cover" />
        </span>
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-[clamp(26px,2.6vw,34px)] font-normal leading-none tracking-[-0.05em]">{name}</span>
          <span className={`rounded-full px-3 py-[5px] text-[13px] font-medium ${pill}`}>{role}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-base leading-[1.45] text-text-secondary">
        {bio.map((p) => <p key={p} className="m-0">{p}</p>)}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

const SMALL_DARK = "flex h-[42px] items-center rounded-full bg-ink px-4 text-sm font-medium text-white transition-colors";
const SMALL_OUTLINE = "flex h-[42px] items-center rounded-full border border-contrast/[0.12] bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-[#7c3aed] hover:text-[#7c3aed]";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-white text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {GLOWS.map(([side, offset, top, size, color], i) => (
          <span key={i} className="absolute rounded-full"
            style={{ [side]: offset, top, width: size, height: size, background: `radial-gradient(closest-side,${color},transparent)` }} />
        ))}
      </div>
      <Navbar />

      <section className="relative px-[clamp(18px,4vw,48px)] pt-[clamp(48px,7vw,104px)] text-center">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-[clamp(40px,5vw,80px)] top-0">
          <HeroWave active={false} tone="violet" />
        </div>
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[40%] h-[520px] w-[min(1000px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,.14),transparent)]" />
        <h1 className="relative m-0 text-balance text-[clamp(42px,6vw,96px)] font-normal leading-[1.02] tracking-[-0.07em] anim-rise" style={{ animationDelay: ".1s" }}>
          {t("heroStart")} <Keyword underline="draw" line="violet">{t("heroKeyword")}</Keyword>
        </h1>
        <p className="relative mx-auto mb-0 mt-[clamp(24px,3vw,32px)] max-w-[560px] text-[clamp(17px,1.5vw,20px)] leading-[1.45] text-text-secondary anim-rise" style={{ animationDelay: ".3s" }}>
          {t("heroSub")}
        </p>
      </section>

      <section className="px-[clamp(18px,4vw,48px)] pt-[clamp(48px,6vw,80px)]">
        <div className="mx-auto grid max-w-[1080px] gap-4 min-[760px]:grid-cols-2">
          <Member
            photo="/team/ras.jpg" name={t("rasName")} role={t("rasRole")}
            bio={[t("rasBio1"), t("rasBio2"), t("rasBio3")]}
            ring="rgba(124,58,237,.28)" pill="bg-[#f1ecff] text-[#6d28d9]" delay={0.45}
            actions={<>
              <a href="https://www.linkedin.com/in/ras-alungei/" target="_blank" rel="noopener noreferrer" className={`${SMALL_DARK} hover:bg-[#7c3aed]`}>{t("linkedIn")}</a>
              <a href="mailto:contact@sonificalabs.com" className={SMALL_OUTLINE}>{t("writeHim")}</a>
            </>}
          />
          <Member
            photo="/team/roxana.jpg" name={t("roxanaName")} role={t("roxanaRole")}
            bio={[t("roxanaBio1"), t("roxanaBio2")]}
            ring="rgba(219,39,119,.28)" pill="bg-[#fdeaf4] text-[#be185d]" delay={0.6}
            actions={<>
              <a href="mailto:contact@sonificalabs.com" className={`${SMALL_DARK} hover:bg-[#db2777]`}>{t("collaborations")}</a>
              <a href="https://www.linkedin.com/in/roxana-alungei-93a73a146/" target="_blank" rel="noopener noreferrer" className={SMALL_OUTLINE}>{t("linkedIn")}</a>
            </>}
          />
        </div>
      </section>

      <Reveal className="px-[clamp(18px,4vw,48px)] pt-[clamp(56px,7vw,96px)] text-center">
        <p className="mx-auto my-0 max-w-[760px] text-[clamp(24px,2.8vw,38px)] font-normal leading-[1.25] tracking-[-0.045em]">{t("quote")}</p>
        <span className="mt-3.5 block text-[15px] text-text-muted">{t("quoteBy")}</span>
      </Reveal>

      <section className="px-[clamp(12px,3vw,40px)] pb-[clamp(64px,8vw,110px)] pt-[clamp(56px,7vw,96px)]">
        <Reveal className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 rounded-[26px] bg-[linear-gradient(135deg,#f3efff,#f7ecfd_50%,#fdeef6)] px-[clamp(24px,4vw,40px)] py-[clamp(20px,3vw,28px)]">
          <span className="text-[clamp(20px,2vw,26px)] font-normal tracking-[-0.04em]">{t("ctaBand")}</span>
          <PillLink href="/" variant="violet" className="h-[52px] text-base">{t("ctaButton")}</PillLink>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
