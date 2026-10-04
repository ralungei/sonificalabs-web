"use client";

import { useTranslations } from "next-intl";
import { ConsoleList } from "../ConsoleList";
import { ConsolePage } from "../ConsolePage";

export default function ConsoleHistoryPage() {
  const t = useTranslations("console");

  return (
    <ConsolePage title={t("nav.history")} subtitle={t("subtitle")}>
      <ConsoleList />
    </ConsolePage>
  );
}
