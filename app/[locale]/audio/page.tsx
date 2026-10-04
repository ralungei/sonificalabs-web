"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AudioBubble } from "@/components/site/AudioBubble";
import { stopDemo } from "@/components/site/demo-audio";

export default function AudioPage() {
  useEffect(() => () => stopDemo(), []);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-white text-ink">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[min(1000px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.18),transparent)]" />
      <Navbar />
      <div className="relative flex flex-1 items-center justify-center pb-[8vh]">
        <div style={{ animation: "bob 9s ease-in-out infinite" }}>
          <AudioBubble id="spot-sonificalabs" src="/spot.mp3" label="SonificaLabs" size={192} texture="/textures/informativo.mp4" />
        </div>
      </div>
    </main>
  );
}
