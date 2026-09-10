"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { PromptForm } from "@/components/PromptForm";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { ConsoleList } from "./ConsoleList";

export default function ConsoleGeneratorPage() {
  const t = useTranslations("console");
  const tHome = useTranslations("home");
  const router = useRouter();
  const apiToken = useApiToken();
  const [reloadKey, setReloadKey] = useState(0);

  // Same contract as the landing form, so both surfaces behave identically.
  const handleSubmit = useCallback(
    async (prompt: string) => {
      let res: Response;
      try {
        res = await apiFetch(
          "/produce",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) },
          apiToken,
        );
      } catch {
        throw new Error(tHome("serviceUnavailable"));
      }

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.setItem("sonificalabs_draft", prompt);
          window.location.href = "/signin?callbackUrl=/console";
          return;
        }
        if (res.status === 403) {
          const data = await res.json().catch(() => null);
          const err = new Error(data?.error || "Quota exceeded");
          err.name = "QuotaError";
          throw err;
        }
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("Retry-After") || "30", 10);
          const err = new Error(`rate_limit:${retryAfter}`);
          err.name = "RateLimitError";
          throw err;
        }
        throw new Error(tHome("serviceUnavailable"));
      }

      const { jobId } = await res.json();
      router.push(`/p/${jobId}`);
    },
    [apiToken, router, tHome],
  );

  // Anything launched from here should show up in the list below on return.
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 pb-20 pt-8 md:px-8 md:pt-12">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-heading-xl font-extrabold tracking-[-0.02em] text-contrast">
          {t("nav.generator")}
        </h1>
        <p className="mt-1 text-body-sm text-text-secondary">{t("generatorSubtitle")}</p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <PromptForm onSubmit={handleSubmit} />
      </motion.div>

      <div className="mt-12">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-heading-sm font-semibold text-contrast">{t("recentTitle")}</h2>
          <Link
            href="/console/history"
            className="inline-flex items-center gap-1 text-label-md text-text-secondary transition-colors hover:text-accent"
          >
            {t("seeAll")}
            <Icon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ConsoleList key={reloadKey} limit={5} compact />
      </div>
    </div>
  );
}
