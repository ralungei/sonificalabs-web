import { useTranslations } from "next-intl";
import { BulletList, LegalShell, Section } from "@/components/site/Legal";

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  return (
    <LegalShell title={t("title")} lastUpdated={t("lastUpdated")}>
      <Section title={t("controller")}>
        <p>{t("controllerText")}</p>
      </Section>

      <Section title={t("dataCollected")}>
        <p>{t("dataCollectedText")}</p>
        <BulletList items={t.raw("dataItems") as string[]} />
      </Section>

      <Section title={t("purpose")}>
        <BulletList items={t.raw("purposeItems") as string[]} />
      </Section>

      <Section title={t("thirdParties")}>
        <p>{t("thirdPartiesText")}</p>
        <BulletList items={t.raw("thirdPartyItems") as string[]} />
        <p>{t("thirdPartiesTransfer")}</p>
      </Section>

      <Section title={t("retention")}>
        <BulletList items={t.raw("retentionItems") as string[]} />
      </Section>

      <Section title={t("rights")}>
        <p>{t("rightsText")}</p>
      </Section>

      <Section title={t("cookies")}>
        <p>{t("cookiesText")}</p>
      </Section>

      <Section title={t("minors")}>
        <p>{t("minorsText")}</p>
      </Section>

      <Section title={t("changes")}>
        <p>{t("changesText")}</p>
      </Section>
    </LegalShell>
  );
}
