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

export default function TermsPage() {
  const t = useTranslations("terms");

  return (
    <main className="min-h-screen bg-surface-0 text-contrast">
      <Navbar />
      <article className="max-w-2xl mx-auto px-6 pt-32 pb-24 space-y-10">
        <div>
          <h1 className="text-display-sm font-body font-bold tracking-tight mb-2">{t("title")}</h1>
          <p className="text-body-md text-contrast/40">{t("lastUpdated")}</p>
        </div>

        <Section title={t("legalNotice")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("legalNoticeText")}</p>
        </Section>

        <Section title={t("service")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("serviceText")}</p>
        </Section>

        <Section title={t("account")}>
          <BulletList items={t.raw("accountItems") as string[]} />
        </Section>

        <Section title={t("pricing")}>
          <BulletList items={t.raw("pricingItems") as string[]} />
        </Section>

        <Section title={t("withdrawal")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("withdrawalText")}</p>
        </Section>

        <Section title={t("ip")}>
          <BulletList items={t.raw("ipItems") as string[]} />
        </Section>

        <Section title={t("ai")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("aiText")}</p>
        </Section>

        <Section title={t("acceptable")}>
          <BulletList items={t.raw("acceptableItems") as string[]} />
        </Section>

        <Section title={t("availability")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("availabilityText")}</p>
        </Section>

        <Section title={t("liability")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("liabilityText")}</p>
        </Section>

        <Section title={t("law")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("lawText")}</p>
        </Section>

        <Section title={t("changes")}>
          <p className="text-body-md text-contrast/60 leading-relaxed">{t("changesText")}</p>
        </Section>
      </article>
      <Footer />
    </main>
  );
}
