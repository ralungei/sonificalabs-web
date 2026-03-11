import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoIcon } from "@/components/Logo";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="relative z-10 w-full border-t border-contrast/[0.06] py-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <LogoIcon className="h-6 w-auto text-contrast" />
          <span className="text-lg font-body tracking-normal">
            <span className="text-contrast font-bold">sonifica</span>
            <span className="text-contrast font-light">labs</span>
            <sup className="text-xs text-contrast/50 ml-0.5">&trade;</sup>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-contrast/35">
          <span>{t("copyright")}</span>
          <span>&middot;</span>
          <Link href="/privacy" className="hover:text-contrast/60 transition-colors">
            {t("privacy")}
          </Link>
          <span>&middot;</span>
          <Link href="/terms" className="hover:text-contrast/60 transition-colors">
            {t("terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
