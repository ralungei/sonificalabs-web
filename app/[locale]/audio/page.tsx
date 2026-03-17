"use client";

import { Navbar } from "@/components/Navbar";
import { DemoCircle, NEUTRAL_TEXTURE, type Demo } from "@/components/DemoCircle";

const SPOT_DEMO: Demo = {
  id: "spot-sonificalabs",
  title: "SonificaLabs",
  icon: "🎙️",
  file: "/spot.mp3",
  texture: NEUTRAL_TEXTURE,
};

export default function AudioPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <Navbar />
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100dvh - 64px)" }}
      >
        <DemoCircle demo={SPOT_DEMO} delay={0.3} size={192} />
      </div>
    </div>
  );
}
