"use client";

const FONTS = [
  { name: "Falling", family: "Falling", src: "/fonts/falling.woff", format: "woff" },
  { name: "Ferron", family: "Ferron", src: "/fonts/ferron.otf", format: "opentype" },
  { name: "Thurkle", family: "Thurkle", src: "/fonts/thurkle.woff", format: "woff" },
  { name: "Ancola", family: "Ancola", src: "/fonts/ancola.woff2", format: "woff2" },
  { name: "Pogonia", family: "Pogonia", src: "/fonts/pogonia.woff", format: "woff" },
  { name: "Bebas Neue (actual)", family: "var(--font-logo)", src: "", format: "" },
];

function LogoSVG() {
  return (
    <svg viewBox="0 0 512 512" className="h-full w-full">
      <defs>
        <radialGradient id="fp-bg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f5a623" stopOpacity="0.5"/>
          <stop offset="50%" stopColor="#e8a838" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#141004"/>
        </radialGradient>
      </defs>
      <circle cx="256" cy="256" r="248" fill="url(#fp-bg)"/>
      <circle cx="256" cy="256" r="248" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
      <path d="M215,175 C207,169 198,174 198,184 L198,328 C198,338 207,343 215,337 L345,266 C353,261 353,251 345,246 Z" fill="#e8a838"/>
    </svg>
  );
}

export default function FontPreview() {
  return (
    <main className="min-h-screen bg-surface-0 px-6 py-12">
      {/* Load fonts */}
      <style>{`
        ${FONTS.filter(f => f.src).map(f => `
          @font-face {
            font-family: '${f.family}';
            src: url('${f.src}') format('${f.format}');
            font-display: swap;
          }
        `).join("")}
      `}</style>

      <h1 className="text-3xl font-logo tracking-wide text-white text-center mb-2">
        Font Preview
      </h1>
      <p className="text-sm text-white/50 text-center mb-16 font-mono">
        Cómo queda SONIFICALABS con cada fuente
      </p>

      <div className="max-w-5xl mx-auto space-y-16">
        {FONTS.map((font) => (
          <div key={font.name} className="space-y-6">
            {/* Font name label */}
            <p className="text-xs text-white/40 font-mono uppercase tracking-widest text-center">
              {font.name}
            </p>

            {/* Big hero text */}
            <p
              className="text-7xl sm:text-8xl md:text-9xl text-center tracking-[0.04em] bg-gradient-to-b from-accent-bright to-accent bg-clip-text text-transparent"
              style={{ fontFamily: font.src ? `'${font.family}'` : font.family }}
            >
              SONIFICALABS
            </p>

            {/* Navbar simulation */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2.5 bg-surface-1/60 border border-white/[0.06] rounded-xl px-5 py-2.5">
                <div className="h-7 w-7 flex-shrink-0">
                  <LogoSVG />
                </div>
                <span
                  className="text-2xl tracking-[0.06em] bg-gradient-to-b from-accent-bright to-accent bg-clip-text text-transparent"
                  style={{ fontFamily: font.src ? `'${font.family}'` : font.family }}
                >
                  SONIFICALABS
                </span>
              </div>
            </div>

            {/* Also show lowercase + subtitle context */}
            <div className="flex justify-center gap-10 text-center">
              <div>
                <p
                  className="text-4xl tracking-[0.04em] text-white/90 mb-1"
                  style={{ fontFamily: font.src ? `'${font.family}'` : font.family }}
                >
                  <span>sonifica</span><span style={{ color: "#e8a838" }}>labs</span>
                </p>
                <p className="text-[10px] text-white/30 font-mono">minúsculas</p>
              </div>
              <div>
                <p
                  className="text-4xl tracking-[0.04em] text-white/90 mb-1"
                  style={{ fontFamily: font.src ? `'${font.family}'` : font.family }}
                >
                  SonificaLabs
                </p>
                <p className="text-[10px] text-white/30 font-mono">capitalizada</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b border-white/[0.06]" />
          </div>
        ))}
      </div>
    </main>
  );
}
