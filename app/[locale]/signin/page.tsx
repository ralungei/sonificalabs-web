"use client";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ACCENT } from "@/lib/theme";
import { LogoIcon } from "@/components/Logo";

function SignInContent() {
  const t = useTranslations("signin");
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const error = params.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(${ACCENT.rgb},0.06) 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Card */}
        <div className="rounded-2xl border border-contrast/[0.08] bg-surface-1/80 backdrop-blur-xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <LogoIcon className="h-8 w-auto text-contrast" />
              <span className="text-heading-md font-body tracking-normal">
                <span className="text-contrast font-bold">sonifica</span><span className="text-contrast font-light">labs</span>
              </span>
            </div>
            <p className="text-body-md text-text-secondary text-center">
              {t("subtitle")}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 rounded-lg bg-fail/10 border border-fail/20 px-4 py-3 text-label-md text-fail text-center"
            >
              {error === "OAuthAccountNotLinked"
                ? t("oauthError")
                : t("genericError")}
            </motion.div>
          )}

          {/* Divider label */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-contrast/[0.08]" />
            <span className="text-caption-md text-text-muted uppercase tracking-[0.15em]">
              {t("continueWith")}
            </span>
            <div className="flex-1 h-px bg-contrast/[0.08]" />
          </div>

          {/* Google button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-body-md font-medium text-zinc-800 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </motion.button>

          {/* Terms */}
          <p className="mt-6 text-caption-md text-text-muted text-center leading-relaxed">
            {t.rich("termsNotice", {
              terms: (chunks) => <span className="text-text-secondary">{chunks}</span>,
              privacy: (chunks) => <span className="text-text-secondary">{chunks}</span>,
            })}
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-label-md text-text-secondary hover:text-text-primary transition-colors"
          >
            {t("backToHome")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
