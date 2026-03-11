import { useTranslations } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-heading-md font-body font-semibold text-contrast mb-3">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-body-md text-contrast/60 leading-relaxed">{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  return (
    <main className="min-h-screen bg-surface-0 text-contrast">
      <Navbar />
      <article className="max-w-2xl mx-auto px-6 pt-32 pb-24 space-y-10">
        <div>
          <h1 className="text-display-sm font-body font-bold tracking-tight mb-2">{t("title")}</h1>
          <p className="text-body-md text-contrast/40">{t("lastUpdated")}</p>
        </div>

        <Section title={t("controller")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("controllerText")}</p>
        </Section>

        <Section title={t("dataCollected")}>
          <p className="text-body-md text-contrast/60 leading-relaxed mb-3">{t("dataCollectedText")}</p>
          <BulletList items={t.raw("dataItems") as string[]} />
        </Section>

        <Section title={t("purpose")}>
          <BulletList items={t.raw("purposeItems") as string[]} />
        </Section>

        <Section title={t("thirdParties")}>
          <p className="text-body-md text-contrast/60 leading-relaxed mb-3">{t("thirdPartiesText")}</p>
          <BulletList items={t.raw("thirdPartyItems") as string[]} />
          <p className="text-body-md text-contrast/60 leading-relaxed mt-3">{t("thirdPartiesTransfer")}</p>
        </Section>

        <Section title={t("retention")}>
          <BulletList items={t.raw("retentionItems") as string[]} />
        </Section>

        <Section title={t("rights")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("rightsText")}</p>
        </Section>

        <Section title={t("cookies")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("cookiesText")}</p>
        </Section>

        <Section title={t("minors")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("minorsText")}</p>
        </Section>

        <Section title={t("changes")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("changesText")}</p>
        </Section>
      </article>
      <Footer />
    </main>
  );
}
