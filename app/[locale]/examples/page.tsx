"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { DemoCircle, DEMO_DATA, NEUTRAL_TEXTURE, type Demo } from "@/components/DemoCircle";

const DEMO_CLIPS: Record<string, string> = {
  pizzeria: "/textures/pizzeria.mp4",
  meditacion: "/textures/meditacion.mp4",
  informativo: "/textures/informativo.mp4",
  thriller: "/textures/thriller.mp4",
  documental: "/textures/documental.mp4",
  audiocuento: "/textures/audiocuento.mp4",
  trailer: "/textures/trailer.mp4",
};

const CATEGORIES = ["all", "tv", "fiction", "commercial", "podcast", "creators", "wellness"] as const;
type Category = (typeof CATEGORIES)[number];

export default function ExamplesPage() {
  const t = useTranslations("examples");
  const tHome = useTranslations("home");
  const locale = useLocale();
  const [active, setActive] = useState<Category>("all");

  const demos: Demo[] = DEMO_DATA.map((d) => ({
    ...d,
    file: `/demos/${locale}/${d.filename}`,
    title: tHome(`demos.${d.key}` as Parameters<typeof tHome>[0]),
    texture: NEUTRAL_TEXTURE,
    clip: DEMO_CLIPS[d.id],
  }));

  const grouped = CATEGORIES.filter((c) => c !== "all").reduce(
    (acc, cat) => {
      const items = demos.filter((d) => (d as Demo & { category: string }).category === cat);
      if (items.length > 0) acc.push({ key: cat, items });
      return acc;
    },
    [] as { key: string; items: Demo[] }[],
  );

  const filtered = active === "all" ? demos : demos.filter((d) => (d as Demo & { category: string }).category === active);

  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <div className="w-full max-w-4xl mx-auto px-4 pb-16">
        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                active === cat
                  ? "bg-contrast text-white shadow-md"
                  : "bg-white/80 text-contrast/50 hover:text-contrast/80 border border-contrast/10"
              }`}
            >
              {t(`categories.${cat}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>

        {/* Content */}
        {active === "all" ? (
          <div className="space-y-14">
            {grouped.map(({ key, items }) => (
              <motion.section
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-label-lg font-semibold tracking-widest uppercase text-contrast/40 mb-6 text-center">
                  {t(`categories.${key}` as Parameters<typeof t>[0])}
                </h2>
                <div className="flex flex-wrap justify-center gap-8 md:gap-10">
                  {items.map((demo, i) => (
                    <DemoCircle key={demo.id} demo={demo} delay={0.05 + i * 0.06} size={96} />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        ) : (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap justify-center gap-8 md:gap-10"
          >
            {filtered.map((demo, i) => (
              <DemoCircle key={demo.id} demo={demo} delay={0.05 + i * 0.06} size={96} />
            ))}
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
