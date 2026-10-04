"use client";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Wordmark } from "@/components/Navbar";
import { HeroWave } from "@/components/site/HeroWave";
import { Keyword } from "@/components/site/ui";

function GoogleG() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function SignInContent() {
  const t = useTranslations("signin");
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  // Signing in lands in the console, not back on the marketing page.
  const callbackUrl = params.get("callbackUrl") || "/console";
  const error = params.get("error");

  // Already signed in: there is nothing to do here, go straight to the app.
  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  return (
    <main className="relative flex h-dvh items-center justify-center overflow-hidden bg-white px-4 text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -left-[12%] top-[10%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.22),transparent)]" />
        <span className="absolute -right-[14%] bottom-[-10%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(closest-side,rgba(13,148,136,.14),transparent)]" />
      </div>
      <HeroWave active={false} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="flex flex-col items-center rounded-[26px] border border-contrast/[0.07] bg-white/85 p-[clamp(24px,5vw,40px)] text-center shadow-[0_40px_80px_-40px_rgba(15,42,46,.45)] backdrop-blur-xl">
          <Link href="/" aria-label={t("backToHome")}><Wordmark size={21} /></Link>

          <h1 className="mb-0 mt-7 text-balance text-[clamp(32px,4vw,42px)] font-normal leading-[1.04] tracking-[-0.06em]">
            {t("titleStart")} <Keyword>{t("titleKeyword")}</Keyword>
          </h1>
          <p className="mb-0 mt-3 text-base leading-[1.45] text-text-secondary">{t("subtitle")}</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-5 w-full rounded-[16px] border border-fail/20 bg-fail/10 px-4 py-3 text-sm text-fail"
            >
              {error === "OAuthAccountNotLinked" ? t("oauthError") : t("genericError")}
            </motion.div>
          )}

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="mt-7 flex h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-full bg-ink pl-1.5 pr-6 text-base font-medium tracking-[-0.02em] text-white transition-colors hover:bg-accent"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white"><GoogleG /></span>
            <span className="flex-1 text-center">{t("signInWithGoogle")}</span>
            <span className="w-5" aria-hidden />
          </button>

          <p className="mb-0 mt-6 text-[13px] leading-relaxed text-text-muted">
            {t.rich("termsNotice", {
              terms: (chunks) => <Link href="/terms" className="text-text-secondary underline underline-offset-2 hover:text-accent">{chunks}</Link>,
              privacy: (chunks) => <Link href="/privacy" className="text-text-secondary underline underline-offset-2 hover:text-accent">{chunks}</Link>,
            })}
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
