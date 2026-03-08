"use client";
import { useEffect } from "react";

// Natural/humanist fonts from Google Fonts
const FONTS = [
  { name: "Quicksand", weight: "600" },
  { name: "Comfortaa", weight: "600" },
  { name: "Outfit", weight: "600" },
  { name: "Urbanist", weight: "600" },
];

function MicBold({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="m20.713 7.128-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M7 6a5 5 0 0 1 7.697-4.21l-1.08 1.682A3 3 0 0 0 9 6v6a3 3 0 1 0 6 0V7h2v5a5 5 0 0 1-10 0zm-4.808 7.962 1.962-.393a8.003 8.003 0 0 0 15.692 0l1.962.393C20.896 18.545 16.852 22 12 22s-8.896-3.455-9.808-8.038" />
    </svg>
  );
}

export default function LogoPreview() {
  useEffect(() => {
    const families = FONTS.map(f => `family=${f.name.replace(/ /g, "+")}:wght@${f.weight}`).join("&");
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <main className="min-h-screen bg-surface-0 px-6 py-12">
      <h1 className="text-3xl font-logo tracking-wide text-white text-center mb-2">
        Microphone Bold × Fuentes naturales
      </h1>
      <p className="text-sm text-white/50 text-center mb-16 font-mono">
        Google Fonts · Humanistas, redondeadas, orgánicas
      </p>

      <div className="max-w-5xl mx-auto space-y-12">
        {FONTS.map((font) => (
          <div key={font.name} className="flex flex-col items-center gap-5">
            <p className="text-[10px] text-white/25 font-mono uppercase tracking-widest">
              {font.name} ({font.weight})
            </p>

            {/* Big hero */}
            <div className="flex items-center gap-4">
              <MicBold className="h-14 w-14 text-white" />
              <span
                className="text-6xl sm:text-7xl tracking-[0.02em] text-white"
                style={{ fontFamily: `'${font.name}'`, fontWeight: font.weight }}
              >
                <span className="text-white">sonifica</span><span className="text-accent">labs</span>
              </span>
            </div>

            {/* Navbar */}
            <div className="flex items-center gap-2.5 bg-surface-1/60 border border-white/[0.06] rounded-xl px-5 py-2.5">
              <MicBold className="h-6 w-6 text-white flex-shrink-0" />
              <span
                className="text-xl tracking-[0.04em] text-white"
                style={{ fontFamily: `'${font.name}'`, fontWeight: font.weight }}
              >
                <span className="text-white">sonifica</span><span className="text-accent">labs</span>
              </span>
            </div>

            {/* Favicon size */}
            <div className="flex items-center gap-2">
              <MicBold className="h-4 w-4 text-white/70" />
              <span
                className="text-sm tracking-[0.02em] text-white/70"
                style={{ fontFamily: `'${font.name}'`, fontWeight: font.weight }}
              >
                <span className="text-white">sonifica</span><span className="text-accent">labs</span>
              </span>
            </div>

            <div className="border-b border-white/[0.04] w-full max-w-lg mt-1" />
          </div>
        ))}
      </div>
    </main>
  );
}
