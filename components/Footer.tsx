"use client";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/config";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <footer className="relative z-10 flex w-full flex-wrap items-center justify-between gap-3 border-t border-contrast/15 px-[clamp(18px,3vw,40px)] pb-[30px] pt-[22px] text-sm font-medium text-ink">
      <span>{t("copyright")}</span>
      <div className="flex flex-wrap items-center gap-x-[21px] gap-y-2">
        <Link href="/pricing" className="hover:text-accent">{t("pricing")}</Link>
        <Link href="/privacy" className="hover:text-accent">{t("privacy")}</Link>
        <Link href="/terms" className="hover:text-accent">{t("terms")}</Link>
        <a href="mailto:contact@sonificalabs.com" className="hover:text-accent">{t("contact")}</a>
        <span className="flex items-center gap-1" aria-label={t("language")}>
          {locales.map((l, i) => (
            <span key={l} className="flex items-center gap-1">
              {i > 0 && <span className="text-text-muted">/</span>}
              <button type="button" onClick={() => router.replace(pathname, { locale: l })}
                className={l === locale ? "text-accent" : "hover:text-accent"} aria-current={l === locale}>
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </span>
      </div>
    </footer>
  );
}
