"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

// ── Flow node primitives ──────────────────────────────────────

function Node({
  color,
  icon,
  title,
  children,
}: {
  color: "teal" | "violet" | "amber" | "sky" | "rose" | "neutral" | "emerald";
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  const palette: Record<string, { outer: string; text: string; iconBg: string }> = {
    teal:    { outer: "bg-teal-100",    text: "text-teal-700",    iconBg: "bg-teal-200" },
    violet:  { outer: "bg-violet-100",  text: "text-violet-700",  iconBg: "bg-violet-200" },
    amber:   { outer: "bg-amber-100",   text: "text-amber-700",   iconBg: "bg-amber-200" },
    sky:     { outer: "bg-sky-100",     text: "text-sky-700",     iconBg: "bg-sky-200" },
    rose:    { outer: "bg-rose-100",    text: "text-rose-700",    iconBg: "bg-rose-200" },
    neutral: { outer: "bg-neutral-900", text: "text-white",        iconBg: "bg-neutral-700" },
    emerald: { outer: "bg-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-200" },
  };
  const p = palette[color];
  return (
    <div className={`rounded-2xl ${p.outer} p-3`}>
      <div className="flex items-center gap-2.5 mb-2.5 px-1">
        <span className={`w-8 h-8 rounded-lg ${p.iconBg} flex items-center justify-center text-base font-semibold ${p.text}`}>{icon}</span>
        <span className={`text-[15px] font-semibold ${p.text} tracking-tight`}>{title}</span>
      </div>
      <div className="rounded-xl bg-white p-4 space-y-2 text-sm text-neutral-600 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-5 bg-neutral-300" />
      <svg width="10" height="8" viewBox="0 0 10 8" className="text-neutral-400">
        <path d="M5 8L0 0h10z" fill="currentColor" />
      </svg>
      {label && <span className="text-xs text-neutral-400 mt-0.5">{label}</span>}
    </div>
  );
}

function ParallelSplit({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-px w-px h-3 bg-neutral-300" />
      <div className="pt-3">
        <div className="mx-8 h-px bg-neutral-300" />
        <div className="grid grid-cols-2 gap-4 pt-3">
          {children}
        </div>
        <div className="mx-8 h-px bg-neutral-300 mt-3" />
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-px w-px h-3 bg-neutral-300" />
    </div>
  );
}

function Tag({ children, color = "neutral" }: { children: React.ReactNode; color?: string }) {
  const cls: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-500",
    teal: "bg-teal-100 text-teal-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
  };
  return <code className={`text-xs px-1.5 py-0.5 rounded font-mono ${cls[color] || cls.neutral}`}>{children}</code>;
}

// ── Prompt Raw Viewer ─────────────────────────────────────────

