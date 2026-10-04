"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/components/Providers";
import type { PromptFormHandle } from "@/components/PromptForm";
import { Hero } from "@/components/landing/Hero";
import { Business, DemoRow, Features, Gift, Ideas, Inside, Problem, Solution } from "@/components/landing/Sections";
import { stopDemo } from "@/components/site/demo-audio";

/** Soft colour pools behind the whole page, as in the design. */
const GLOWS: [side: "left" | "right", offset: string, top: string, size: number, color: string][] = [
  ["left", "-12%", "40vh", 900, "rgba(45,212,191,.22)"],
  ["right", "-14%", "20vh", 800, "rgba(13,148,136,.12)"],
  ["right", "-10%", "150vh", 1000, "rgba(45,212,191,.16)"],
  ["left", "-16%", "260vh", 1100, "rgba(20,184,166,.14)"],
  ["right", "-12%", "380vh", 1000, "rgba(99,102,241,.08)"],
  ["left", "-10%", "500vh", 1000, "rgba(45,212,191,.16)"],
  ["right", "-10%", "620vh", 900, "rgba(13,148,136,.12)"],
];

function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return <div aria-hidden className="fixed left-0 top-0 z-[60] h-[3px] bg-[linear-gradient(90deg,#0f766e,#2dd4bf)]" style={{ width: `${pct}%` }} />;
}

export default function Home() {
  const t = useTranslations("home");
  const router = useRouter();
  const apiToken = useApiToken();
  const formRef = useRef<PromptFormHandle>(null);

  useEffect(() => () => stopDemo(), []);

  const handleSubmit = useCallback(
    async (prompt: string) => {
      let res: Response;
      try {
        res = await apiFetch("/produce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }, apiToken);
      } catch {
        throw new Error(t("serviceUnavailable"));
      }

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.setItem("sonificalabs_draft", prompt);
          window.location.href = "/signin?callbackUrl=/";
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
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || t("serviceUnavailable"));
      }

      stopDemo();
      const { jobId } = await res.json();
      router.push(`/p/${jobId}`);
    },
    [router, apiToken, t],
  );

  // Ideas, examples and the business cards drop their prompt in the hero box.
  const pick = useCallback((prompt: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    formRef.current?.setPrompt(prompt);
  }, []);

  // The bottom call to action produces straight away; empty, it just goes up.
  const createFromGift = useCallback((prompt: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!prompt) return;
    formRef.current?.setPrompt(prompt);
    setTimeout(() => formRef.current?.submitWith(prompt), 500);
  }, []);

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-white text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {GLOWS.map(([side, offset, top, size, color], i) => (
          <span key={i} className="absolute rounded-full"
            style={{ [side]: offset, top, width: size, height: size, background: `radial-gradient(closest-side,${color},transparent)` }} />
        ))}
      </div>
      <Navbar variant="home" />
      <ScrollProgress />
      <div className="relative z-[1]">
        <Hero formRef={formRef} onSubmit={handleSubmit} />
        <Problem />
        <Solution />
        <Ideas onPick={pick} />
        <DemoRow />
        <Features />
        <Inside onPick={pick} />
        <Business onPick={pick} />
        <Gift onCreate={createFromGift} />
        <Footer />
      </div>
    </main>
  );
}
