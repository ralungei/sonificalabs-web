"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ConsoleList } from "../ConsoleList";

export default function ConsoleHistoryPage() {
  const t = useTranslations("console");

  return (
    <div className="mx-auto w-full max-w-[980px] px-5 pb-20 pt-8 md:px-8 md:pt-12">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-heading-xl font-extrabold tracking-[-0.02em] text-contrast">{t("nav.history")}</h1>
        <p className="mt-1 text-body-sm text-text-secondary">{t("subtitle")}</p>
      </motion.header>

      <ConsoleList />
    </div>
  );
}
