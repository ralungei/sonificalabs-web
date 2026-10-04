import { useTranslations } from "next-intl";
import { BulletList, LegalShell, Section } from "@/components/site/Legal";

export default function TermsPage() {
  const t = useTranslations("terms");

  return (
    <LegalShell title={t("title")} lastUpdated={t("lastUpdated")}>
      <Section title={t("legalNotice")}>
        <p>{t("legalNoticeText")}</p>
      </Section>

      <Section title={t("service")}>
        <p>{t("serviceText")}</p>
      </Section>

      <Section title={t("account")}>
        <BulletList items={t.raw("accountItems") as string[]} />
      </Section>

      <Section title={t("pricing")}>
        <BulletList items={t.raw("pricingItems") as string[]} />
      </Section>

      <Section title={t("withdrawal")}>
        <p>{t("withdrawalText")}</p>
      </Section>

      <Section title={t("ip")}>
        <BulletList items={t.raw("ipItems") as string[]} />
      </Section>

      <Section title={t("ai")}>
        <p>{t("aiText")}</p>
      </Section>

      <Section title={t("acceptable")}>
        <BulletList items={t.raw("acceptableItems") as string[]} />
      </Section>

      <Section title={t("availability")}>
        <p>{t("availabilityText")}</p>
      </Section>

      <Section title={t("liability")}>
        <p>{t("liabilityText")}</p>
      </Section>

      <Section title={t("law")}>
        <p>{t("lawText")}</p>
      </Section>

      <Section title={t("changes")}>
        <p>{t("changesText")}</p>
      </Section>
    </LegalShell>
  );
}
