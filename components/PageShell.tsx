"use client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Keyword, type KW_LINES } from "@/components/site/ui";

/** Header, soft glow, design title and footer shared by the plain content pages. */
export function PageShell({
  title,
  keyword,
  line = "amber",
  subtitle,
  children,
}: {
  title: string;
  keyword?: string;
  line?: keyof typeof KW_LINES;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col overflow-x-clip bg-white text-ink">
      <Navbar />

      <section className="relative px-[clamp(18px,4vw,48px)] pb-[clamp(32px,4vw,56px)] pt-[clamp(48px,7vw,96px)] text-center">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[45%] h-[520px] w-[min(1000px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.14),transparent)]" />
        <h1 className="relative m-0 text-balance text-[clamp(42px,6vw,89px)] font-normal leading-[1.02] tracking-[-0.07em] anim-rise" style={{ animationDelay: ".1s" }}>
          {title}{keyword && <> <Keyword underline="draw" line={line}>{keyword}</Keyword></>}
        </h1>
        {subtitle && (
          <p className="relative mx-auto mb-0 mt-[clamp(20px,2.5vw,28px)] max-w-[560px] text-[clamp(17px,1.5vw,20px)] leading-[1.45] text-text-secondary anim-rise" style={{ animationDelay: ".3s" }}>
            {subtitle}
          </p>
        )}
      </section>

      <div className="flex-1">{children}</div>

      <Footer />
    </main>
  );
}
