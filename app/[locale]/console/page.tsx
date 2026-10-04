"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { PromptForm } from "@/components/PromptForm";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import { ConsoleList } from "./ConsoleList";
import { ConsolePage } from "./ConsolePage";

export default function ConsoleGeneratorPage() {
  const t = useTranslations("console");
  const tHome = useTranslations("home");
  const router = useRouter();
  const apiToken = useApiToken();
  const [refreshKey, setRefreshKey] = useState(0);

  // Same contract as the landing form, so both surfaces behave identically.
  const handleSubmit = useCallback(
    // `instruction` is what the user typed, sent apart from any pasted material
    // so the API reads the requested duration from it and not from a script.
    async (prompt: string, instruction?: string) => {
      let res: Response;
      try {
        res = await apiFetch(
          "/produce",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, instruction }) },
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

  // Anything launched from here should show up in the list on return.
  useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <ConsolePage title={t("nav.generator")} subtitle={t("generatorSubtitle")}>
      {/* Fills the section so its edges line up with the title and the list
          (the landing keeps its narrower centred form). The sidebar already
          shows plan and credits, so the form does not repeat them. */}
      <PromptForm onSubmit={handleSubmit} className="max-w-none" showQuota={false} />

      <section className="mt-12">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-[22px] font-medium tracking-[-0.035em] text-ink">{t("recentTitle")}</h2>
          <Link
            href="/console/history"
            className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-accent"
          >
            {t("seeAll")}
            <Icon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ConsoleList limit={5} compact refreshKey={refreshKey} />
      </section>
    </ConsolePage>
  );
}