function PromptViewer({ apiToken }: { apiToken: string | null }) {
  const [plan, setPlan] = useState("free");
  const [prompts, setPrompts] = useState<{ escaleta: string; timing: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"escaleta" | "timing">("escaleta");

  const load = async (p: string) => {
    setPlan(p);
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/prompts?plan=${p}`, {}, apiToken);
      if (res.ok) setPrompts(await res.json());
    } catch {}
    setLoading(false);
  };

  if (!prompts) {
    return (
      <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/30 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-teal-600 font-medium">Ver system prompt raw tal cual se envia al modelo</p>
          <button
            onClick={() => load("free")}
            disabled={loading}
            className="text-sm px-3 py-1 rounded-md bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors font-medium"
          >
            {loading ? "Cargando..." : "Cargar prompt"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3 space-y-3">
      {/* Plan selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Plan:</span>
        {["free", "starter", "pro", "studio"].map((p) => (
          <button
            key={p}
            onClick={() => load(p)}
            disabled={loading}
            className={`text-sm px-2.5 py-1 rounded-md font-medium transition-colors ${
              plan === p ? "bg-teal-100 text-teal-700" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {p}
          </button>
        ))}
        {loading && <span className="text-xs text-neutral-400 animate-pulse">cargando...</span>}
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 w-fit">
        <button
          onClick={() => setTab("escaleta")}
          className={`text-sm px-3 py-1 rounded font-medium transition-colors ${
            tab === "escaleta" ? "bg-teal-100 text-teal-700" : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          Pass 1: Escaleta
        </button>
        <button
          onClick={() => setTab("timing")}
          className={`text-sm px-3 py-1 rounded font-medium transition-colors ${
            tab === "timing" ? "bg-violet-100 text-violet-700" : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          Pass 2: Timing
        </button>
      </div>

      {/* Prompt content */}
      <pre className="text-sm font-mono text-neutral-600 bg-neutral-50 rounded-lg p-4 overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed border border-neutral-200">
        {tab === "escaleta" ? prompts.escaleta : prompts.timing}
      </pre>

      <p className="text-xs text-neutral-400">
        {tab === "escaleta"
          ? `${prompts.escaleta.length.toLocaleString()} caracteres — incluye catalogo de voces, libreria de sonidos, instrucciones creativas`
          : `${prompts.timing.length.toLocaleString()} caracteres — reglas de timing y sincronizacion`}
      </p>
    </div>
  );
}

// ── Main Pipeline View ────────────────────────────────────────

export function PipelineView({ apiToken }: { apiToken: string | null }) {
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
        Flujo completo de una produccion, desde el prompt del usuario hasta el MP3 final.
        Cada nodo muestra el servicio, modelo, y datos que entran/salen.
      </p>

      {/* 1. User prompt */}
      <Node color="neutral" icon="1" title="Prompt del usuario">
        <p>El usuario escribe un prompt en lenguaje natural (max 3500 chars).</p>
        <p>Se extraen metadatos opcionales: <Tag>[Tipo: ...]</Tag> <Tag>[Duracion: ...]</Tag> <Tag>[Personajes: N]</Tag></p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Tag color="neutral">POST /produce</Tag>
          <Tag color="neutral">Auth JWT</Tag>
          <Tag color="neutral">Rate limit por IP</Tag>
        </div>
      </Node>

      <Arrow />

      {/* 2. Quota & validation */}
      <Node color="neutral" icon="2" title="Validacion y quota">
        <p>Se verifica el plan del usuario, creditos restantes, y limites.</p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 mt-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-400 text-left">
                <th className="font-medium pb-1">Plan</th>
                <th className="font-medium pb-1">Creditos</th>
                <th className="font-medium pb-1">Duracion</th>
                <th className="font-medium pb-1">Voces</th>
                <th className="font-medium pb-1">TTS</th>
                <th className="font-medium pb-1">Modelo IA</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr><td>Free</td><td>20</td><td>30s</td><td>2</td><td className="text-amber-600">flash_v2.5</td><td className="text-teal-600">flash-lite</td></tr>
              <tr><td>Starter</td><td>400</td><td>60s</td><td>3</td><td className="text-amber-600">flash_v2.5</td><td className="text-violet-600">pro</td></tr>
              <tr><td>Pro</td><td>2000</td><td>120s</td><td>4</td><td className="text-amber-600">eleven_v3</td><td className="text-violet-600">pro</td></tr>
              <tr><td>Studio</td><td>5000</td><td>120s</td><td>8</td><td className="text-amber-600">eleven_v3</td><td className="text-violet-600">pro</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-400 mt-1">Coste: <Tag>10 + voces * 5</Tag> creditos por produccion</p>
      </Node>

      <Arrow label="Job creado (nanoid 12)" />

      {/* 3. Pass 0: Planning + Search */}
      <Node color="emerald" icon="3" title="Pass 0 — Planificacion (IA + busqueda semantica)">
        <p className="font-medium text-emerald-700">Gemini analiza el prompt y busca los sonidos que necesita en la libreria.</p>
        <div className="space-y-1.5 mt-1">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Modelo</span>
            <span><Tag color="emerald">gemini-2.5-flash</Tag></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Tool</span>
            <div>
              <p><Tag color="emerald">search_sounds(query, category?, top_k?)</Tag></p>
              <p className="text-neutral-400 mt-0.5">Busqueda semantica via embeddings multimodales (Gemini Embedding 2, 768d). Gemini llama la tool multiples veces con queries especificas.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Entrada</span>
            <span>Prompt del usuario + catalogo de voces + tool de busqueda</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Salida</span>
            <span>Plan de produccion en texto natural con archivos seleccionados, voces, estructura narrativa y notas de direccion</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Tag color="emerald">generatePlan()</Tag>
          <Tag color="emerald">searchLibrary()</Tag>
          <Tag color="neutral">ai.ts</Tag>
          <Tag color="neutral">library.ts</Tag>
        </div>
        <div className="mt-2 rounded border border-emerald-200 bg-emerald-50/50 px-2 py-1.5">
          <p className="text-xs font-semibold text-emerald-600 mb-0.5">Embeddings:</p>
          <p className="text-sm">189 sonidos indexados con audio + texto (ruta, tags, mood, energy). Vectores en R2 <Tag>library/embeddings.json</Tag>. Similitud coseno en memoria, sin vector DB.</p>
        </div>
      </Node>

      <Arrow label="Plan + sonidos encontrados" />

      {/* 4. Pass 1: Escaleta */}
      <Node color="teal" icon="4" title="Pass 1 — Escaleta (IA generativa)">
        <p className="font-medium text-teal-700">Genera el guion estructurado con tracks de audio basandose en el plan.</p>
        <div className="space-y-1.5 mt-1">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Modelo</span>
            <span>Gemini segun plan (ver tabla arriba)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Entrada</span>
            <span>Prompt del usuario + plan de Pass 0 + sonidos encontrados</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">System</span>
            <div>
              <p>Contiene: catalogo de voces (23+), solo los sonidos pre-seleccionados por el planificador (no los 189), plan de produccion, limites del plan, instrucciones creativas</p>
              <p className="text-neutral-400 mt-0.5">Para <Tag color="amber">eleven_v3</Tag>: incluye audio tags (<Tag>[whispers]</Tag> <Tag>[excited]</Tag> <Tag>[tense]</Tag> etc.)</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Salida</span>
            <span>JSON <Tag color="teal">Escaleta</Tag> con array de tracks: type, text, voice_id, file, volume, effects, loop, speed</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Tag color="teal">generateEscaleta()</Tag>
          <Tag color="neutral">ai.ts</Tag>
        </div>

        {/* Interactive prompt viewer */}
        <PromptViewer apiToken={apiToken} />
      </Node>

      <Arrow label="Escaleta validada (voces filtradas por plan)" />

      {/* 4. Parallel: TTS + Library resolve */}
      <ParallelSplit>
        {/* Left: voice tracks */}
        <div>
          <Node color="amber" icon="5a" title="Voice tracks — ElevenLabs TTS">
            <p className="font-medium text-amber-700">Sintetiza cada track de voz en paralelo (batch de 4).</p>
            <div className="space-y-1.5 mt-1">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">API</span>
                <Tag color="amber">POST /v1/text-to-speech/&#123;voiceId&#125;/stream</Tag>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Modelo</span>
                <span><Tag color="amber">eleven_flash_v2_5</Tag> o <Tag color="amber">eleven_v3</Tag></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Params</span>
                <span>stability=0.5, similarity=0.75, speed=0.7-1.2</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Retry</span>
                <span>5 intentos, backoff exponencial (2s base)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Salida</span>
                <span><Tag>track-N.mp3</Tag> + upload a R2 (fire & forget)</span>
              </div>
            </div>
            <div className="mt-2 rounded border border-amber-200 bg-amber-50/50 px-2 py-1.5">
              <p className="text-xs font-semibold text-amber-600 mb-0.5">Post-proceso por track:</p>
              <p className="text-sm"><Tag>ffprobe</Tag> duracion + <Tag>ffmpeg ebur128</Tag> LUFS</p>
            </div>
          </Node>
        </div>

        {/* Right: library tracks */}
        <div>
          <Node color="sky" icon="5b" title="Library tracks — R2 / Filesystem">
            <p className="font-medium text-sky-700">Resuelve musica, SFX, ambience, stingers.</p>
            <div className="space-y-1.5 mt-1">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Origen</span>
                <div>
                  <p><Tag color="sky">R2</Tag> bucket <code className="text-xs">aircast</code>, prefix <code className="text-xs">library/</code></p>
                  <p className="text-neutral-400">Cache local: <code className="text-xs">/tmp/sonificalabs-library/</code></p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Indice</span>
                <span><Tag color="sky">library-index.json</Tag> con paths, duraciones, tags, mood, energy</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Lookup</span>
                <span>Match exacto por relativePath, fallback fuzzy</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-400 shrink-0 w-12">Salida</span>
                <span>Path local al archivo de audio para FFmpeg</span>
              </div>
            </div>
            <div className="mt-2 rounded border border-sky-200 bg-sky-50/50 px-2 py-1.5">
              <p className="text-xs font-semibold text-sky-600 mb-0.5">Post-proceso por track:</p>
              <p className="text-sm"><Tag>ffprobe</Tag> duracion + <Tag>ffmpeg ebur128</Tag> LUFS (max 90s sample)</p>
            </div>
          </Node>
        </div>
      </ParallelSplit>

      <Arrow />

      {/* 6. LUFS check */}
      <Node color="neutral" icon="6" title="Check LUFS disparity">
        <p>Compara loudness (LUFS) entre voice tracks. Si alguno difiere {">"}4dB de la mediana, se logea un warning para debug.</p>
      </Node>

      <Arrow />

      {/* 7. Pass 2: Timing */}
      <Node color="violet" icon="7" title="Pass 2 — Timing (IA generativa)">
        <p className="font-medium text-violet-700">La IA asigna posiciones temporales exactas a cada track.</p>
        <div className="space-y-1.5 mt-1">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Modelo</span>
            <span>Mismo modelo que Pass 1 (segun plan)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Entrada</span>
            <div>
              <p>Prompt original + lista de tracks enriquecidos con:</p>
              <p className="text-neutral-400"><Tag>track_index</Tag> <Tag>type</Tag> <Tag>actual_duration_ms</Tag> <Tag>text</Tag> <Tag>file</Tag> <Tag>volume</Tag> <Tag>effects</Tag> <Tag>loop</Tag></p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-neutral-400 shrink-0 w-14">Salida</span>
            <div>
              <p>Array de <Tag color="violet">TimingDecision</Tag>:</p>
              <p className="text-neutral-400"><Tag>track_index</Tag> <Tag>start_ms</Tag> <Tag>trim_start?</Tag> <Tag>trim_end?</Tag> <Tag>fade_in_ms?</Tag> <Tag>fade_out_ms?</Tag></p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Tag color="violet">generateTiming()</Tag>
          <Tag color="neutral">ai.ts</Tag>
        </div>
      </Node>

      <Arrow />

      {/* 8. Safety net */}
      <Node color="neutral" icon="8" title="Safety net: overlaps y crossfades">
        <p>Corrige solapamientos de voces que el timing de IA pueda haber introducido.</p>
        <div className="space-y-1 mt-1">
          <p><Tag>VOICE_GAP_MS = 400</Tag> espacio minimo entre voces</p>
          <p><Tag>CROSSFADE_THRESHOLD = 600ms</Tag> si gap {"<"} 600ms, aplica crossfade (40ms overlap, 80ms fade)</p>
          <p>Tracks no-voice (sfx, stinger) rompen la cadena de crossfade</p>
        </div>
      </Node>

      <Arrow />

      {/* 9. FFmpeg mix */}
      <Node color="rose" icon="9" title="Mix — FFmpeg filter graph">
        <p className="font-medium text-rose-700">Construye un filter graph complejo y mezcla todo en un MP3.</p>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 mt-2 space-y-2.5">
          <div>
            <p className="text-xs font-bold text-neutral-400 mb-1">POR CADA TRACK:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <p><Tag>atrim</Tag> recorte start/end</p>
              <p><Tag>silenceremove</Tag> (no-voice)</p>
              <p><Tag>highpass=80Hz</Tag> (voice)</p>
              <p><Tag>acompressor</Tag> (voice)</p>
              <p><Tag>highshelf=6kHz:-2dB</Tag> de-esser (voice)</p>
              <p><Tag>eq_preset</Tag> telephone/radio/etc</p>
              <p><Tag>loudnorm</Tag> LUFS target (-16 voz, -20 bg)</p>
              <p><Tag>afade</Tag> in/out</p>
              <p><Tag>aformat</Tag> 44100Hz stereo fltp</p>
              <p><Tag>pan</Tag> stereo L/R</p>
              <p><Tag>adelay</Tag> posicion temporal</p>
              <p><Tag>volume ducking</Tag> determinista</p>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-2">
            <p className="text-xs font-bold text-neutral-400 mb-1">DUCKING (tracks de fondo cuando hay voz):</p>
            <p className="text-sm"><Tag>duck_on_voice=true</Tag> o <Tag>stinger</Tag> reduce a 0.45x | otros reduce a 0.70x</p>
            <p className="text-sm text-neutral-400">Attack 0.3s, Release 0.5s, calculado con timings de voz</p>
          </div>

          <div className="border-t border-neutral-200 pt-2">
            <p className="text-xs font-bold text-neutral-400 mb-1">MIX BUS FINAL:</p>
            <div className="space-y-0.5 text-sm">
              <p>Voice bus: <Tag>amix</Tag> normalize=0</p>
              <p>Background bus: peso 0.8x + <Tag>amix</Tag></p>
              <p>Master: <Tag>highpass=20Hz</Tag> + <Tag>alimiter</Tag> limit=0.89 attack=5ms release=50ms</p>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-2">
            <p className="text-xs font-bold text-neutral-400 mb-1">BG TRACK TRIMMING:</p>
            <p className="text-sm">Duracion = max(voz+sfx+stinger) + 1s tail + fade_out. Looped tracks recortados sin problema.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <Tag color="rose">buildFilterGraph()</Tag>
          <Tag color="rose">runFFmpegMix()</Tag>
          <Tag color="neutral">mixer.ts</Tag>
          <Tag>libmp3lame -q:a 0</Tag>
        </div>
      </Node>

      <Arrow />

      {/* 10. Upload & persist */}
      <Node color="sky" icon="10" title="Upload y persistencia">
        <div className="space-y-1.5">
          <p><Tag color="sky">R2</Tag> Upload <code className="text-xs">&#123;jobId&#125;/mix.mp3</code></p>
          <p><Tag color="neutral">D1</Tag> Log produccion: email, prompt, escaleta, timing, tracks, duracion, creditos, modelo, prompts enviados</p>
          <p><Tag color="neutral">Credits</Tag> Deduccion de creditos del usuario</p>
          <p><Tag color="neutral">Job</Tag> status = <code className="text-xs text-emerald-600">&quot;done&quot;</code> con audioUrl + tracks serializados para timeline</p>
        </div>
      </Node>

      <Arrow />

      {/* 11. SSE delivery */}
      <Node color="neutral" icon="11" title="Entrega al cliente (SSE)">
        <p>El cliente recibe actualizaciones en tiempo real via Server-Sent Events.</p>
        <div className="space-y-1 mt-1">
          <p><Tag>GET /p/:id/stream</Tag> EventSource unidireccional</p>
          <p>Envia: status, progress, completedSteps, escaleta (1 vez), timing (1 vez), audioUrl, tracks</p>
          <p className="text-neutral-400">El frontend muestra pipeline reveal + player + timeline al completar.</p>
        </div>
      </Node>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <p className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3">Servicios externos</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> Gemini (IA generativa)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Gemini Embedding 2 (busqueda semantica)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> ElevenLabs (TTS)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> Cloudflare R2 (storage)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> FFmpeg (local)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-400" /> Cloudflare D1 (database)</span>
        </div>
      </div>
    </div>
  );
}
