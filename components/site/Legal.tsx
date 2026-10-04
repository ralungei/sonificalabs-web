import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/** Shared layout for the privacy policy and the terms of use. */
export function LegalShell({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-ink">
      <Navbar />
      <article className="relative mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-10 px-[clamp(18px,4vw,48px)] pb-[clamp(64px,8vw,110px)] pt-[clamp(48px,7vw,96px)]">
        <div aria-hidden className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-[420px] w-[min(900px,120vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.12),transparent)]" />
        <header className="flex flex-col items-start gap-4">
          <h1 className="m-0 text-balance text-[clamp(40px,5vw,72px)] font-normal leading-[1.02] tracking-[-0.065em]">{title}</h1>
          <span className="rounded-full bg-surface-2 px-3 py-[5px] text-[13px] font-medium text-text-secondary">{lastUpdated}</span>
        </header>
        {children}
      </article>
      <Footer />
    </main>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 [&_p]:m-0 [&_p]:text-base [&_p]:leading-[1.6] [&_p]:text-text-secondary">
      <h2 className="m-0 text-[22px] font-medium tracking-[-0.035em]">{title}</h2>
      {children}
    </section>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-base leading-[1.6] text-text-secondary">
          <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
