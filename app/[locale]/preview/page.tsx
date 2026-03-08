"use client";
import { useState, useEffect } from "react";
import { JobStatus } from "@/components/JobStatus";
import { BackgroundBeams } from "@/components/ui/background-beams";

const SEQUENCE = [
  { status: "generating", progress: "Generando guion con IA...", hold: 3000 },
  { status: "searching", progress: "Buscando en la web...", hold: 2500 },
  { status: "producing", progress: "Generando voz 1 de 3...", hold: 2000 },
  { status: "producing", progress: "Generando voz 2 de 3...", hold: 2000 },
  { status: "producing", progress: "Generando voz 3 de 3...", hold: 1500 },
  { status: "producing", progress: "Mezclando audio final...", hold: 2500 },
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
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden">
      <BackgroundBeams />
      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl">
        <JobStatus status={status} progress={progress} />
      </div>
    </main>
  );
}
