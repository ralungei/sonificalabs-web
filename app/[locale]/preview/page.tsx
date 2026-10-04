"use client";
import { useState, useEffect } from "react";
import { JobStatus } from "@/components/JobStatus";
import { HeroWave } from "@/components/site/HeroWave";

const SEQUENCE = [
  { status: "generating", progress: "Generando guion con IA...", hold: 3000 },
  { status: "confirming", progress: "", hold: 2000 },
  { status: "queued", progress: "", hold: 2000 },
  { status: "producing", progress: "Produciendo...", hold: 3000 },
];

export default function PreviewPage() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIdx((prev) => (prev + 1) % SEQUENCE.length);
    }, SEQUENCE[idx].hold);
    return () => clearTimeout(timer);
  }, [idx]);

  const { status, progress } = SEQUENCE[idx];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 text-ink">
      <HeroWave active />
      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl">
        <JobStatus status={status} progress={progress} />
      </div>
    </main>
  );
}
